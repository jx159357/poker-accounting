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
@Index(['gameId', 'createdAt'])
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  gameId: number;

  @Column()
  fromPlayerId: number;

  @Column()
  toPlayerId: number;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({ default: '' })
  remark: string;

  @ManyToOne(() => Game, (game) => game.transactions)
  game: Game;

  @ManyToOne(() => GamePlayer)
  fromPlayer: GamePlayer;

  @ManyToOne(() => GamePlayer)
  toPlayer: GamePlayer;

  @CreateDateColumn()
  createdAt: Date;
}
