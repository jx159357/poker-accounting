import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Game } from './game.entity';
import { Record } from './record.entity';

@Entity()
export class GamePlayer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  gameId: number;

  @ManyToOne(() => Game, (game) => game.players)
  game: Game;

  @OneToMany(() => Record, (record) => record.player)
  records: Record[];
}
