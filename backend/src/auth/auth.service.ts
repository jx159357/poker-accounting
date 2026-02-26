import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { Game } from '../entities/game.entity';
import { GamePlayer } from '../entities/game-player.entity';
import { Record } from '../entities/record.entity';
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
    @InjectRepository(Record)
    private recordRepository: Repository<Record>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.userRepository.findOne({
      where: { username: registerDto.username },
    });

    if (existingUser) {
      throw new ConflictException('用户名已存在');
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = this.userRepository.create({
      username: registerDto.username,
      password: hashedPassword,
    });

    await this.userRepository.save(user);

    const payload = { username: user.username, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
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
      },
    };
  }

  async validateUser(username: string, password: string) {
    const user = await this.userRepository.findOne({ where: { username } });

    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user;
      return result;
    }

    return null;
  }

  // 新增：游客数据迁移
  async migrate(userId: number, migrateDto: MigrateDto) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    const migratedGames = [];

    for (const guestGame of migrateDto.games) {
      try {
        // 生成唯一房间码
        const roomCode = this.generateRoomCode();

        // 创建游戏
        const game = this.gameRepository.create({
          roomCode,
          name: guestGame.name,
          buyIn: guestGame.buyIn,
          userId: user.id,
          status: guestGame.status || 'completed',
          createdAt: guestGame.createdAt
            ? new Date(guestGame.createdAt)
            : new Date(),
        });

        await this.gameRepository.save(game);

        // 创建玩家映射表
        const playerIdMap = new Map<string, number>();

        // 插入玩家数据
        for (const playerName of guestGame.players) {
          const player = this.gamePlayerRepository.create({
            name: playerName,
            gameId: game.id,
          });
          await this.gamePlayerRepository.save(player);
          playerIdMap.set(playerName, player.id);
        }

        // 插入记录数据
        for (const record of guestGame.records) {
          const dbPlayerId = playerIdMap.get(record.playerId);

          if (dbPlayerId) {
            const newRecord = this.recordRepository.create({
              gameId: game.id,
              playerId: dbPlayerId,
              amount: record.amount,
              type: record.type,
              createdAt: record.createdAt
                ? new Date(record.createdAt)
                : new Date(),
            });
            await this.recordRepository.save(newRecord);
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
