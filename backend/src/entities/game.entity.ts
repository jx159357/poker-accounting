import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { GamePlayer } from './game-player.entity';
import { Transaction } from './transaction.entity';

@Entity()
@Index(['userId', 'createdAt'])
export class Game {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  roomCode: string;

  @Column()
  name: string;

  @Column({ default: '德州扑克' })
  gameType: string;

  @Column({ default: 'active' })
  status: string;

  @Column({ nullable: true })
  userId: number;

  @ManyToOne(() => User, (user) => user.games)
  user: User;

  @OneToMany(() => GamePlayer, (player) => player.game, { cascade: true })
  players: GamePlayer[];

  @OneToMany(() => Transaction, (transaction) => transaction.game, {
    cascade: true,
  })
  transactions: Transaction[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
