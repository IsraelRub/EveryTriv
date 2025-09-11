import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

// import { GameMode } from '../../../../shared/types'; // Removed as GameMode is a type, not an enum value
import { UserEntity } from './user.entity';

@Entity('game_history')
export class GameHistoryEntity {
	@PrimaryGeneratedColumn('uuid')
	id: string = '';

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
		default: 'classic',
	})
	gameMode: string = 'classic';

	@Column({ name: 'time_spent', type: 'int', nullable: true })
	timeSpent?: number; // in seconds

	@Column({ name: 'credits_used', type: 'int' })
	creditsUsed: number = 0;

	@Column({ name: 'questions_data', type: 'jsonb', default: [] })
	questionsData: Array<{
		question: string;
		userAnswer: string;
		correctAnswer: string;
		isCorrect: boolean;
		timeSpent?: number;
	}> = [];

	@CreateDateColumn({ name: 'created_at' })
	createdAt: Date = new Date();
}
