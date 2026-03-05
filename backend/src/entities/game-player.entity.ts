import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Game } from './game.entity';
import { User } from './user.entity';

@Entity()
export class GamePlayer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string; // 玩家昵称

  @Column({ nullable: true })
  avatar: string;

  @Column({ nullable: true })
  userId: number; // 用户ID（注册用户）

  @Column({ nullable: true })
  guestId: string; // 游客ID

  @ManyToOne(() => User, { nullable: true })
  user: User;

  @ManyToOne(() => Game, (game) => game.players, { onDelete: 'CASCADE' })
  game: Game;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  balance: number; // 当前余额

  @CreateDateColumn()
  joinedAt: Date;
}
