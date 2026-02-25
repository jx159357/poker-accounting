import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

  generateRoomCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // 创建房间
  async createRoom(
    gameType: string,
    nickname: string,
    userId?: number,
    guestId?: string,
  ) {
    const roomCode = await this.generateUniqueRoomCode(); // 使用新方法

    const game = new Game();
    game.roomCode = roomCode;
    game.gameType = gameType;
    game.creatorId = userId || null;
    game.status = 'playing';

    await this.gameRepository.save(game);

    const player = new GamePlayer();
    player.gameId = game.id;
    player.userId = userId || null;
    player.guestId = guestId || null;
    player.nickname = nickname;
    player.avatar = this.getRandomColor();
    player.currentScore = 0;
    player.finalScore = 0;
    player.isActive = true;

    await this.playerRepository.save(player);

    console.log(
      '房间创建成功:',
      roomCode,
      '玩家:',
      nickname,
      'guestId:',
      guestId,
    );

    return this.getGameDetail(roomCode);
  }

  // 加入房间
  async joinRoom(
    roomCode: string,
    nickname: string,
    userId?: number,
    guestId?: string,
  ) {
    console.log('=== 加入房间请求 ===');
    console.log('房间号:', roomCode);
    console.log('昵称:', nickname);
    console.log('userId:', userId);
    console.log('guestId:', guestId);

    const game = await this.gameRepository.findOne({
      where: { roomCode },
      relations: ['players'],
    });

    if (!game) {
      throw new NotFoundException('房间不存在');
    }

    if (game.status !== 'playing') {
      throw new NotFoundException('房间已结束');
    }

    console.log('当前房间玩家数:', game.players.length);
    console.log(
      '当前房间玩家:',
      game.players.map((p) => ({
        id: p.id,
        nickname: p.nickname,
        userId: p.userId,
        guestId: p.guestId,
      })),
    );

    // 检查是否已在房间
    let existPlayer = null;

    if (userId) {
      existPlayer = game.players.find((p) => p.userId === userId);
      console.log('登录用户检查，找到:', !!existPlayer);
    } else if (guestId) {
      existPlayer = game.players.find((p) => p.guestId === guestId);
      console.log('游客检查 guestId:', guestId);
      console.log(
        '房间内的 guestId:',
        game.players.map((p) => p.guestId),
      );
      console.log('找到已存在玩家:', !!existPlayer);
    }

    if (existPlayer) {
      console.log('玩家已在房间，返回房间信息');
      if (existPlayer.nickname !== nickname) {
        existPlayer.nickname = nickname;
        await this.playerRepository.save(existPlayer);
      }
      return this.getGameDetail(roomCode);
    }

    // 添加新玩家
    console.log('=== 添加新玩家 ===');
    const player = new GamePlayer();
    player.gameId = game.id;
    player.userId = userId || null;
    player.guestId = guestId || null;
    player.nickname = nickname;
    player.avatar = this.getRandomColor();
    player.currentScore = 0;
    player.finalScore = 0;
    player.isActive = true;

    const savedPlayer = await this.playerRepository.save(player);
    console.log('新玩家已保存:', {
      id: savedPlayer.id,
      nickname: savedPlayer.nickname,
      guestId: savedPlayer.guestId,
      userId: savedPlayer.userId,
    });

    // 再次查询确认
    const updatedGame = await this.getGameDetail(roomCode);
    console.log('=== 加入后房间状态 ===');
    console.log('玩家总数:', updatedGame.players.length);
    console.log(
      '玩家列表:',
      updatedGame.players.map((p) => ({
        id: p.id,
        nickname: p.nickname,
        guestId: p.guestId,
      })),
    );

    return updatedGame;
  }

  // 获取房间详情
  async getGameDetail(roomCode: string) {
    const game = await this.gameRepository.findOne({
      where: { roomCode },
      relations: [
        'players',
        'records',
        'records.fromPlayer',
        'records.toPlayer',
      ],
    });

    if (!game) {
      throw new NotFoundException('房间不存在');
    }

    if (game.records) {
      game.records = game.records.filter((r) => !r.isDeleted);
    }

    return game;
  }

  // 记账
  async addScore(
    roomCode: string,
    fromPlayerId: number,
    toPlayerId: number,
    amount: number,
    note?: string,
  ) {
    const game = await this.gameRepository.findOne({
      where: { roomCode },
      relations: ['players'],
    });

    if (!game || game.status !== 'playing') {
      throw new NotFoundException('房间不存在或已结束');
    }

    const fromPlayer = game.players.find((p) => p.id === fromPlayerId);
    const toPlayer = game.players.find((p) => p.id === toPlayerId);

    if (!fromPlayer || !toPlayer) {
      throw new NotFoundException('玩家不存在');
    }

    const record = new GameRecord();
    record.gameId = game.id;
    record.fromPlayerId = fromPlayerId;
    record.toPlayerId = toPlayerId;
    record.amount = amount;
    record.note = note || null;
    record.isDeleted = false;

    await this.recordRepository.save(record);

    fromPlayer.currentScore =
      parseFloat(fromPlayer.currentScore.toString()) - amount;
    toPlayer.currentScore =
      parseFloat(toPlayer.currentScore.toString()) + amount;

    await this.playerRepository.save([fromPlayer, toPlayer]);

    return this.getGameDetail(roomCode);
  }

  // 撤销记账
  async undoRecord(roomCode: string, recordId: number) {
    const record = await this.recordRepository.findOne({
      where: { id: recordId },
      relations: ['fromPlayer', 'toPlayer'],
    });

    if (!record) {
      throw new NotFoundException('记录不存在');
    }

    record.fromPlayer.currentScore =
      parseFloat(record.fromPlayer.currentScore.toString()) +
      parseFloat(record.amount.toString());
    record.toPlayer.currentScore =
      parseFloat(record.toPlayer.currentScore.toString()) -
      parseFloat(record.amount.toString());

    await this.playerRepository.save([record.fromPlayer, record.toPlayer]);

    record.isDeleted = true;
    await this.recordRepository.save(record);

    return this.getGameDetail(roomCode);
  }

  // 结算房间
  async settleRoom(roomCode: string, keepRecords: boolean = false) {
    const game = await this.gameRepository.findOne({
      where: { roomCode },
      relations: ['players', 'records'],
    });

    if (!game) {
      throw new NotFoundException('房间不存在');
    }

    game.status = 'settled';
    game.settledAt = new Date();

    for (const player of game.players) {
      player.finalScore = parseFloat(player.currentScore.toString());
      await this.playerRepository.save(player);
    }

    if (!keepRecords && game.records) {
      for (const record of game.records) {
        record.isDeleted = true;
        await this.recordRepository.save(record);
      }
    }

    await this.gameRepository.save(game);

    return this.getGameDetail(roomCode);
  }

  // 获取用户的所有房间
  async getUserGames(userId?: number, guestId?: string, nickname?: string) {
    const query = this.gameRepository
      .createQueryBuilder('game')
      .leftJoinAndSelect('game.players', 'player')
      .orderBy('game.createdAt', 'DESC');

    if (userId) {
      query.where('player.userId = :userId', { userId });
    } else if (guestId) {
      query.where('player.guestId = :guestId', { guestId });
    } else if (nickname) {
      query.where('player.nickname = :nickname', { nickname });
    }

    return query.getMany();
  }

  // 生成唯一房间号
  async generateUniqueRoomCode(): Promise<string> {
    let roomCode: string;
    let exists = true;

    // 循环直到生成唯一的房间号
    while (exists) {
      roomCode = Math.floor(100000 + Math.random() * 900000).toString();
      const existingGame = await this.gameRepository.findOne({
        where: { roomCode },
      });
      exists = !!existingGame;
    }

    return roomCode;
  }

  // 头像颜色方案（返回渐变色对象的 JSON 字符串）
  getRandomColor(): string {
    const colors = [
      '{"bg":"linear-gradient(135deg, #667eea 0%, #764ba2 100%)","text":"#fff"}',
      '{"bg":"linear-gradient(135deg, #f093fb 0%, #f5576c 100%)","text":"#fff"}',
      '{"bg":"linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)","text":"#fff"}',
      '{"bg":"linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)","text":"#fff"}',
      '{"bg":"linear-gradient(135deg, #fa709a 0%, #fee140 100%)","text":"#fff"}',
      '{"bg":"linear-gradient(135deg, #30cfd0 0%, #330867 100%)","text":"#fff"}',
      '{"bg":"linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)","text":"#333"}',
      '{"bg":"linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)","text":"#333"}',
      '{"bg":"linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)","text":"#333"}',
      '{"bg":"linear-gradient(135deg, #ff6e7f 0%, #bfe9ff 100%)","text":"#fff"}',
      '{"bg":"linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)","text":"#fff"}',
      '{"bg":"linear-gradient(135deg, #f8b500 0%, #fceabb 100%)","text":"#333"}',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  async getMyGames(userId: number, guestId: string) {
    console.log('=== 查询我的房间 ===');
    console.log('userId:', userId);
    console.log('guestId:', guestId);

    // 查找用户参与的所有游戏
    let playerQuery = this.playerRepository
      .createQueryBuilder('player')
      .leftJoinAndSelect('player.game', 'game')
      .where('game.status = :status', { status: 'playing' });

    if (userId) {
      // 登录用户：查找 userId 匹配的记录
      playerQuery = playerQuery.andWhere('player.userId = :userId', { userId });
    } else if (guestId) {
      // 游客：查找 guestId 匹配的记录
      playerQuery = playerQuery.andWhere('player.guestId = :guestId', {
        guestId,
      });
    } else {
      return [];
    }

    const players = await playerQuery.getMany();
    console.log('找到玩家记录数:', players.length);

    const gameIds = players.map((p) => p.game.id);
    if (gameIds.length === 0) {
      return [];
    }

    // 查询这些游戏的详细信息，包括所有玩家
    const games = await this.gameRepository
      .createQueryBuilder('game')
      .leftJoinAndSelect('game.players', 'player')
      .where('game.id IN (:...gameIds)', { gameIds })
      .andWhere('game.status = :status', { status: 'playing' })
      .getMany();

    console.log('找到游戏数:', games.length);

    return games.map((game) => {
      console.log(`游戏 ${game.roomCode} 玩家数:`, game.players.length);
      return {
        id: game.id,
        roomCode: game.roomCode,
        gameType: game.gameType,
        status: game.status,
        playerCount: game.players.length,
        createdAt: game.createdAt,
      };
    });
  }
}
