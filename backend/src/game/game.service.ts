import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Game } from '../entities/game.entity';
import { GamePlayer } from '../entities/game-player.entity';
import { Record } from '../entities/record.entity';
import { GameRecord } from '../entities/game-record.entity';

@Injectable()
export class GameService {
  constructor(
    @InjectRepository(Game)
    private gameRepository: Repository<Game>,
    @InjectRepository(GamePlayer)
    private gamePlayerRepository: Repository<GamePlayer>,
    @InjectRepository(Record)
    private recordRepository: Repository<Record>,
    @InjectRepository(GameRecord)
    private gameRecordRepository: Repository<GameRecord>,
  ) {}

  // 创建游戏房间
  async createGame(
    name: string,
    buyIn: number,
    players: string[],
    userId?: number,
    guestId?: string,
  ) {
    // 生成唯一房间码
    const roomCode = this.generateRoomCode();

    const game = this.gameRepository.create({
      roomCode,
      name,
      buyIn,
      userId: userId || null,
      status: 'active',
    });

    await this.gameRepository.save(game);

    // 创建玩家
    for (const playerName of players) {
      const player = this.gamePlayerRepository.create({
        name: playerName,
        gameId: game.id,
      });
      await this.gamePlayerRepository.save(player);
    }

    // 如果是游客创建，保存游客ID关联
    if (guestId) {
      const gameRecord = this.gameRecordRepository.create({
        gameId: game.id,
        guestId: guestId,
      });
      await this.gameRecordRepository.save(gameRecord);
    }

    return this.getRoomDetail(roomCode);
  }

  // 加入游戏房间
  async joinGame(roomCode: string, playerName: string) {
    const game = await this.gameRepository.findOne({
      where: { roomCode },
      relations: ['players'],
    });

    if (!game) {
      throw new NotFoundException('房间不存在');
    }

    if (game.status !== 'active') {
      throw new BadRequestException('房间已结束');
    }

    // 检查玩家是否已存在
    const existingPlayer = game.players.find((p) => p.name === playerName);
    if (existingPlayer) {
      throw new BadRequestException('玩家已存在');
    }

    const player = this.gamePlayerRepository.create({
      name: playerName,
      gameId: game.id,
    });

    await this.gamePlayerRepository.save(player);

    return this.getRoomDetail(roomCode);
  }

  // 获取我的游戏列表
  async getMyGames(userId?: number, guestId?: string) {
    if (userId) {
      // 用户模式：查询用户的游戏
      return this.gameRepository.find({
        where: { userId },
        relations: ['players', 'records', 'records.player'],
        order: { createdAt: 'DESC' },
      });
    } else if (guestId) {
      // 游客模式：通过 game_record 表查询
      const gameRecords = await this.gameRecordRepository.find({
        where: { guestId: guestId },
        relations: [
          'game',
          'game.players',
          'game.records',
          'game.records.player',
        ],
      });

      return gameRecords.map((gr) => gr.game);
    }

    return [];
  }

  // 获取房间详情
  async getRoomDetail(roomCode: string) {
    const game = await this.gameRepository.findOne({
      where: { roomCode },
      relations: ['players', 'records', 'records.player'],
    });

    if (!game) {
      throw new NotFoundException('房间不存在');
    }

    return game;
  }

  // 添加记录
  async addScore(
    roomCode: string,
    playerId: number,
    amount: number,
    type: string,
  ) {
    const game = await this.gameRepository.findOne({
      where: { roomCode },
    });

    if (!game) {
      throw new NotFoundException('房间不存在');
    }

    if (game.status !== 'active') {
      throw new BadRequestException('房间已结束');
    }

    const player = await this.gamePlayerRepository.findOne({
      where: { id: playerId, gameId: game.id },
    });

    if (!player) {
      throw new NotFoundException('玩家不存在');
    }

    const record = this.recordRepository.create({
      gameId: game.id,
      playerId,
      amount,
      type,
    });

    await this.recordRepository.save(record);

    return this.getRoomDetail(roomCode);
  }

