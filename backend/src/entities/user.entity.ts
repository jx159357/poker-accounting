import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Game } from './game.entity';
import { Record } from './record.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column()
  password: string;

  @Column()
  nickname: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Game, (game) => game.user)
  games: Game[];

  @OneToMany(() => Record, (record) => record.user)
  records: Record[];
}
