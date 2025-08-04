import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('trivia')
export class TriviaEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index({ fulltext: true })
  topic: string;

  @Column()
  difficulty: string;

  @Column()
  @Index({ fulltext: true })
  question: string;

  @Column('jsonb', { default: [] })
  answers: Array<{
    text: string;
    isCorrect: boolean;
  }>;

  @Column('int')
  correctAnswerIndex: number;

  @Column({ nullable: true })
  userId: string;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Column('boolean', { default: false })
  isCorrect: boolean;

  @Column('jsonb', { nullable: true })
  metadata: {
    category?: string;
    tags?: string[];
    source?: string;
    difficulty_score?: number;
    custom_difficulty_description?: string;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column('tsvector', { select: false })
  @Index({ synchronize: false })
  searchVector: string;
}