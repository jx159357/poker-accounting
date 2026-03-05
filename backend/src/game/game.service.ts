import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Game } from '../entities/game.entity';
import { GamePlayer } from '../entities/game-player.entity';
import { GameRecord } from '../entities/game-record.entity';

@Injectable()
export class GameService {
  constructor(
    @InjectRepository(Game)
    private gameRepository: Repository<Game>,
    @InjectRepository(GamePlayer)
    private playerRepository: Repository<GamePlayer>,
    @InjectRepository(GameRecord)
    private recordRepository: Repository<GameRecord>,
  ) {}

  // 生成房间号
  private generateRoomCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  // 获取玩家唯一标识
  private getPlayerIdentifier(player: {
    userId?: number;
    guestId?: string;
  }): string {
    return player.userId ? `user_${player.userId}` : `guest_${player.guestId}`;
  }

  // 创建游戏
  async createGame(
    name: string,
    gameType: string,
    creatorId: string,
    creatorType: string,
    nickname: string,
  ): Promise<Game> {
    const roomCode = this.generateRoomCode();

    // 创建游戏对象
    const game = new Game();
    game.name = name;
    game.gameType = gameType;
    game.roomCode = roomCode;
    game.status = 'active';

    // 根据创建者类型设置字段
    if (creatorType === 'user') {
      game.userId = parseInt(creatorId.replace('user_', ''));
    } else {
      game.guestId = creatorId;
    }

    const savedGame = await this.gameRepository.save(game);

    // 创建者自动加入
    const player = new GamePlayer();
    player.game = savedGame;
    player.name = nickname;
    player.balance = 0;

    if (creatorType === 'user') {
      player.userId = parseInt(creatorId.replace('user_', ''));
    } else {
      player.guestId = creatorId;
    }

    await this.playerRepository.save(player);

    // 重新查询完整数据
    return await this.gameRepository.findOne({
      where: { id: savedGame.id },
      relations: [
        'players',
        'gameRecords',
        'gameRecords.fromPlayer',
        'gameRecords.toPlayer',
      ],
    });
  }

  // 加入游戏
  async joinGame(
    roomCode: string,
    nickname: string,
    playerId: string,
    playerType: string,
  ): Promise<Game> {
    const game = await this.gameRepository.findOne({
      where: { roomCode },
      relations: [
        'players',
        'gameRecords',
        'gameRecords.fromPlayer',
        'gameRecords.toPlayer',
      ],
    });

    if (!game) {
      throw new NotFoundException('房间不存在');
    }

    if (game.status !== 'active') {
      throw new BadRequestException('游戏已结束');
    }

    // 检查是否已加入
    const existingPlayer = game.players.find((p) => {
      const identifier = this.getPlayerIdentifier(p);
      return identifier === playerId;
    });

    if (existingPlayer) {
      return game;
    }

    // 创建新玩家
    const player = new GamePlayer();
    player.game = game;
    player.name = nickname;
    player.balance = 0;

    if (playerType === 'user') {
      player.userId = parseInt(playerId.replace('user_', ''));
    } else {
      player.guestId = playerId;
    }

    await this.playerRepository.save(player);

    return await this.gameRepository.findOne({
      where: { id: game.id },
      relations: [
        'players',
        'gameRecords',
        'gameRecords.fromPlayer',
        'gameRecords.toPlayer',
      ],
    });
  }

  // 获取游戏详情
  async getGameDetail(roomCode: string): Promise<Game> {
    const game = await this.gameRepository.findOne({
      where: { roomCode },
      relations: [
        'players',
        'gameRecords',
        'gameRecords.fromPlayer',
        'gameRecords.toPlayer',
      ],
      order: {
        gameRecords: {
          createdAt: 'DESC',
        },
      },
    });

    if (!game) {
      throw new NotFoundException('房间不存在');
    }

    return game;
  }

