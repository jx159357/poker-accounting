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
import { GameRecord } from '../entities/game-record.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Game)
    private gameRepository: Repository<Game>,
    @InjectRepository(GamePlayer)
    private gamePlayerRepository: Repository<GamePlayer>,
    @InjectRepository(GameRecord)
    private gameRecordRepository: Repository<GameRecord>,
    private jwtService: JwtService,
  ) {}

  // 注册
  async register(username: string, password: string, nickname?: string) {
    // 检查用户名是否已存在
    const existingUser = await this.userRepository.findOne({
      where: { username },
    });

    if (existingUser) {
      throw new ConflictException('用户名已存在');
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    const user = this.userRepository.create({
      username,
      password: hashedPassword,
      nickname: nickname || username,
    });

    await this.userRepository.save(user);

    // 生成 token
    const payload = {
      sub: user.id,
      username: user.username,
      nickname: user.nickname || user.username,
    };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      username: user.username,
      nickname: user.nickname || user.username,
    };
  }

  // 登录
  async login(username: string, password: string) {
    const user = await this.userRepository.findOne({ where: { username } });

    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const payload = {
      sub: user.id,
      username: user.username,
      nickname: user.nickname || user.username,
    };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      username: user.username,
      nickname: user.nickname || user.username,
    };
  }

  // 获取用户信息
  async getProfile(userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return {
      id: user.id,
      username: user.username,
      nickname: user.nickname || user.username,
      createdAt: user.createdAt,
    };
  }

  // 更新用户信息
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

  // 游客转注册用户
  async convertGuestToUser(
    username: string,
    password: string,
    guestId: string,
  ) {
    // 检查用户名是否已存在
    const existingUser = await this.userRepository.findOne({
      where: { username },
    });

    if (existingUser) {
      throw new ConflictException('用户名已存在');
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    const user = this.userRepository.create({
      username,
      password: hashedPassword,
      nickname: username,
    });

    await this.userRepository.save(user);

    // 更新游客的游戏记录
    await this.gamePlayerRepository
      .createQueryBuilder()
      .update(GamePlayer)
      .set({ userId: user.id, guestId: null })
      .where('guestId = :guestId', { guestId })
      .execute();

    // 更新游客创建的游戏
    await this.gameRepository
      .createQueryBuilder()
      .update(Game)
      .set({ userId: user.id, guestId: null })
      .where('guestId = :guestId', { guestId })
      .execute();

    // 生成 token
    const payload = {
      sub: user.id,
      username: user.username,
      nickname: user.nickname,
    };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      username: user.username,
      nickname: user.nickname,
    };
  }

  // 合并游客数据到已有用户
  async mergeGuestData(userId: number, guestId: string) {
    // 查找游客的所有游戏玩家记录
    const guestPlayers = await this.gamePlayerRepository.find({
      where: { guestId },
      relations: ['game'],
    });

    for (const guestPlayer of guestPlayers) {
      // 检查用户是否已经在这个游戏中
      const existingPlayer = await this.gamePlayerRepository.findOne({
        where: {
          userId,
          game: { id: guestPlayer.game.id },
        },
      });

      if (existingPlayer) {
        // 如果已存在，合并余额
        existingPlayer.balance =
          Number(existingPlayer.balance) + Number(guestPlayer.balance);
        await this.gamePlayerRepository.save(existingPlayer);

        // 更新游戏记录中的玩家引用
        await this.gameRecordRepository
          .createQueryBuilder()
          .update(GameRecord)
          .set({ fromPlayer: existingPlayer })
          .where('fromPlayer = :guestPlayerId', {
            guestPlayerId: guestPlayer.id,
          })
          .execute();

        await this.gameRecordRepository
          .createQueryBuilder()
          .update(GameRecord)
          .set({ toPlayer: existingPlayer })
          .where('toPlayer = :guestPlayerId', {
            guestPlayerId: guestPlayer.id,
          })
          .execute();

        // 删除游客玩家记录
        await this.gamePlayerRepository.remove(guestPlayer);
      } else {
        // 如果不存在，直接转换
        guestPlayer.userId = userId;
        guestPlayer.guestId = null;
        await this.gamePlayerRepository.save(guestPlayer);
      }
    }

    // 更新游客创建的游戏
    await this.gameRepository
      .createQueryBuilder()
      .update(Game)
      .set({ userId, guestId: null })
      .where('guestId = :guestId', { guestId })
      .execute();

    return { message: '数据合并成功' };
  }
}
