import { Column, CreateDateColumn, Entity, Index, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

import { ServerUserPreferences, UserAddress } from '../../../../shared/types';
import { GameHistoryEntity } from './gameHistory.entity';
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

	@Column({ name: 'password_hash', nullable: true })
	passwordHash?: string;

	@Column({ name: 'google_id', nullable: true })
	googleId?: string;

	@Column({ name: 'full_name', nullable: true })
	fullName?: string;

	@Column({ name: 'first_name', nullable: true })
	firstName?: string;

	@Column({ name: 'last_name', nullable: true })
	lastName?: string;

	@Column({ nullable: true })
	phone?: string;

	@Column({ name: 'date_of_birth', type: 'date', nullable: true })
	dateOfBirth?: Date;

	@Column({ nullable: true })
	avatar?: string;

	@Column('int', { default: 0 })
	score: number = 0;

	@Column('int', { default: 100 })
	credits: number = 100;

	@Column({ name: 'purchased_points', type: 'int', default: 0 })
	purchasedPoints: number = 0;

	@Column({ name: 'daily_free_questions', type: 'int', default: 20 })
	dailyFreeQuestions: number = 20;

	@Column({ name: 'remaining_free_questions', type: 'int', default: 20 })
	remainingFreeQuestions: number = 20;

	@Column({ name: 'last_credit_refill', type: 'date', nullable: true })
	lastCreditRefill?: Date;

	@Column({ name: 'last_free_questions_reset', type: 'date', nullable: true })
	lastFreeQuestionsReset?: Date;

	@Column({ name: 'is_active', default: true })
	isActive: boolean = true;

	@Column({ default: 'user' })
	role: 'admin' | 'user' | 'guest' = 'user';

	@Column({ name: 'reset_password_token', nullable: true })
	resetPasswordToken?: string;

	@Column({ name: 'reset_password_expires', type: 'timestamp', nullable: true })
	resetPasswordExpires?: Date;

	@Column('jsonb', { default: {} })
	preferences: ServerUserPreferences = {};

	@Column('jsonb', { default: {} })
	address: UserAddress = {};

	@Column({ name: 'additional_info', nullable: true })
	additionalInfo?: string;

	@Column({ name: 'agree_to_newsletter', default: false })
	agreeToNewsletter: boolean = false;

	@Column({ name: 'current_subscription_id', nullable: true })
	currentSubscriptionId?: string;

	@Column('jsonb', { default: {} })
	stats: {
		topicsPlayed: Record<string, number>;
		difficultyStats: Record<
			string,
			{
				correct: number;
				total: number;
			}
		>;
		totalQuestions: number;
		correctAnswers: number;
		lastPlayed: Date;
		streaks: {
			current: number;
			longest: number;
			lastPlayDate: Date;
		};
		pointsHistory?: Array<{
			id: string;
			type: string;
			amount: number;
			balance: number;
			description: string;
			timestamp: string;
		}>;
		subscription?: {
			subscriptionId: string;
			plan: string;
			status: string;
			startDate: string;
			endDate: string;
			price: number;
			billingCycle: string;
			features: string[];
			cancelledAt?: string;
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
			lastPlayDate: new Date(),
		},
		pointsHistory: [],
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

	@CreateDateColumn({ name: 'created_at' })
	createdAt: Date = new Date();

	@UpdateDateColumn({ name: 'updated_at' })
	updatedAt: Date = new Date();

	@Column('tsvector', { name: 'search_vector', select: false })
	@Index()
	searchVector: string = '';
}
