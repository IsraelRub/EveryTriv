import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

import { GameMode } from '@shared/constants';
import type { QuestionData } from '@shared/types';

import { BaseEntity } from './base.entity';
import { UserEntity } from './user.entity';

@Entity('game_history')
@Index(['createdAt'])
export class GameHistoryEntity extends BaseEntity {
	@Column({ name: 'user_id', type: 'uuid' })
	@Index()
	userId!: string;

	@ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'user_id' })
	user!: UserEntity;

	@Column({ type: 'varchar', default: '' })
	@Index()
	topic: string = '';

	@Column({ type: 'varchar', default: '' })
	@Index()
	difficulty: string = '';

	@Column('int')
	score: number = 0;

	@Column({ name: 'game_question_count', type: 'int', default: 0 })
	gameQuestionCount: number = 0;

	@Column({ name: 'correct_answers', type: 'int', default: 0 })
	correctAnswers: number = 0;

	@Column({
		name: 'game_mode',
		type: 'varchar',
		default: GameMode.QUESTION_LIMITED,
	})
	gameMode: GameMode = GameMode.QUESTION_LIMITED;

	@Column({ name: 'time_spent', type: 'int', default: 0, nullable: true })
	timeSpent?: number;

	@Column({ name: 'credits_used', type: 'int', default: 0 })
	creditsUsed: number = 0;

	@Column({
		name: 'questions_data',
		type: 'jsonb',
		default: () => "'[]'::jsonb",
	})
	questionsData: QuestionData[] = [];

	@Column({ name: 'client_mutation_id', type: 'uuid', nullable: true })
	@Index({ unique: true, where: 'client_mutation_id IS NOT NULL' })
	clientMutationId?: string;

	get incorrectAnswers(): number {
		return Math.max(0, this.gameQuestionCount - this.correctAnswers);
	}
}

// Index on createdAt (inherited from BaseEntity)
// This index is also defined in the migration: IDX_game_history_created_at
