import {
	Column,
	CreateDateColumn,
	Entity,
	Index,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from 'typeorm';

import type { TriviaAnswer } from '@shared/types';
import { UserEntity } from './user.entity';

@Entity('trivia')
export class TriviaEntity {
	@PrimaryGeneratedColumn('uuid')
	id: string = '';

	@Column()
	@Index()
	topic: string = '';

	@Column()
	difficulty: string = '';

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
	metadata: {
		category?: string;
		tags?: string[];
		source?: string;
		difficulty_score?: number;
		custom_difficulty_description?: string;
	} = {};

	@CreateDateColumn({ name: 'created_at' })
	createdAt: Date = new Date();

	@UpdateDateColumn({ name: 'updated_at' })
	updatedAt: Date = new Date();

	@Column({ name: 'search_vector', type: 'tsvector', select: false })
	searchVector: string = '';
}
