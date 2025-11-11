import { Column, Entity, Index, OneToMany } from 'typeorm';

import { UserRole } from '@shared/constants';
import type { Achievement, BasicValue, UserAddress, UserPreferences } from '@shared/types';

import { BaseEntity } from './base.entity';
import { GameHistoryEntity } from './gameHistory.entity';
import { TriviaEntity } from './trivia.entity';

@Entity('users')
export class UserEntity extends BaseEntity {
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

	@Column('int', { default: 0 })
	points: number = 0;

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

	@Column({ default: UserRole.USER })
	role: UserRole = UserRole.USER;

	@Column({ name: 'reset_password_token', nullable: true })
	resetPasswordToken?: string;

	@Column({ name: 'reset_password_expires', type: 'timestamp', nullable: true })
	resetPasswordExpires?: Date;

	@Column('jsonb', { default: {} })
	preferences: Partial<UserPreferences> = {};

	@Column('jsonb', { default: {} })
	address: UserAddress = {};

	@Column({ name: 'additional_info', nullable: true })
	bio?: string;

	@Column({ name: 'agree_to_newsletter', default: false })
	agreeToNewsletter: boolean = false;

	@Column({ name: 'current_subscription_id', nullable: true })
	currentSubscriptionId?: string;

	@Column('jsonb', { default: [] })
	achievements: Achievement[];

	@Column('jsonb', { default: {} })
	stats: Record<string, BasicValue> = {};

	@OneToMany(() => TriviaEntity, trivia => trivia.user)
	triviaHistory: TriviaEntity[];

	@OneToMany(() => GameHistoryEntity, gameHistory => gameHistory.user)
	gameHistory: GameHistoryEntity[];

	@Column('tsvector', { name: 'search_vector', select: false })
	@Index()
	searchVector: string = '';
}
