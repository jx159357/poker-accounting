import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { User } from './user.entity';
import { Game } from './game.entity';

@Entity('records')
export class Record {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  gameId: number;

  @Column()
  userId: number;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number; // 正数赢，负数输

  @Column({ nullable: true })
  playerName: string; // 玩家名称

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Game, (game) => game.records)
  game: Game;

  @ManyToOne(() => User, (user) => user.records)
  user: User;
}