  // 获取我的游戏列表
  async getMyGames(playerId: string, playerType: string): Promise<any[]> {
    // 验证参数
    if (!playerId || !playerType) {
      return [];
    }

    let players: GamePlayer[];

    try {
      if (playerType === 'user') {
        // 提取用户ID
        const userIdStr = playerId.replace('user_', '');
        const userId = parseInt(userIdStr, 10);

        // 验证是否为有效数字
        if (isNaN(userId)) {
          console.error('Invalid userId:', playerId);
          return [];
        }

        players = await this.playerRepository.find({
          where: { userId },
          relations: ['game', 'game.players'],
          order: {
            game: {
              createdAt: 'DESC',
            },
          },
        });
      } else {
        // 游客模式
        players = await this.playerRepository.find({
          where: { guestId: playerId },
          relations: ['game', 'game.players'],
          order: {
            game: {
              createdAt: 'DESC',
            },
          },
        });
      }

      return players.map((player) => ({
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

    if (fromPlayerId === toPlayerId) {
      throw new BadRequestException('不能给自己转分');
    }

    // 创建记录
    const record = new GameRecord();
    record.game = game;
    record.fromPlayer = fromPlayer;
    record.toPlayer = toPlayer;
    record.amount = score;
    record.note = note;

    await this.recordRepository.save(record);

    // 更新玩家余额
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
      relations: ['fromPlayer', 'toPlayer'],
    });

    if (!record) {
      throw new NotFoundException('记录不存在');
    }

    // 只有给分者可以撤销
    const fromPlayerIdentifier = this.getPlayerIdentifier(record.fromPlayer);
    if (fromPlayerIdentifier !== requesterId) {
      throw new BadRequestException('只有给分者可以撤销记录');
    }

    // 恢复玩家余额
    record.fromPlayer.balance =
      Number(record.fromPlayer.balance) + Number(record.amount);
    record.toPlayer.balance =
      Number(record.toPlayer.balance) - Number(record.amount);

    await this.playerRepository.save([record.fromPlayer, record.toPlayer]);

    // 删除记录
    await this.recordRepository.remove(record);
  }

  // 更新玩家昵称
  async updatePlayerNickname(
    roomCode: string,
    playerId: number,
    newNickname: string,
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

    player.name = newNickname;

    await this.playerRepository.save(player);

    return player;
  }

  // 结束游戏
  async endGame(roomCode: string): Promise<any> {
    const game = await this.gameRepository.findOne({
      where: { roomCode },
      relations: ['players'],
    });

    if (!game) {
      throw new NotFoundException('房间不存在');
    }

    game.status = 'ended';
    await this.gameRepository.save(game);

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
  async deleteGame(roomCode: string, requesterId: string): Promise<void> {
    const game = await this.gameRepository.findOne({
      where: { roomCode },
    });

    if (!game) {
      throw new NotFoundException('房间不存在');
    }

    const creatorIdentifier = game.userId
      ? `user_${game.userId}`
      : `guest_${game.guestId}`;

    if (creatorIdentifier !== requesterId) {
      throw new BadRequestException('只有创建者可以删除房间');
    }

    await this.gameRepository.remove(game);
  }

  // 获取统计数据
  async getStats(playerId: string, playerType: string): Promise<any> {
    // 验证参数
    if (!playerId || !playerType) {
      return {
        totalGames: 0,
        totalWins: 0,
        totalLosses: 0,
        totalDraws: 0,
        winRate: 0,
        totalScore: 0,
        gameTypeStats: [],
        recentGames: [],
      };
    }

    let players: GamePlayer[];

    try {
      if (playerType === 'user') {
        const userIdStr = playerId.replace('user_', '');
        const userId = parseInt(userIdStr, 10);

        if (isNaN(userId)) {
          console.error('Invalid userId:', playerId);
          return {
            totalGames: 0,
            totalWins: 0,
            totalLosses: 0,
            totalDraws: 0,
            winRate: 0,
            totalScore: 0,
            gameTypeStats: [],
            recentGames: [],
          };
        }

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
      }

      const totalGames = players.length;
      const totalWins = players.filter((p) => Number(p.balance) > 0).length;
      const totalLosses = players.filter((p) => Number(p.balance) < 0).length;
      const totalDraws = players.filter((p) => Number(p.balance) === 0).length;
      const winRate =
        totalGames > 0 ? ((totalWins / totalGames) * 100).toFixed(1) : 0;
      const totalScore = players.reduce((sum, p) => sum + Number(p.balance), 0);

      // 按游戏类型统计
      const gameTypeMap = new Map();
      players.forEach((p) => {
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

      // 最近游戏
      const recentGames = players.slice(0, 10).map((p) => ({
        id: p.game.id,
        name: p.game.name,
        roomCode: p.game.roomCode,
        gameType: p.game.gameType,
        score: p.balance,
        status: p.game.status,
        createdAt: p.game.createdAt,
      }));

      return {
        totalGames,
        totalWins,
        totalLosses,
        totalDraws,
        winRate,
        totalScore,
        gameTypeStats,
        recentGames,
      };
    } catch (error) {
      console.error('Error in getStats:', error);
      return {
        totalGames: 0,
        totalWins: 0,
        totalLosses: 0,
        totalDraws: 0,
        winRate: 0,
        totalScore: 0,
        gameTypeStats: [],
        recentGames: [],
      };
    }
  }

  // 定时清理空房间（每小时执行）
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupEmptyRooms(): Promise<void> {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);

    const emptyGames = await this.gameRepository
      .createQueryBuilder('game')
      .leftJoinAndSelect('game.players', 'player')
      .where('game.createdAt < :threeHoursAgo', { threeHoursAgo })
      .andWhere('game.status = :status', { status: 'active' })
      .getMany();

    const gamesToDelete = emptyGames.filter((game) => game.players.length < 2);

    if (gamesToDelete.length > 0) {
      await this.gameRepository.remove(gamesToDelete);
      console.log(`✅ Cleaned up ${gamesToDelete.length} empty rooms`);
    }
  }
}
