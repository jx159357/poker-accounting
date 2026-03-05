import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Game } from './game.entity';
import { GamePlayer } from './game-player.entity';

@Entity()
export class GameRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Game, (game) => game.gameRecords, { onDelete: 'CASCADE' })
  game: Game;

  @ManyToOne(() => GamePlayer, { onDelete: 'CASCADE' })
  fromPlayer: GamePlayer;

  @ManyToOne(() => GamePlayer, { onDelete: 'CASCADE' })
  toPlayer: GamePlayer;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number; // 转账金额

  @Column({ nullable: true })
  note: string;

  @CreateDateColumn()
  createdAt: Date;
}
