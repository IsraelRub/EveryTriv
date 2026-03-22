import { Column, Entity, Index, OneToMany, OneToOne } from 'typeorm';

import { UserRole } from '@shared/constants';
import type { SavedAchievement, UserPreferences } from '@shared/types';

import { BaseEntity } from './base.entity';
import { CreditTransactionEntity } from './creditTransaction.entity';
import { GameHistoryEntity } from './gameHistory.entity';
import { PaymentHistoryEntity } from './paymentHistory.entity';
import { TriviaEntity } from './trivia.entity';
import { UserStatsEntity } from './userStats.entity';

@Entity('users')
export class UserEntity extends BaseEntity {
	@Column()
	@Index({ unique: true })
	email: string;

	@Column({ name: 'password_hash', nullable: true })
	passwordHash?: string;

	@Column({ name: 'google_id', nullable: true })
	googleId?: string;

	@Column({ name: 'first_name', nullable: true })
	firstName?: string;

	@Column({ name: 'last_name', nullable: true })
	lastName?: string;

	@Column('int', { nullable: true, default: 150 })
	credits: number | null = 150;

	@Column({ name: 'last_granted_credits_refill_at', type: 'timestamp', nullable: true })
	lastGrantedCreditsRefillAt?: Date | null;

	@Column({ name: 'purchased_credits', type: 'int', default: 0 })
	purchasedCredits: number = 0;

	@Column({ name: 'daily_free_questions', type: 'int', default: 20 })
	dailyFreeQuestions: number = 20;

	@Column({ name: 'remaining_free_questions', type: 'int', default: 20 })
	remainingFreeQuestions: number = 20;

	@Column({ name: 'last_free_questions_reset', type: 'date', nullable: true })
	lastFreeQuestionsReset?: Date;

	@Column({ name: 'last_login', type: 'timestamp', nullable: true })
	lastLogin?: Date;

	@Column({ name: 'is_active', default: true })
	isActive: boolean = true;

	@Column({ name: 'email_verified', default: false })
	emailVerified: boolean = false;

	@Column({ default: UserRole.USER })
	role: UserRole = UserRole.USER;

	@Column('jsonb', { default: {} })
	preferences: Partial<UserPreferences> = {};

	@Column({ name: 'custom_avatar', type: 'bytea', nullable: true })
	customAvatar?: Buffer;

	@Column({ name: 'custom_avatar_mime', type: 'varchar', length: 30, nullable: true })
	customAvatarMime?: string;

	@Column('jsonb', { default: [] })
	achievements: SavedAchievement[];

	// Relations
	@OneToOne(() => UserStatsEntity, userStats => userStats.user)
	userStats?: UserStatsEntity;

	@OneToMany(() => GameHistoryEntity, gameHistory => gameHistory.user)
	gameHistories?: GameHistoryEntity[];

	@OneToMany(() => CreditTransactionEntity, transaction => transaction.user)
	creditTransactions?: CreditTransactionEntity[];

	@OneToMany(() => PaymentHistoryEntity, payment => payment.user)
	paymentHistories?: PaymentHistoryEntity[];

	@OneToMany(() => TriviaEntity, trivia => trivia.user)
	trivias?: TriviaEntity[];
}
