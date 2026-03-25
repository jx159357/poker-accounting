import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Game } from '../entities/game.entity';
import { GamePlayer } from '../entities/game-player.entity';
import { GameRecord } from '../entities/game-record.entity';
import { User } from '../entities/user.entity';
import { AchievementService } from './achievement.service';

type AuthenticatedUser = {
  userId: number;
  username: string;
  nickname?: string;
} | null | undefined;

@Injectable()
export class GameService {
  private readonly logger = new Logger(GameService.name);

  constructor(
    @InjectRepository(Game)
    private gameRepository: Repository<Game>,
    @InjectRepository(GamePlayer)
    private playerRepository: Repository<GamePlayer>,
    @InjectRepository(GameRecord)
    private recordRepository: Repository<GameRecord>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private achievementService: AchievementService,
  ) {}

  // 标准的游戏查询 relations（包含 user 以支持前端身份匹配）
  private readonly gameRelations = [
    'players',
    'players.user',
    'gameRecords',
    'gameRecords.fromPlayer',
    'gameRecords.fromPlayer.user',
    'gameRecords.toPlayer',
    'gameRecords.toPlayer.user',
  ];

  // 生成唯一房间号（重试机制，确保全表唯一）
  private async generateUniqueRoomCode(): Promise<string> {
    for (let i = 0; i < 20; i++) {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const existing = await this.gameRepository.findOne({
        where: { roomCode: code },
      });
      if (!existing) return code;
    }

    for (let i = 0; i < 10; i++) {
      const fallbackCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      const existing = await this.gameRepository.findOne({
        where: { roomCode: fallbackCode },
      });
      if (!existing) return fallbackCode;
    }

    throw new BadRequestException('房间号生成失败，请稍后重试');
  }

  // 从前端标识 "user_username" 解析为数据库 userId
  private async resolveUserId(playerIdentifier: string): Promise<number | null> {
    if (!playerIdentifier || !playerIdentifier.startsWith('user_')) return null;
    const username = playerIdentifier.replace('user_', '');
    const user = await this.userRepository.findOne({ where: { username } });
    return user?.id ?? null;
  }

  // 获取玩家唯一标识（与前端 getPlayerId() 格式一致）
  private getPlayerIdentifier(player: {
    userId?: number;
    guestId?: string;
    user?: { username?: string };
  }): string {
    if (player.userId && player.user?.username) {
      return `user_${player.user.username}`;
    }
    return player.guestId || '';
  }

  private getAuthenticatedRequesterId(authUser?: AuthenticatedUser): string {
    if (!authUser?.username) return '';
    return `user_${authUser.username}`;
  }

  private async normalizeActor(
    playerId: string,
    playerType: string,
    authUser?: AuthenticatedUser,
  ): Promise<{ playerId: string; playerType: 'user' | 'guest' }> {
    if (authUser?.userId) {
      return {
        playerId: this.getAuthenticatedRequesterId(authUser),
        playerType: 'user',
      };
    }

    if (!playerId || !playerType) {
      throw new BadRequestException('请提供玩家身份信息');
    }

    if (playerType === 'user') {
      throw new ForbiddenException('登录后才能以注册用户身份操作');
    }

    return {
      playerId,
      playerType: 'guest',
    };
  }

  private assertPlayerCanAct(
    player: Pick<GamePlayer, 'userId' | 'guestId'>,
    authUser?: AuthenticatedUser,
    requesterId?: string,
  ): void {
    if (player.userId) {
      if (!authUser?.userId) {
        throw new ForbiddenException('登录后才能操作注册用户数据');
      }
      if (player.userId !== authUser.userId) {
        throw new ForbiddenException('无权操作该玩家');
      }
      return;
    }

    if (!requesterId || player.guestId !== requesterId) {
      throw new ForbiddenException('无权操作该玩家');
    }
  }

