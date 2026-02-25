import { Injectable,ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
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
    console.log('=== 注册新用户 ===');
    console.log('username:', username);
    console.log('nickname:', nickname);
    console.log('guestId:', guestId);

    const existingUser = await this.userRepository.findOne({
      where: { username },
    });
    if (existingUser) {
      throw new ConflictException('用户名已存在');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User();
    user.username = username;
    user.password = hashedPassword;
    user.nickname = nickname;

    const savedUser = await this.userRepository.save(user);
    console.log('新用户ID:', savedUser.id);

    // 如果提供了 guestId，迁移游客数据
    if (guestId) {
      console.log('开始迁移游客数据...');

      // 查找所有该游客的游戏记录
      const guestPlayers = await this.playerRepository.find({
        where: { guestId },
        relations: ['game'],
      });

      console.log('找到游客记录数:', guestPlayers.length);

      // 将游客记录关联到新用户
      for (const player of guestPlayers) {
        console.log(
          `迁移玩家记录 ID: ${player.id}, 游戏: ${player.game?.roomCode}`,
        );
        player.userId = savedUser.id;
        // 保留 guestId 以便追溯，但主要使用 userId
        await this.playerRepository.save(player);
      }

      console.log('数据迁移完成');
    }

    const token = this.jwtService.sign({
      id: savedUser.id,
      username: savedUser.username,
    });

    return {
      token,
      user: {
        id: savedUser.id,
        username: savedUser.username,
        nickname: savedUser.nickname,
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

  async getUserInfo(userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    return {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
    };
  }

  async getProfile(userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    return {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
    };
  }

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
}