  // 撤销记录
  async undoRecord(roomCode: string, recordId: number) {
    const game = await this.gameRepository.findOne({
      where: { roomCode },
    });

    if (!game) {
      throw new NotFoundException('房间不存在');
    }

    const record = await this.recordRepository.findOne({
      where: { id: recordId, gameId: game.id },
    });

    if (!record) {
      throw new NotFoundException('记录不存在');
    }

    await this.recordRepository.remove(record);

    return this.getRoomDetail(roomCode);
  }

  // 结算房间
  async settleRoom(
    roomCode: string,
    clearRecords: boolean = false,
    userId?: number,
    guestId?: string,
  ) {
    const game = await this.gameRepository.findOne({
      where: { roomCode },
      relations: ['players', 'records', 'records.player'],
    });

    if (!game) {
      throw new NotFoundException('房间不存在');
    }

    // 计算每个玩家的盈亏
    const playerStats = game.players.map((player) => {
      const buyInRecords = game.records.filter(
        (r) => r.playerId === player.id && r.type === 'buy_in',
      );
      const cashOutRecords = game.records.filter(
        (r) => r.playerId === player.id && r.type === 'cash_out',
      );

      const totalBuyIn = buyInRecords.reduce(
        (sum, r) => sum + Number(r.amount),
        0,
      );
      const totalCashOut = cashOutRecords.reduce(
        (sum, r) => sum + Number(r.amount),
        0,
      );
      const profit = totalCashOut - totalBuyIn;

      return {
        playerId: player.id,
        playerName: player.name,
        totalBuyIn,
        totalCashOut,
        profit,
      };
    });

    // 如果需要清空记录
    if (clearRecords) {
      await this.recordRepository.delete({ gameId: game.id });
    }

    return {
      game,
      playerStats,
    };
  }

  // 结束房间
  async finishRoom(roomCode: string) {
    const game = await this.gameRepository.findOne({
      where: { roomCode },
    });

    if (!game) {
      throw new NotFoundException('房间不存在');
    }

    game.status = 'completed';
    await this.gameRepository.save(game);

    return this.getRoomDetail(roomCode);
  }

  // 获取统计数据（优化版）
  async getStatistics(userId: number) {
    const gameStats = await this.gameRepository
      .createQueryBuilder('game')
      .select('COUNT(game.id)', 'totalGames')
      .addSelect(
        'SUM(CASE WHEN game.status = "completed" THEN 1 ELSE 0 END)',
        'completedGames',
      )
      .addSelect(
        'SUM(CASE WHEN game.status = "active" THEN 1 ELSE 0 END)',
        'activeGames',
      )
      .where('game.userId = :userId', { userId })
      .getRawOne();

    const recordStats = await this.recordRepository
      .createQueryBuilder('record')
      .innerJoin('record.game', 'game')
      .select('COUNT(record.id)', 'totalRecords')
      .addSelect(
        'SUM(CASE WHEN record.type = "buy_in" THEN record.amount ELSE 0 END)',
        'totalBuyIn',
      )
      .addSelect(
        'SUM(CASE WHEN record.type = "cash_out" THEN record.amount ELSE 0 END)',
        'totalCashOut',
      )
      .where('game.userId = :userId', { userId })
      .getRawOne();

    return {
      totalGames: parseInt(gameStats.totalGames) || 0,
      completedGames: parseInt(gameStats.completedGames) || 0,
      activeGames: parseInt(gameStats.activeGames) || 0,
      totalRecords: parseInt(recordStats.totalRecords) || 0,
      totalBuyIn: parseFloat(recordStats.totalBuyIn) || 0,
      totalCashOut: parseFloat(recordStats.totalCashOut) || 0,
      profit:
        (parseFloat(recordStats.totalCashOut) || 0) -
        (parseFloat(recordStats.totalBuyIn) || 0),
    };
  }

  // 生成6位房间码
  private generateRoomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
}
