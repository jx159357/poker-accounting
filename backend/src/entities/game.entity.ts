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
import { Record } from './record.entity';

@Entity()
@Index(['userId', 'createdAt']) // 添加索引优化查询
export class Game {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  roomCode: string;

  @Column()
  name: string;

  @Column('decimal', { precision: 10, scale: 2 })
  buyIn: number;

  @Column({ default: 'active' })
  status: string;

  @Column({ nullable: true })
  userId: number;

  @ManyToOne(() => User, (user) => user.games)
  user: User;

  @OneToMany(() => GamePlayer, (player) => player.game, { cascade: true })
  players: GamePlayer[];

  @OneToMany(() => Record, (record) => record.game, { cascade: true })
  records: Record[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
