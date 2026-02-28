import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { Game } from '../entities/game.entity';
import { GamePlayer } from '../entities/game-player.entity';
import { Transaction } from '../entities/transaction.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { MigrateDto } from './dto/migrate.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Game)
    private gameRepository: Repository<Game>,
    @InjectRepository(GamePlayer)
    private gamePlayerRepository: Repository<GamePlayer>,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto, guestId?: string) {
    const existingUser = await this.userRepository.findOne({
      where: { username: registerDto.username },
    });

    if (existingUser) {
      throw new ConflictException('用户名已存在');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = this.userRepository.create({
      username: registerDto.username,
      password: hashedPassword,
      nickname: registerDto.username,
    });

    await this.userRepository.save(user);

    // 如果有 guestId，迁移游客数据
    if (guestId) {
      await this.migrateGuestData(user.id, guestId);
    }

    const payload = { username: user.username, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
      },
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.username, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const payload = { username: user.username, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname || user.username,
      },
    };
  }

  async getUserInfo(userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return {
      id: user.id,
      username: user.username,
      nickname: user.nickname || user.username,
    };
  }

  async updateProfile(userId: number, data: { nickname?: string }) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    if (data.nickname) {
      user.nickname = data.nickname;
    }

    await this.userRepository.save(user);

    return {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
    };
  }

  async validateUser(username: string, password: string) {
    const user = await this.userRepository.findOne({ where: { username } });

    if (user && (await bcrypt.compare(password, user.password))) {
      const { password: _, ...result } = user;
      return result;
    }

    return null;
  }

  // 迁移游客数据到注册用户
  private async migrateGuestData(userId: number, guestId: string) {
    // 更新游客创建的游戏的 userId
    await this.gamePlayerRepository
      .createQueryBuilder()
      .update(GamePlayer)
      .set({ userId })
      .where('guestId = :guestId', { guestId })
      .execute();
  }

  // 游客数据迁移（批量）
  async migrate(userId: number, migrateDto: MigrateDto) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    const migratedGames = [];

    for (const guestGame of migrateDto.games) {
      try {
        const roomCode = this.generateRoomCode();

        const game = this.gameRepository.create({
          roomCode,
          name: guestGame.name,
          userId: user.id,
          status: guestGame.status || 'completed',
          createdAt: guestGame.createdAt
            ? new Date(guestGame.createdAt)
            : new Date(),
        });

        await this.gameRepository.save(game);

        const playerIdMap = new Map<string, number>();

        for (const playerName of guestGame.players) {
          const player = this.gamePlayerRepository.create({
            name: playerName,
            gameId: game.id,
            userId: user.id,
          });
          await this.gamePlayerRepository.save(player);
          playerIdMap.set(playerName, player.id);
        }

        // 迁移旧的 records 为 transactions（如果有的话）
        if (guestGame.records) {
          for (const record of guestGame.records) {
            const dbPlayerId = playerIdMap.get(record.playerId);
            // 旧数据格式不兼容新的转账模式，跳过
            if (dbPlayerId) {
              // 旧的 buy_in/cash_out 记录无法直接映射为转账，仅迁移游戏和玩家
            }
          }
        }

        migratedGames.push({
          guestId: guestGame.id,
          dbId: game.id,
          roomCode: game.roomCode,
          name: game.name,
        });
      } catch (error) {
        console.error(`迁移游戏 ${guestGame.name} 失败:`, error);
      }
    }

    return {
      message: '数据迁移成功',
      migratedCount: migratedGames.length,
      totalCount: migrateDto.games.length,
      games: migratedGames,
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