  private assertCanManageGame(
    game: Pick<Game, 'userId' | 'guestId'>,
    authUser?: AuthenticatedUser,
    requesterId?: string,
  ): void {
    if (game.userId) {
      if (!authUser?.userId) {
        throw new ForbiddenException('登录后才能操作该房间');
      }
      if (game.userId !== authUser.userId) {
        throw new ForbiddenException('只有创建者可以操作房间');
      }
      return;
    }

    if (!requesterId || game.guestId !== requesterId) {
      throw new ForbiddenException('只有创建者可以操作房间');
    }
  }

  // 为统计场景提供稳定的玩家标识，避免同名玩家被错误合并
  private getStatsPlayerIdentifier(player: {
    id?: number;
    name?: string;
    userId?: number;
    guestId?: string;
    user?: { username?: string };
  }): string {
    const identifier = this.getPlayerIdentifier(player);
    if (identifier) return identifier;
    if (player.id) return `player_${player.id}`;
    return player.name ? `name_${player.name}` : 'unknown';
  }

  // 计算我与某个对手在单局中的直接净输赢
  private getHeadToHeadNetScore(
    myPlayerId: number,
    opponentPlayerId: number,
    gameRecords: GameRecord[] = [],
  ): number {
    const netScore = gameRecords.reduce((sum, record) => {
      const amount = Number(record.amount);
      if (record.fromPlayer?.id === myPlayerId && record.toPlayer?.id === opponentPlayerId) {
        return sum - amount;
      }
      if (record.fromPlayer?.id === opponentPlayerId && record.toPlayer?.id === myPlayerId) {
        return sum + amount;
      }
      return sum;
    }, 0);

    return Number(netScore.toFixed(2));
  }

  // 映射 Player 实体为安全的响应对象（去掉 game 循环引用、去掉密码）
  private mapPlayer(p: GamePlayer): any {
    return {
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      userId: p.userId,
      guestId: p.guestId,
      balance: p.balance,
      joinedAt: p.joinedAt,
      user: p.user
        ? { id: p.user.id, username: p.user.username, nickname: p.user.nickname }
        : undefined,
    };
  }

  // 为游戏响应添加 creatorId 字段、去除循环引用和敏感数据
  private async enrichGameResponse(game: Game): Promise<any> {
    let creatorId: string | null = null;
    if (game.userId) {
      const creator = await this.userRepository.findOne({ where: { id: game.userId } });
      creatorId = creator ? `user_${creator.username}` : null;
    } else if (game.guestId) {
      creatorId = game.guestId;
    }

    return {
      id: game.id,
      name: game.name,
      roomCode: game.roomCode,
      gameType: game.gameType,
      status: game.status,
      userId: game.userId,
      guestId: game.guestId,
      creatorId,
      createdAt: game.createdAt,
      updatedAt: game.updatedAt,
      players: (game.players || []).map((p) => this.mapPlayer(p)),
      gameRecords: (game.gameRecords || []).map((r) => ({
        id: r.id,
        amount: r.amount,
        note: r.note,
        createdAt: r.createdAt,
        fromPlayer: r.fromPlayer ? this.mapPlayer(r.fromPlayer) : undefined,
        toPlayer: r.toPlayer ? this.mapPlayer(r.toPlayer) : undefined,
      })),
    };
  }

