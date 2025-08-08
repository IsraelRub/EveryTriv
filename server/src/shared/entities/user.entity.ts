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
import { GameHistoryEntity } from './game-history.entity';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  GUEST = 'guest'
}

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

  @Column({ nullable: true })
  passwordHash?: string;

  @Column({ nullable: true })
  googleId?: string;

  @Column({ nullable: true })
  fullName?: string;

  @Column({ nullable: true })
  avatar?: string;

  @Column('int', { default: 0 })
  score: number = 0;

  @Column('int', { default: 100 })
  credits: number = 100;

  @Column({ type: 'date', nullable: true })
  lastCreditRefill?: Date;

  @Column({ default: true })
  is_active: boolean = true;

  @Column({ default: 'user' })
  role: 'admin' | 'user' | 'guest' = 'user';

  @Column({ nullable: true })
  reset_password_token?: string;

  @Column({ type: 'timestamp', nullable: true })
  reset_password_expires?: Date;

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
  } = {};

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
  } = {
    topicsPlayed: {},
    difficultyStats: {},
    totalQuestions: 0,
    correctAnswers: 0,
    lastPlayed: new Date(),
    streaks: {
      current: 0,
      longest: 0,
      lastPlayDate: new Date()
    }
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

  @OneToMany(() => GameHistoryEntity, gameHistory => gameHistory.user)
  gameHistory: GameHistoryEntity[];

  @CreateDateColumn()
  createdAt: Date = new Date();

  @UpdateDateColumn()
  updatedAt: Date = new Date();

  @Column('tsvector', { select: false })
  @Index()
  searchVector: string = '';
}