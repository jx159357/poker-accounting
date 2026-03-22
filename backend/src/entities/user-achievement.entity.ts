import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { Achievement } from './achievement.entity';

@Entity()
@Unique(['userId', 'achievementId'])
export class UserAchievement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  achievementId: number;

  @ManyToOne(() => User)
  user: User;

  @ManyToOne(() => Achievement)
  achievement: Achievement;

  @CreateDateColumn()
  unlockedAt: Date;
}