  // 创建游戏
  async createGame(
    name: string,
    gameType: string,
    creatorId: string,
    creatorType: string,
    nickname: string,
    authUser?: AuthenticatedUser,
  ): Promise<any> {
    const actor = await this.normalizeActor(creatorId, creatorType, authUser);

    // 游客房间数量限制（仅限创建的房间）
    if (actor.playerType === 'guest') {
      const activeGuestGames = await this.gameRepository.count({
        where: { guestId: actor.playerId, status: 'active' },
      });
      if (activeGuestGames >= 3) {
        throw new BadRequestException('GUEST_LIMIT_REACHED');
      }
    }

    const roomCode = await this.generateUniqueRoomCode();

    const game = new Game();
    game.name = name;
    game.gameType = gameType;
    game.roomCode = roomCode;
    game.status = 'active';

    if (actor.playerType === 'user') {
      const userId =
        authUser?.userId || (await this.resolveUserId(actor.playerId));
      if (!userId) {
        throw new BadRequestException('用户不存在');
      }
      game.userId = userId;
    } else {
      game.guestId = actor.playerId;
    }

    const savedGame = await this.gameRepository.save(game);

    // 创建者自动加入
    const player = new GamePlayer();
    player.game = savedGame;
    player.name = nickname;
    player.balance = 0;

    if (actor.playerType === 'user') {
      player.userId = game.userId;
    } else {
      player.guestId = actor.playerId;
    }

    await this.playerRepository.save(player);

    const fullGame = await this.gameRepository.findOne({
      where: { id: savedGame.id },
      relations: this.gameRelations,
    });

    return this.enrichGameResponse(fullGame);
  }

  // 加入游戏
  async joinGame(
    roomCode: string,
    nickname: string,
    playerId: string,
    playerType: string,
    authUser?: AuthenticatedUser,
  ): Promise<any> {
    const actor = await this.normalizeActor(playerId, playerType, authUser);

    const game = await this.gameRepository.findOne({
      where: { roomCode },
      relations: this.gameRelations,
    });

    if (!game) {
      throw new NotFoundException('房间不存在');
    }

    if (game.status !== 'active') {
      throw new BadRequestException('游戏已结束');
    }

    // 检查是否已加入（使用与前端一致的标识格式）
    const existingPlayer = game.players.find((p) => {
      const identifier = this.getPlayerIdentifier(p);
      return identifier === actor.playerId;
    });

    if (existingPlayer) {
      return this.enrichGameResponse(game);
    }

    // 创建新玩家
    const player = new GamePlayer();
    player.game = game;
    player.name = nickname;
    player.balance = 0;

    if (actor.playerType === 'user') {
      const userId =
        authUser?.userId || (await this.resolveUserId(actor.playerId));
      if (!userId) {
        throw new BadRequestException('用户不存在');
      }
      player.userId = userId;
    } else {
      player.guestId = actor.playerId;
    }

    await this.playerRepository.save(player);

    const updatedGame = await this.gameRepository.findOne({
      where: { id: game.id },
      relations: this.gameRelations,
    });

    return this.enrichGameResponse(updatedGame);
  }

  // 获取游戏详情
  async getGameDetail(roomCode: string): Promise<any> {
    const game = await this.gameRepository.findOne({
      where: { roomCode },
      relations: this.gameRelations,
      order: {
        gameRecords: {
          createdAt: 'DESC',
        },
      },
    });

    if (!game) {
      throw new NotFoundException('房间不存在');
    }

    return this.enrichGameResponse(game);
  }

