import { Injectable } from '@nestjs/common';
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

  // 生成唯一房间号
  private async generateRoomCode(): Promise<string> {
    let roomCode: string;
    let isUnique = false;

    while (!isUnique) {
      roomCode = Math.floor(100000 + Math.random() * 900000).toString();
      const existing = await this.gameRepository.findOne({
        where: { roomCode },
      });
      if (!existing) {
        isUnique = true;
      }
    }

    return roomCode;
  }

  // 生成随机颜色
  private getRandomColor(): string {
    const colors = [
      '#FF6B6B',
      '#4ECDC4',
      '#45B7D1',
      '#FFA07A',
      '#98D8C8',
      '#F7DC6F',
      '#BB8FCE',
      '#85C1E2',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  // 创建房间
  async createGame(
    gameType: string,
    userId?: number,
    guestId?: string,
    nickname?: string,
  ) {
    if (!userId && !guestId) {
      throw new Error('用户信息缺失');
    }

    const roomCode = await this.generateRoomCode();

    // 创建游戏
    const game = this.gameRepository.create({
      roomCode,
      gameType,
      status: 'playing',
      creatorId: userId || null,
    });

    await this.gameRepository.save(game);

    // 创建者自动加入房间
    const player = this.playerRepository.create({
      game,
      userId,
      guestId,
      nickname: nickname || (userId ? '用户' : '游客'),
      currentScore: 0,
      avatar: this.getRandomColor(),
    });

    await this.playerRepository.save(player);

    return {
      id: game.id,
      roomCode: game.roomCode,
      gameType: game.gameType,
      status: game.status,
    };
  }

  // 加入房间
  async joinGame(
    roomCode: string,
    userId?: number,
    guestId?: string,
    nickname?: string,
  ) {
    if (!userId && !guestId) {
      throw new Error('用户信息缺失');
    }

    const game = await this.gameRepository.findOne({
      where: { roomCode },
      relations: ['players'],
    });

    if (!game) {
      throw new Error('房间不存在');
    }

    if (game.status === 'finished') {
      throw new Error('房间已结束');
    }

    // 检查是否已经在房间中
    const existingPlayer = game.players.find((p) => {
      if (userId && p.userId === userId) return true;
      if (guestId && p.guestId === guestId) return true;
      return false;
    });

    if (existingPlayer) {
      // 如果已经在房间中，返回房间信息（允许重新进入）
      return {
        id: game.id,
        roomCode: game.roomCode,
        gameType: game.gameType,
        status: game.status,
      };
    }

    // 添加新玩家
    const player = this.playerRepository.create({
      game,
      userId,
      guestId,
      nickname: nickname || (userId ? '用户' : '游客'),
      currentScore: 0,
      avatar: this.getRandomColor(),
    });

    await this.playerRepository.save(player);

    return {
      id: game.id,
      roomCode: game.roomCode,
      gameType: game.gameType,
      status: game.status,
    };
  }

  // 获取我的房间列表
  async getMyGames(userId?: number, guestId?: string) {
    if (!userId && !guestId) {
      return [];
    }

    const queryBuilder = this.playerRepository
      .createQueryBuilder('player')
      .leftJoinAndSelect('player.game', 'game')
      .leftJoinAndSelect('game.players', 'players')
      .orderBy('game.createdAt', 'DESC');

    if (userId) {
      queryBuilder.andWhere('player.userId = :userId', { userId });
    } else if (guestId) {
      queryBuilder.andWhere('player.guestId = :guestId', { guestId });
    }

    const players = await queryBuilder.getMany();

    // 去重并格式化
    const gameMap = new Map();
    players.forEach((player) => {
      if (!gameMap.has(player.game.id)) {
        gameMap.set(player.game.id, {
          id: player.game.id,
          roomCode: player.game.roomCode,
          gameType: player.game.gameType,
          status: player.game.status,
          createdAt: player.game.createdAt,
          players: player.game.players.map((p) => ({
            id: p.id,
            nickname: p.nickname,
            currentScore: p.currentScore,
            avatar: p.avatar,
          })),
        });
      }
    });

    return Array.from(gameMap.values());
  }

  // 获取房间详情
  async getRoomDetail(roomCode: string) {
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
      throw new Error('房间不存在');
    }

    return {
      id: game.id,
      roomCode: game.roomCode,
      gameType: game.gameType,
      status: game.status,
      createdAt: game.createdAt,
      players: game.players.map((p) => ({
        id: p.id,
        nickname: p.nickname,
        currentScore: p.currentScore,
        avatar: p.avatar,
        userId: p.userId,
        guestId: p.guestId,
      })),
      records: (game.records || []).map((r) => ({
        id: r.id,
        fromPlayer: {
          id: r.fromPlayer.id,
          nickname: r.fromPlayer.nickname,
        },
        toPlayer: {
          id: r.toPlayer.id,
          nickname: r.toPlayer.nickname,
        },
        amount: r.amount,
        createdAt: r.createdAt,
      })),
    };
  }

  // 添加记分
  async addScore(
    roomCode: string,
    fromPlayerId: number,
    toPlayerId: number,
    amount: number,
  ) {
    const game = await this.gameRepository.findOne({
      where: { roomCode },
      relations: ['players'],
    });

    if (!game) {
      throw new Error('房间不存在');
    }

    const fromPlayer = game.players.find((p) => p.id === fromPlayerId);
    const toPlayer = game.players.find((p) => p.id === toPlayerId);

    if (!fromPlayer || !toPlayer) {
      throw new Error('玩家不存在');
    }

    // 更新分数
    fromPlayer.currentScore -= amount;
    toPlayer.currentScore += amount;

    await this.playerRepository.save([fromPlayer, toPlayer]);

    // 创建记录
    const record = this.recordRepository.create({
      game,
      fromPlayer,
      toPlayer,
      amount,
    });

    await this.recordRepository.save(record);

    return await this.getRoomDetail(roomCode);
  }

  // 撤销记录
  async undoRecord(roomCode: string, recordId: number) {
    const record = await this.recordRepository.findOne({
      where: { id: recordId },
      relations: ['game', 'fromPlayer', 'toPlayer'],
    });

    if (!record || record.game.roomCode !== roomCode) {
      throw new Error('记录不存在');
    }

    // 恢复分数
    record.fromPlayer.currentScore += record.amount;
    record.toPlayer.currentScore -= record.amount;

    await this.playerRepository.save([record.fromPlayer, record.toPlayer]);

    // 删除记录
    await this.recordRepository.remove(record);

    return await this.getRoomDetail(roomCode);
  }

  // 结算本局（不清空记录）
  async settleRoom(roomCode: string, clearRecords: boolean = false) {
    const game = await this.gameRepository.findOne({
      where: { roomCode },
      relations: ['players', 'records'],
    });

    if (!game) {
      throw new Error('房间不存在');
    }

    // 更新状态为已结算
    game.status = 'settled';
    await this.gameRepository.save(game);

    return await this.getRoomDetail(roomCode);
  }

  // 结束房间（清空记录，重置分数）
  async finishRoom(roomCode: string) {
    const game = await this.gameRepository.findOne({
      where: { roomCode },
      relations: ['players', 'records'],
    });

    if (!game) {
      throw new Error('房间不存在');
    }

    // 清空所有记录
    if (game.records && game.records.length > 0) {
      await this.recordRepository.remove(game.records);
    }

    // 重置所有玩家分数
    for (const player of game.players) {
      player.currentScore = 0;
    }
    await this.playerRepository.save(game.players);

    // 更新状态为已结束
    game.status = 'finished';
    await this.gameRepository.save(game);

    return { message: '房间已结束' };
  }
}
