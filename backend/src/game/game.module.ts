import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameController } from './game.controller';
import { GameService } from './game.service';
import { Game } from '../entities/game.entity';
import { GamePlayer } from '../entities/game-player.entity';
import { GameRecord } from '../entities/game-record.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Game, GamePlayer, GameRecord])],
  controllers: [GameController],
  providers: [GameService],
})
export class GameModule {}
