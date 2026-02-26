import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Game } from './game.entity';
import { GamePlayer } from './game-player.entity';

@Entity()
@Index(['gameId', 'createdAt']) // 添加索引优化查询
export class Record {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  gameId: number;

  @Column()
  playerId: number;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column()
  type: string;

  @ManyToOne(() => Game, (game) => game.records)
  game: Game;

  @ManyToOne(() => GamePlayer, (player) => player.records)
  player: GamePlayer;

  @CreateDateColumn()
  createdAt: Date;
}
