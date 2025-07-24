import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity({ name: 'trivia_history' })
export class TriviaEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  topic: string;

  @Column()
  difficulty: string;

  @Column()
  question: string;

  @Column('simple-json')
  answers: { text: string; isCorrect: boolean }[];

  @Column()
  correctAnswerIndex: number;

  @Column({ nullable: true })
  userId: string;

  @Column({ default: false })
  isCorrect: boolean;

  @CreateDateColumn()
  createdAt: Date;
} 