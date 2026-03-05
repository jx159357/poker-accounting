import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { GamePlayer } from './game-player.entity';
import { GameRecord } from './game-record.entity';

@Entity()
export class Game {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  roomCode: string;

  @Column({ default: '其他' })
  gameType: string;

  @Column({ default: 'active' })
  status: string;

  @Column({ nullable: true })
  userId: number; // 创建者用户ID

  @Column({ nullable: true })
  guestId: string; // 创建者游客ID

  @ManyToOne(() => User, { nullable: true })
  creator: User;

  @OneToMany(() => GamePlayer, (player) => player.game, {
    cascade: true,
    eager: true,
  })
  players: GamePlayer[];

  @OneToMany(() => GameRecord, (record) => record.game, {
    cascade: true,
    eager: true,
  })
  gameRecords: GameRecord[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
