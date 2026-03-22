import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity()
export class Achievement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column({ default: '🏆' })
  icon: string;

  @Column('simple-json', { nullable: true })
  condition: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
