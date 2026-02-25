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
import { GamePlayer } from '../entities/game-player.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(GamePlayer)
    private playerRepository: Repository<GamePlayer>,
    private jwtService: JwtService,
  ) {}

  async register(
    username: string,
    password: string,
    nickname: string,
    guestId?: string,
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
      nickname,
    });

    await this.userRepository.save(user);

    // 如果有 guestId，迁移游客数据
    if (guestId) {
      await this.migrateGuestData(guestId, user.id);
    }

    // 生成 token
    const token = this.jwtService.sign({
      id: user.id,
      username: user.username,
    });

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
      },
    };
  }

  async login(username: string, password: string) {
    // 查找用户
    const user = await this.userRepository.findOne({ where: { username } });
    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    // 生成 token
    const token = this.jwtService.sign({
      id: user.id,
      username: user.username,
    });

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
      },
    };
  }

  // 获取用户信息
  async getUserInfo(userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    return {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      createdAt: user.createdAt,
    };
  }

  // 更新用户资料
  async updateProfile(userId: number, nickname: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    user.nickname = nickname;
    await this.userRepository.save(user);

    return {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
    };
  }

  // 迁移游客数据到正式用户
  private async migrateGuestData(guestId: string, userId: number) {
    // 查找所有游客的游戏记录
    const guestPlayers = await this.playerRepository.find({
      where: { guestId },
      relations: ['game'],
    });

    // 更新为正式用户
    for (const player of guestPlayers) {
      player.userId = userId;
      player.guestId = null; // 清除 guestId
      await this.playerRepository.save(player);
    }

    console.log(`成功迁移 ${guestPlayers.length} 条游客数据到用户 ${userId}`);
  }

  async validateUser(userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }
    return user;
  }
}
