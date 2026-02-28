import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Game } from '../entities/game.entity';
import { GamePlayer } from '../entities/game-player.entity';
import { Transaction } from '../entities/transaction.entity';
import { GameRecord } from '../entities/game-record.entity';
import { CreateGameDto } from './dto/create-game.dto';

@Injectable()
export class GameService {
  constructor(
    @InjectRepository(Game)
    private gameRepository: Repository<Game>,
    @InjectRepository(GamePlayer)
    private gamePlayerRepository: Repository<GamePlayer>,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(GameRecord)
    private gameRecordRepository: Repository<GameRecord>,
  ) {}

  // 创建游戏房间
  async createGame(dto: CreateGameDto, userId?: number) {
    const roomCode = this.generateRoomCode();

    const game = this.gameRepository.create({
      roomCode,
      name: dto.name,
      gameType: dto.gameType || '德州扑克',
      userId: userId || null,
      status: 'active',
    });

    await this.gameRepository.save(game);

    // 创建玩家
    if (dto.players && dto.players.length > 0) {
      for (const playerName of dto.players) {
        const player = this.gamePlayerRepository.create({
          name: playerName,
          gameId: game.id,
          userId: userId || null,
          guestId: dto.guestId || null,
        });
        await this.gamePlayerRepository.save(player);
      }
    }

    // 如果是游客创建，保存游客ID关联
    if (dto.guestId) {
      const gameRecord = this.gameRecordRepository.create({
        gameId: game.id,
        guestId: dto.guestId,
      });
      await this.gameRecordRepository.save(gameRecord);
    }

    return this.getRoomDetail(roomCode);
  }

  // 加入游戏房间
  async joinGame(
    roomCode: string,
    playerName: string,
    userId?: number,
    guestId?: string,
  ) {
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
      userId: userId || null,
      guestId: guestId || null,
    });

    await this.gamePlayerRepository.save(player);

    return this.getRoomDetail(roomCode);
  }

  // 获取我的游戏列表
  async getMyGames(userId?: number, guestId?: string) {
    if (userId) {
      return this.gameRepository.find({
        where: { userId },
        relations: [
          'players',
          'transactions',
          'transactions.fromPlayer',
          'transactions.toPlayer',
        ],
        order: { createdAt: 'DESC' },
      });
    } else if (guestId) {
      const gameRecords = await this.gameRecordRepository.find({
        where: { guestId: guestId },
        relations: [
          'game',
          'game.players',
          'game.transactions',
          'game.transactions.fromPlayer',
          'game.transactions.toPlayer',
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
      relations: [
        'players',
        'transactions',
        'transactions.fromPlayer',
        'transactions.toPlayer',
      ],
    });

    if (!game) {
      throw new NotFoundException('房间不存在');
    }

    return game;
  }

  // 添加转账
  async addTransaction(
    roomCode: string,
    fromPlayerId: number,
    toPlayerId: number,
    amount: number,
    remark?: string,
  ) {
    if (fromPlayerId === toPlayerId) {
      throw new BadRequestException('付款方和收款方不能相同');
    }

    if (amount <= 0) {
      throw new BadRequestException('金额必须大于0');
    }

    const game = await this.gameRepository.findOne({
      where: { roomCode },
    });

    if (!game) {
      throw new NotFoundException('房间不存在');
    }

    if (game.status !== 'active') {
      throw new BadRequestException('房间已结束');
    }

    const fromPlayer = await this.gamePlayerRepository.findOne({
      where: { id: fromPlayerId, gameId: game.id },
    });

    if (!fromPlayer) {
      throw new NotFoundException('付款玩家不存在');
    }

    const toPlayer = await this.gamePlayerRepository.findOne({
      where: { id: toPlayerId, gameId: game.id },
    });

    if (!toPlayer) {
      throw new NotFoundException('收款玩家不存在');
    }

    // 创建转账记录
    const transaction = this.transactionRepository.create({
      gameId: game.id,
      fromPlayerId,
      toPlayerId,
      amount,
      remark: remark || '',
    });

    await this.transactionRepository.save(transaction);

    // 更新双方 currentScore
    fromPlayer.currentScore = Number(fromPlayer.currentScore) - amount;
    toPlayer.currentScore = Number(toPlayer.currentScore) + amount;
    await this.gamePlayerRepository.save(fromPlayer);
    await this.gamePlayerRepository.save(toPlayer);

    return this.getRoomDetail(roomCode);
  }

  // 撤销转账
  async undoTransaction(roomCode: string, transactionId: number) {
    const game = await this.gameRepository.findOne({
      where: { roomCode },
    });

    if (!game) {
      throw new NotFoundException('房间不存在');
    }

    const transaction = await this.transactionRepository.findOne({
      where: { id: transactionId, gameId: game.id },
    });

    if (!transaction) {
      throw new NotFoundException('转账记录不存在');
    }

    // 反向更新双方 currentScore
    const fromPlayer = await this.gamePlayerRepository.findOne({
      where: { id: transaction.fromPlayerId },
    });

    const toPlayer = await this.gamePlayerRepository.findOne({
      where: { id: transaction.toPlayerId },
    });

    if (fromPlayer) {
      fromPlayer.currentScore =
        Number(fromPlayer.currentScore) + Number(transaction.amount);
      await this.gamePlayerRepository.save(fromPlayer);
    }

    if (toPlayer) {
      toPlayer.currentScore =
        Number(toPlayer.currentScore) - Number(transaction.amount);
      await this.gamePlayerRepository.save(toPlayer);
    }

    await this.transactionRepository.remove(transaction);

    return this.getRoomDetail(roomCode);
  }

  // 结算房间
  async settleRoom(roomCode: string) {
    const game = await this.gameRepository.findOne({
      where: { roomCode },
      relations: ['players'],
    });

    if (!game) {
      throw new NotFoundException('房间不存在');
    }

    const playerStats = game.players
      .map((player) => ({
        playerId: player.id,
        playerName: player.name,
        netChange: Number(player.currentScore),
      }))
      .sort((a, b) => b.netChange - a.netChange);

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

  // 获取统计数据
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

    const transactionStats = await this.transactionRepository
      .createQueryBuilder('tx')
      .innerJoin('tx.game', 'game')
      .innerJoin('tx.fromPlayer', 'fromPlayer')
      .innerJoin('tx.toPlayer', 'toPlayer')
      .select('COUNT(tx.id)', 'totalTransactions')
      .addSelect(
        'SUM(CASE WHEN fromPlayer.userId = :userId THEN tx.amount ELSE 0 END)',
        'totalSent',
      )
      .addSelect(
        'SUM(CASE WHEN toPlayer.userId = :userId THEN tx.amount ELSE 0 END)',
        'totalReceived',
      )
      .where('game.userId = :userId', { userId })
      .setParameters({ userId })
      .getRawOne();

    const totalSent = parseFloat(transactionStats.totalSent) || 0;
    const totalReceived = parseFloat(transactionStats.totalReceived) || 0;

    return {
      totalGames: parseInt(gameStats.totalGames) || 0,
      completedGames: parseInt(gameStats.completedGames) || 0,
      activeGames: parseInt(gameStats.activeGames) || 0,
      totalTransactions: parseInt(transactionStats.totalTransactions) || 0,
      totalSent,
      totalReceived,
      profit: totalReceived - totalSent,
    };
  }

  private generateRoomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
}