  // 获取我的游戏列表
  async getMyGames(
    playerId: string,
    playerType: string,
    filters?: { gameType?: string; status?: string; recentDays?: number; limit?: number },
    authUser?: AuthenticatedUser,
  ): Promise<any[]> {
    if (!playerId && !authUser?.userId) {
      return [];
    }

    try {
      const baseWhere: any = {};
      const actor = await this.normalizeActor(playerId, playerType, authUser);
      const recentDays =
        typeof filters?.recentDays === 'number' && filters.recentDays > 0
          ? filters.recentDays
          : actor.playerType === 'guest'
            ? 7
            : 30;
      const recentThreshold = new Date(
        Date.now() - recentDays * 24 * 60 * 60 * 1000,
      );

      if (actor.playerType === 'user') {
        const userId =
          authUser?.userId || (await this.resolveUserId(actor.playerId));
        if (!userId) return [];
        baseWhere.userId = userId;
      } else {
        baseWhere.guestId = actor.playerId;
      }

      let players = await this.playerRepository.find({
        where: baseWhere,
        relations: ['game', 'game.players'],
        order: {
          game: {
            createdAt: 'DESC',
          },
        },
      });

      // 按筛选条件过滤
      if (filters?.gameType) {
        players = players.filter(p => p.game.gameType === filters.gameType);
      }

      if (filters?.status === 'active') {
        players = players.filter((p) => p.game.status === 'active');
      } else if (filters?.status === 'ended') {
        players = players.filter(
          (p) =>
            p.game.status === 'ended' &&
            new Date(p.game.createdAt) >= recentThreshold,
        );
      } else {
        players = players.filter(
          (p) =>
            p.game.status === 'active' ||
            new Date(p.game.createdAt) >= recentThreshold,
        );
      }

      players.sort((a, b) => {
        if (a.game.status !== b.game.status) {
          return a.game.status === 'active' ? -1 : 1;
        }
        return (
          new Date(b.game.createdAt).getTime() -
          new Date(a.game.createdAt).getTime()
        );
      });

      const limit =
        typeof filters?.limit === 'number' && filters.limit > 0
          ? filters.limit
          : actor.playerType === 'guest'
            ? 40
            : 80;

      return players.slice(0, limit).map((player) => ({
        id: player.game.id,
        name: player.game.name,
        roomCode: player.game.roomCode,
        gameType: player.game.gameType,
        status: player.game.status,
        playerCount: player.game.players.length,
        myScore: player.balance,
        createdAt: player.game.createdAt,
      }));
    } catch (error) {
      console.error('Error in getMyGames:', error);
      return [];
    }
  }

  // 添加积分记录
  async addScore(
    roomCode: string,
    fromPlayerId: number,
    toPlayerId: number,
    score: number,
    note?: string,
    requesterId?: string,
    authUser?: AuthenticatedUser,
  ): Promise<GameRecord> {
    const game = await this.gameRepository.findOne({
      where: { roomCode },
      relations: ['players'],
    });

    if (!game) {
      throw new NotFoundException('房间不存在');
    }

    if (game.status !== 'active') {
      throw new BadRequestException('游戏已结束');
    }

    const fromPlayer = await this.playerRepository.findOne({
      where: { id: fromPlayerId },
    });

    const toPlayer = await this.playerRepository.findOne({
      where: { id: toPlayerId },
    });

    if (!fromPlayer || !toPlayer) {
      throw new NotFoundException('玩家不存在');
    }

    const gamePlayerIds = new Set(game.players.map((player) => player.id));
    if (!gamePlayerIds.has(fromPlayerId) || !gamePlayerIds.has(toPlayerId)) {
      throw new BadRequestException('玩家不在当前房间中');
    }

    this.assertPlayerCanAct(fromPlayer, authUser, requesterId);

    if (fromPlayerId === toPlayerId) {
      throw new BadRequestException('不能给自己转分');
    }

    const record = new GameRecord();
    record.game = game;
    record.fromPlayer = fromPlayer;
    record.toPlayer = toPlayer;
    record.amount = score;
    record.note = note;

    await this.recordRepository.save(record);

    fromPlayer.balance = Number(fromPlayer.balance) - Number(score);
    toPlayer.balance = Number(toPlayer.balance) + Number(score);

    await this.playerRepository.save([fromPlayer, toPlayer]);

    return await this.recordRepository.findOne({
      where: { id: record.id },
      relations: ['fromPlayer', 'toPlayer'],
    });
  }

  // 撤销积分记录
  async undoScore(
    roomCode: string,
    recordId: number,
    requesterId: string,
    authUser?: AuthenticatedUser,
  ): Promise<void> {
    const game = await this.gameRepository.findOne({
      where: { roomCode },
      relations: ['players'],
    });

    if (!game) {
      throw new NotFoundException('房间不存在');
    }

    if (game.status !== 'active') {
      throw new BadRequestException('游戏已结束');
    }

    const record = await this.recordRepository.findOne({
      where: { id: recordId },
      relations: ['fromPlayer', 'fromPlayer.user', 'toPlayer'],
    });

    if (!record) {
      throw new NotFoundException('记录不存在');
    }

    this.assertPlayerCanAct(record.fromPlayer, authUser, requesterId);

    record.fromPlayer.balance =
      Number(record.fromPlayer.balance) + Number(record.amount);
    record.toPlayer.balance =
      Number(record.toPlayer.balance) - Number(record.amount);

    await this.playerRepository.save([record.fromPlayer, record.toPlayer]);
    await this.recordRepository.remove(record);
  }

