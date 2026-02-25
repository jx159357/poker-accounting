import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { GamePlayer } from './game-player.entity';
import { GameRecord } from './game-record.entity';

@Entity('games')
export class Game {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  roomCode: string;

  @Column({ nullable: true })
  creatorId: number | null; // 修改类型，添加 | null

  @Column()
  gameType: string;

  @Column({ default: 'playing' })
  status: string;

  @Column({ nullable: true })
  note: string | null; // 添加 | null

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true, type: 'datetime' })
  settledAt: Date | null; // 添加 | null

  @ManyToOne(() => User, { nullable: true })
  creator: User | null; // 添加 | null

  @OneToMany(() => GamePlayer, (player) => player.game, { cascade: true })
  players: GamePlayer[];

  @OneToMany(() => GameRecord, (record) => record.game, { cascade: true })
  records: GameRecord[];
}
