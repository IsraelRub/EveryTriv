import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('game_history')
export class GameHistoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string = '';

  @Column('uuid')
  @Index()
  userId: string = '';

  @ManyToOne(() => UserEntity, user => user.gameHistory)
  @JoinColumn({ name: 'userId' })
  user!: UserEntity;

  @Column('int')
  score: number = 0;

  @Column('int')
  totalQuestions: number = 0;

  @Column('int')
  correctAnswers: number = 0;

  @Column()
  difficulty: string = '';

  @Column({ nullable: true })
  topic?: string;

  @Column({
    type: 'enum',
    enum: ['time-limited', 'question-limited', 'unlimited'],
    default: 'question-limited'
  })
  gameMode: 'time-limited' | 'question-limited' | 'unlimited' = 'question-limited';

  @Column('int', { nullable: true })
  timeSpent?: number; // in seconds

  @Column('int')
  creditsUsed: number = 0;

  @Column('jsonb', { default: [] })
  questionsData: Array<{
    question: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    timeSpent?: number;
  }> = [];

  @CreateDateColumn()
  createdAt: Date = new Date();
}
