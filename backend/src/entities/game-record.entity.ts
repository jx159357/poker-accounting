import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Game } from './game.entity';
import { GamePlayer } from './game-player.entity';

@Entity('game_records')
export class GameRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  gameId: number;

  @Column()
  fromPlayerId: number;

  @Column()
  toPlayerId: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ nullable: true })
  note: string | null; // 添加 | null

  @Column({ default: false })
  isDeleted: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Game, (game) => game.records)
  game: Game;

  @ManyToOne(() => GamePlayer)
  fromPlayer: GamePlayer;

  @ManyToOne(() => GamePlayer)
  toPlayer: GamePlayer;
}
