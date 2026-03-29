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

  private async reassignGameRecords(
    guestPlayerId: number,
    targetPlayer: GamePlayer,
  ) {
    const relatedRecords = await this.gameRecordRepository.find({
      where: [
        { fromPlayer: { id: guestPlayerId } },
        { toPlayer: { id: guestPlayerId } },
      ],
      relations: ['fromPlayer', 'toPlayer'],
    });

    if (!relatedRecords.length) {
      return;
    }

    const updatedRecords = relatedRecords.map((record) => {
      if (record.fromPlayer?.id === guestPlayerId) {
        record.fromPlayer = targetPlayer;
      }

      if (record.toPlayer?.id === guestPlayerId) {
        record.toPlayer = targetPlayer;
      }

      return record;
    });

    await this.gameRecordRepository.save(updatedRecords);
  }

  async register(username: string, password: string, nickname?: string) {
    const existingUser = await this.userRepository.findOne({
      where: { username },
    });

    if (existingUser) {
      throw new ConflictException('用户名已存在');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = this.userRepository.create({
      username,
      password: hashedPassword,
      nickname: nickname || username,
    });

    await this.userRepository.save(user);

    const payload = {
      sub: user.id,
      username: user.username,
      nickname: user.nickname || user.username,
    };

    return {
      access_token: this.jwtService.sign(payload),
      username: user.username,
      nickname: user.nickname || user.username,
    };
  }

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

    return {
      access_token: this.jwtService.sign(payload),
      username: user.username,
      nickname: user.nickname || user.username,
    };
  }

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

  async convertGuestToUser(
    username: string,
    password: string,
    guestId: string,
  ) {
    const existingUser = await this.userRepository.findOne({
      where: { username },
    });

    if (existingUser) {
      throw new ConflictException('用户名已存在');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = this.userRepository.create({
      username,
      password: hashedPassword,
      nickname: username,
    });

    await this.userRepository.save(user);

    await this.gamePlayerRepository
      .createQueryBuilder()
      .update(GamePlayer)
      .set({ userId: user.id, guestId: null })
      .where('guestId = :guestId', { guestId })
      .execute();

    await this.gameRepository
      .createQueryBuilder()
      .update(Game)
      .set({ userId: user.id, guestId: null })
      .where('guestId = :guestId', { guestId })
      .execute();

    const payload = {
      sub: user.id,
      username: user.username,
      nickname: user.nickname,
    };

    return {
      access_token: this.jwtService.sign(payload),
      username: user.username,
      nickname: user.nickname,
    };
  }

  async changePassword(userId: number, oldPassword: string, newPassword: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const isOldValid = await bcrypt.compare(oldPassword, user.password);

    if (!isOldValid) {
      throw new UnauthorizedException('旧密码不正确');
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await this.userRepository.save(user);

    return { message: '密码修改成功' };
  }

  async mergeGuestData(userId: number, guestId: string) {
    const guestPlayers = await this.gamePlayerRepository.find({
      where: { guestId },
      relations: ['game'],
    });

    for (const guestPlayer of guestPlayers) {
      const existingPlayer = await this.gamePlayerRepository.findOne({
        where: {
          userId,
          game: { id: guestPlayer.game.id },
        },
      });

      if (existingPlayer) {
        existingPlayer.balance =
          Number(existingPlayer.balance) + Number(guestPlayer.balance);
        await this.gamePlayerRepository.save(existingPlayer);
        await this.reassignGameRecords(guestPlayer.id, existingPlayer);
        await this.gamePlayerRepository.remove(guestPlayer);
      } else {
        guestPlayer.userId = userId;
        guestPlayer.guestId = null;
        await this.gamePlayerRepository.save(guestPlayer);
      }
    }

    await this.gameRepository
      .createQueryBuilder()
      .update(Game)
      .set({ userId, guestId: null })
      .where('guestId = :guestId', { guestId })
      .execute();

    return { message: '数据合并成功' };
  }
}
