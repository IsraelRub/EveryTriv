import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

import { GameMode } from '@shared/constants';
import type { QuestionData } from '@shared/types';

import { BaseEntity } from './base.entity';
import { UserEntity } from './user.entity';

@Entity('game_history')
export class GameHistoryEntity extends BaseEntity {
	@Column({ name: 'user_id', type: 'uuid' })
	@Index()
	userId: string = '';

	@ManyToOne(() => UserEntity, user => user.gameHistory)
	@JoinColumn({ name: 'user_id' })
	user!: UserEntity;

	@Column('int')
	score: number = 0;

	@Column({ name: 'total_questions', type: 'int' })
	totalQuestions: number = 0;

	@Column({ name: 'correct_answers', type: 'int' })
	correctAnswers: number = 0;

	@Column()
	difficulty: string = '';

	@Column({ nullable: true })
	topic?: string;

	@Column({
		name: 'game_mode',
		type: 'varchar',
		default: GameMode.QUESTION_LIMITED,
	})
	gameMode: GameMode = GameMode.QUESTION_LIMITED;

	@Column({ name: 'time_spent', type: 'int', nullable: true })
	timeSpent?: number; // in seconds

	@Column({ name: 'credits_used', type: 'int' })
	creditsUsed: number = 0;

	@Column({ name: 'questions_data', type: 'jsonb', default: [] })
	questionsData: QuestionData[] = [];
}
