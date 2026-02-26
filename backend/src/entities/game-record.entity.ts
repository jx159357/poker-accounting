import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Game } from './game.entity';

@Entity()
export class GameRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  gameId: number;

  @Column({ nullable: true })
  guestId: string;

  @ManyToOne(() => Game)
  game: Game;
}
