import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { TriviaEntity } from './trivia.entity';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index({ unique: true })
  username: string;

  @Column()
  @Index({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column({ nullable: true })
  avatar: string;

  @Column('int', { default: 0 })
  score: number;

  @Column('jsonb', { default: {} })
  preferences: {
    theme?: 'light' | 'dark';
    language?: string;
    notifications?: boolean;
    favoriteTopics?: string[];
    customDifficulties?: Array<{
      description: string;
      usageCount: number;
      lastUsed: Date;
    }>;
  };

  @Column('jsonb', { default: {} })
  stats: {
    topicsPlayed: Record<string, number>;
    difficultyStats: Record<string, {
      correct: number;
      total: number;
    }>;
    totalQuestions: number;
    correctAnswers: number;
    lastPlayed: Date;
    streaks: {
      current: number;
      longest: number;
      lastPlayDate: Date;
    };
  };

  @Column('jsonb', { default: [] })
  achievements: Array<{
    id: string;
    title: string;
    description: string;
    icon: string;
    unlockedAt: Date;
  }>;

  @OneToMany(() => TriviaEntity, trivia => trivia.user)
  triviaHistory: TriviaEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column('tsvector', { select: false })
  @Index({ synchronize: false })
  searchVector: string;
}