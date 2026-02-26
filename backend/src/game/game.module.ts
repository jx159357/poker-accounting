import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameService } from './game.service';
import { GameController } from './game.controller';
import { Game } from '../entities/game.entity';
import { GamePlayer } from '../entities/game-player.entity';
import { Record } from '../entities/record.entity';
import { GameRecord } from '../entities/game-record.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Game, GamePlayer, Record, GameRecord])],
  controllers: [GameController],
  providers: [GameService],
  exports: [GameService],
})
export class GameModule {}
