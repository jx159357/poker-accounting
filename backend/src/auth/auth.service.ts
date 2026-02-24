import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async register(username: string, password: string, nickname: string) {
    // 检查用户是否已存在
    const existUser = await this.userRepository.findOne({
      where: { username },
    });
    if (existUser) {
      throw new UnauthorizedException('用户名已存在');
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
}
