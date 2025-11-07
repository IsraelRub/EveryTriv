import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

import { DifficultyLevel } from '@shared/constants';
import type { TriviaAnswer, TriviaQuestionDetailsMetadata } from '@shared/types';

import { BaseEntity } from './base.entity';
import { UserEntity } from './user.entity';

@Entity('trivia')
export class TriviaEntity extends BaseEntity {
	@Column()
	@Index()
	topic: string = '';

	@Column({
		type: 'enum',
		enum: DifficultyLevel,
		default: DifficultyLevel.EASY,
	})
	difficulty: DifficultyLevel = DifficultyLevel.EASY;

	@Column()
	@Index()
	question: string = '';

	@Column('jsonb', { default: [] })
	answers: TriviaAnswer[] = [];

	@Column({ name: 'correct_answer_index', type: 'int' })
	correctAnswerIndex: number = 0;

	@Column({ name: 'user_id', nullable: true })
	userId: string = '';

	@ManyToOne(() => UserEntity, { nullable: true })
	@JoinColumn({ name: 'user_id' })
	user!: UserEntity;

	@Column({ name: 'is_correct', type: 'boolean', default: false })
	isCorrect: boolean = false;

	@Column('jsonb', { nullable: true })
	metadata: TriviaQuestionDetailsMetadata = {};

	@Column({ name: 'search_vector', type: 'tsvector', select: false })
	searchVector: string = '';
}
