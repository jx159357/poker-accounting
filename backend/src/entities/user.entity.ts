import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { Game } from './game.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  nickname: string; // 添加昵称字段

  @OneToMany(() => Game, (game) => game.creator)
  games: Game[];

  @CreateDateColumn()
  createdAt: Date;
}