  // 更新玩家昵称
  async updatePlayerNickname(
    roomCode: string,
    playerId: number,
    newNickname: string,
    requesterId?: string,
    authUser?: AuthenticatedUser,
  ): Promise<GamePlayer> {
    const game = await this.gameRepository.findOne({
      where: { roomCode },
      relations: ['players'],
    });

    if (!game) {
      throw new NotFoundException('房间不存在');
    }

    const player = game.players.find((p) => p.id === playerId);

    if (!player) {
      throw new NotFoundException('玩家不存在');
    }

    this.assertPlayerCanAct(player, authUser, requesterId);

    player.name = newNickname;
    await this.playerRepository.save(player);

    return player;
  }

  // 结束游戏
  async endGame(
    roomCode: string,
    requesterId?: string,
    authUser?: AuthenticatedUser,
  ): Promise<any> {
    const game = await this.gameRepository.findOne({
      where: { roomCode },
      relations: ['players'],
    });

    if (!game) {
      throw new NotFoundException('房间不存在');
    }

    this.assertCanManageGame(game, authUser, requesterId);

    game.status = 'ended';
    await this.gameRepository.save(game);

    // 结束游戏后检查成就
    for (const player of game.players) {
      if (player.userId) {
        try {
          await this.achievementService.checkAndUnlockAchievements(player.userId);
        } catch (error) {
          console.error(`Achievement check failed for user ${player.userId}:`, error);
        }
      }
    }

    const finalScores = game.players
      .sort((a, b) => Number(b.balance) - Number(a.balance))
      .map((p) => ({
        playerId: p.id,
        nickname: p.name,
        score: p.balance,
      }));

    return {
      message: '游戏已结束',
      finalScores,
    };
  }

  // 删除游戏
  async deleteGame(
    roomCode: string,
    requesterId?: string,
    authUser?: AuthenticatedUser,
  ): Promise<void> {
    const game = await this.gameRepository.findOne({
      where: { roomCode },
    });

    if (!game) {
      throw new NotFoundException('房间不存在');
    }

    this.assertCanManageGame(game, authUser, requesterId);

    await this.gameRepository.remove(game);
  }

  // 编辑游戏信息
  async updateGame(
    roomCode: string,
    userId: number,
    data: { name?: string; gameType?: string },
  ): Promise<any> {
    const game = await this.gameRepository.findOne({
      where: { roomCode },
      relations: this.gameRelations,
    });

    if (!game) {
      throw new NotFoundException('房间不存在');
    }

    if (game.status !== 'active') {
      throw new BadRequestException('游戏已结束，无法编辑');
    }

    if (game.userId !== userId) {
      throw new ForbiddenException('只有创建者可以编辑游戏');
    }

    if (data.name) {
      game.name = data.name;
    }
    if (data.gameType) {
      game.gameType = data.gameType;
    }

    await this.gameRepository.save(game);

    // 重新查询确保 relations 完整
    const updatedGame = await this.gameRepository.findOne({
      where: { roomCode },
      relations: this.gameRelations,
    });
    return this.enrichGameResponse(updatedGame);
  }

