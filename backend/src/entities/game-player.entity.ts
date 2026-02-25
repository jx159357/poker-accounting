import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Game } from './game.entity';
import { User } from './user.entity';

@Entity('game_players')
export class GamePlayer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  gameId: number;

  @Column({ nullable: true })
  userId: number | null; // 登录用户ID

  @Column({ nullable: true })
  guestId: string | null; // 游客UUID

  @Column()
  nickname: string; // 玩家昵称（可重复）

  @Column()
  avatar: string; // 头像颜色

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  currentScore: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  finalScore: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  joinedAt: Date;

  @ManyToOne(() => Game, (game) => game.players)
  game: Game;

  @ManyToOne(() => User, { nullable: true })
  user: User | null;
}
