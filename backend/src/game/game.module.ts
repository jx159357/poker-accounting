import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameController } from './game.controller';
import { GameService } from './game.service';
import { AchievementService } from './achievement.service';
import { Game } from '../entities/game.entity';
import { GamePlayer } from '../entities/game-player.entity';
import { GameRecord } from '../entities/game-record.entity';
import { User } from '../entities/user.entity';
import { Achievement } from '../entities/achievement.entity';
import { UserAchievement } from '../entities/user-achievement.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Game, GamePlayer, GameRecord, User, Achievement, UserAchievement])],
  controllers: [GameController],
  providers: [GameService, AchievementService],
  exports: [GameService, AchievementService],
})
export class GameModule {}