  // 获取统计数据
  async getStats(playerId: string, playerType: string): Promise<any> {
    const emptyStats = {
      totalGames: 0,
      totalWins: 0,
      totalLosses: 0,
      totalDraws: 0,
      winRate: 0,
      totalScore: 0,
      playerType: playerType || 'guest',
      gameTypeStats: [],
      recentGames: [],
      scoreHistory: [],
      maxScore: 0,
      minScore: 0,
      avgScore: 0,
      activeDays: 0,
      firstGameDate: null,
      currentStreak: { type: 'none', count: 0 },
      bestStreak: 0,
    };

    if (!playerId || !playerType) {
      return emptyStats;
    }

    let players: GamePlayer[];

    try {
      if (playerType === 'user') {
        const userId = await this.resolveUserId(playerId);
        if (!userId) return emptyStats;

        players = await this.playerRepository.find({
          where: { userId },
          relations: ['game'],
          order: {
            game: {
              createdAt: 'DESC',
            },
          },
        });
      } else {
        players = await this.playerRepository.find({
          where: { guestId: playerId },
          relations: ['game'],
          order: {
            game: {
              createdAt: 'DESC',
            },
          },
        });

        // 游客只统计 7 天内的数据
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        players = players.filter(
          (p) => new Date(p.game.createdAt) >= sevenDaysAgo,
        );
      }

      // 统计数据仅计已结束的游戏
      const endedPlayers = players.filter(
        (p) => p.game.status === 'ended',
      );

      const totalGames = endedPlayers.length;
      const totalWins = endedPlayers.filter(
        (p) => Number(p.balance) > 0,
      ).length;
      const totalLosses = endedPlayers.filter(
        (p) => Number(p.balance) < 0,
      ).length;
      const totalDraws = endedPlayers.filter(
        (p) => Number(p.balance) === 0,
      ).length;
      const winRate =
        totalGames > 0 ? ((totalWins / totalGames) * 100).toFixed(1) : 0;
      const totalScore = endedPlayers.reduce(
        (sum, p) => sum + Number(p.balance),
        0,
      );

      // 按游戏类型统计（仅已结束）
      const gameTypeMap = new Map();
      endedPlayers.forEach((p) => {
        const type = p.game.gameType;
        if (!gameTypeMap.has(type)) {
          gameTypeMap.set(type, {
            gameType: type,
            count: 0,
            totalScore: 0,
            wins: 0,
          });
        }
        const stat = gameTypeMap.get(type);
        stat.count++;
        stat.totalScore += Number(p.balance);
        if (Number(p.balance) > 0) stat.wins++;
      });

      const gameTypeStats = Array.from(gameTypeMap.values()).map((stat) => ({
        ...stat,
        winRate:
          stat.count > 0 ? ((stat.wins / stat.count) * 100).toFixed(1) : 0,
      }));

      // 最近游戏（包含进行中和已结束，方便用户查看）
      const recentGames = players.slice(0, 10).map((p) => ({
        id: p.game.id,
        name: p.game.name,
        roomCode: p.game.roomCode,
        gameType: p.game.gameType,
        score: p.balance,
        status: p.game.status,
        createdAt: p.game.createdAt,
      }));

      // 积分历史（仅注册用户，仅已结束游戏）
      let scoreHistory: { date: string; cumulativeScore: number }[] = [];
      if (playerType === 'user') {
        const sortedPlayers = [...endedPlayers].sort(
          (a, b) =>
            new Date(a.game.createdAt).getTime() -
            new Date(b.game.createdAt).getTime(),
        );

        const dateScoreMap = new Map<string, number>();
        sortedPlayers.forEach((p) => {
          const date = new Date(p.game.createdAt).toISOString().split('T')[0];
          const current = dateScoreMap.get(date) || 0;
          dateScoreMap.set(date, current + Number(p.balance));
        });

        let cumulative = 0;
        scoreHistory = Array.from(dateScoreMap.entries()).map(
          ([date, dailyScore]) => {
            cumulative += dailyScore;
            return { date, cumulativeScore: cumulative };
          },
        );
      }

      // 高级统计 - 仅注册用户
      const balances = endedPlayers.map(p => Number(p.balance));
      let advancedStats: any = {};
      if (playerType === 'user' && totalGames > 0) {
        const maxScore = Math.max(...balances);
        const minScore = Math.min(...balances);
        const avgScore = Math.round((totalScore / totalGames) * 10) / 10;

        // 活跃天数
        const activeDays = new Set(
          endedPlayers.map(p => new Date(p.game.createdAt).toISOString().split('T')[0])
        ).size;

        // 首次游戏日期
        const sortedByDate = [...endedPlayers].sort(
          (a, b) => new Date(a.game.createdAt).getTime() - new Date(b.game.createdAt).getTime()
        );
        const firstGameDate = sortedByDate.length > 0 ? sortedByDate[0].game.createdAt : null;

        // 当前连胜/连败 - 按时间倒序
        const reverseSorted = [...endedPlayers].sort(
          (a, b) => new Date(b.game.createdAt).getTime() - new Date(a.game.createdAt).getTime()
        );
        let currentStreak = { type: 'none' as 'win' | 'loss' | 'none', count: 0 };
        if (reverseSorted.length > 0) {
          const firstBalance = Number(reverseSorted[0].balance);
          if (firstBalance > 0) {
            currentStreak.type = 'win';
            for (const p of reverseSorted) {
              if (Number(p.balance) > 0) currentStreak.count++;
              else break;
            }
          } else if (firstBalance < 0) {
            currentStreak.type = 'loss';
            for (const p of reverseSorted) {
              if (Number(p.balance) < 0) currentStreak.count++;
              else break;
            }
          }
        }

        // 最长连胜 - 按时间正序
        let bestStreak = 0;
        let tempStreak = 0;
        for (const p of sortedByDate) {
          if (Number(p.balance) > 0) {
            tempStreak++;
            bestStreak = Math.max(bestStreak, tempStreak);
          } else {
            tempStreak = 0;
          }
        }

        advancedStats = {
          maxScore,
          minScore,
          avgScore,
          activeDays,
          firstGameDate,
          currentStreak,
          bestStreak,
        };
      }

      return {
        totalGames,
        totalWins,
        totalLosses,
        totalDraws,
        winRate,
        totalScore,
        playerType,
        gameTypeStats,
        recentGames,
        scoreHistory,
        ...advancedStats,
      };
    } catch (error) {
      console.error('Error in getStats:', error);
      return emptyStats;
    }
  }

