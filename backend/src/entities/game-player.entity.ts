import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
} from 'typeorm';
import { Game } from './game.entity';

@Entity()
export class GamePlayer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  gameId: number;

  @Column({ nullable: true })
  userId: number;

  @Column({ nullable: true })
  guestId: string;

  @Column({ nullable: true })
  avatar: string;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  currentScore: number;

  @ManyToOne(() => Game, (game) => game.players)
  game: Game;
}