  // 获取对手统计数据
  async getOpponentStats(playerId: string, playerType: string): Promise<any[]> {
    if (!playerId || !playerType) return [];

    try {
      let userId: number | null = null;
      let guestId: string | null = null;

      if (playerType === 'user') {
        userId = await this.resolveUserId(playerId);
        if (!userId) return [];
      } else {
        guestId = playerId;
      }

      // 查找我参与的所有已结束游戏
      const myPlayers = await this.playerRepository.find({
        where: userId ? { userId } : { guestId },
        relations: [
          'game',
          'game.players',
          'game.players.user',
          'game.gameRecords',
          'game.gameRecords.fromPlayer',
          'game.gameRecords.toPlayer',
        ],
      });

      let endedPlayers = myPlayers.filter(p => p.game.status === 'ended');

      if (playerType === 'guest') {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        endedPlayers = endedPlayers.filter(
          (p) => new Date(p.game.createdAt) >= sevenDaysAgo,
        );
      }

      // 聚合对手数据
      const opponentMap = new Map<string, {
        opponentId: string;
        opponentName: string;
        opponentType: 'user' | 'guest';
        gamesPlayed: number;
        myWins: number;
        myLosses: number;
        myDraws: number;
        myNetScore: number;
        avgNetScore: number;
        recentPlayedAt: Date | null;
      }>();

      for (const myPlayer of endedPlayers) {
        for (const opponent of myPlayer.game.players) {
          if (opponent.id === myPlayer.id) continue;

          const key = this.getStatsPlayerIdentifier(opponent);
          const gameNetScore = this.getHeadToHeadNetScore(
            myPlayer.id,
            opponent.id,
            myPlayer.game.gameRecords,
          );

          const opponentName =
            opponent.user?.nickname || opponent.user?.username || opponent.name;

          if (!opponentMap.has(key)) {
            opponentMap.set(key, {
              opponentId: key,
              opponentName,
              opponentType: opponent.userId ? 'user' : 'guest',
              gamesPlayed: 0,
              myWins: 0,
              myLosses: 0,
              myDraws: 0,
              myNetScore: 0,
              avgNetScore: 0,
              recentPlayedAt: null,
            });
          }

          const stat = opponentMap.get(key)!;
          stat.gamesPlayed++;
          if (gameNetScore > 0) stat.myWins++;
          else if (gameNetScore < 0) stat.myLosses++;
          else stat.myDraws++;

          stat.myNetScore = Number((stat.myNetScore + gameNetScore).toFixed(2));
          stat.avgNetScore = Number(
            (stat.myNetScore / stat.gamesPlayed).toFixed(1),
          );

          if (
            !stat.recentPlayedAt ||
            new Date(myPlayer.game.createdAt).getTime() >
              new Date(stat.recentPlayedAt).getTime()
          ) {
            stat.recentPlayedAt = myPlayer.game.createdAt;
            stat.opponentName = opponentName;
          }
        }
      }

      return Array.from(opponentMap.values())
        .sort((a, b) => {
          if (b.gamesPlayed !== a.gamesPlayed) {
            return b.gamesPlayed - a.gamesPlayed;
          }
          if (b.myNetScore !== a.myNetScore) {
            return b.myNetScore - a.myNetScore;
          }
          return (
            new Date(b.recentPlayedAt || 0).getTime() -
            new Date(a.recentPlayedAt || 0).getTime()
          );
        });
    } catch (error) {
      console.error('Error in getOpponentStats:', error);
      return [];
    }
  }

  // 获取排行榜
  async getLeaderboard(limit: number = 20): Promise<any[]> {
    try {
      const results = await this.playerRepository
        .createQueryBuilder('player')
        .innerJoin('player.game', 'game', 'game.status = :status', { status: 'ended' })
        .innerJoin('player.user', 'user')
        .select('user.id', 'userId')
        .addSelect('user.username', 'username')
        .addSelect('user.nickname', 'nickname')
        .addSelect('COUNT(*)', 'totalGames')
        .addSelect('SUM(player.balance)', 'totalScore')
        .addSelect('SUM(CASE WHEN player.balance > 0 THEN 1 ELSE 0 END)', 'totalWins')
        .groupBy('user.id')
        .orderBy('totalScore', 'DESC')
        .limit(limit)
        .getRawMany();

      return results.map(r => ({
        userId: r.userId,
        username: r.username,
        nickname: r.nickname || r.username,
        totalGames: Number(r.totalGames),
        totalScore: Number(r.totalScore),
        totalWins: Number(r.totalWins),
        winRate: Number(r.totalGames) > 0
          ? ((Number(r.totalWins) / Number(r.totalGames)) * 100).toFixed(1)
          : '0',
      }));
    } catch (error) {
      console.error('Error in getLeaderboard:', error);
      return [];
    }
  }

  // 定时清理空房间（每小时执行，< 2 人的活跃房间 3 小时后销毁）
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupEmptyRooms(): Promise<void> {
    this.logger.log('Running cleanup: checking for empty rooms older than 3 hours');
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);

    const emptyGames = await this.gameRepository
      .createQueryBuilder('game')
      .leftJoinAndSelect('game.players', 'player')
      .where('game.createdAt < :threeHoursAgo', { threeHoursAgo })
      .andWhere('game.status = :status', { status: 'active' })
      .getMany();

    const gamesToDelete = emptyGames.filter(
      (game) => game.players.length < 2,
    );

    if (gamesToDelete.length > 0) {
      const roomCodes = gamesToDelete.map(g => g.roomCode).join(', ');
      this.logger.log(`Deleting ${gamesToDelete.length} empty room(s): ${roomCodes}`);
      await this.gameRepository.remove(gamesToDelete);
    } else {
      this.logger.log('No empty rooms to clean up');
    }
  }
}
