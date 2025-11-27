import { Column, Entity, Index } from 'typeorm';

import { UserRole } from '@shared/constants';
import type { Achievement, UserPreferences } from '@shared/types';

import { BaseEntity } from './base.entity';

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

	@Column({ nullable: true })
	avatar?: string;

	@Column('int', { default: 100 })
	credits: number = 100;

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

	@Column({ default: UserRole.USER })
	role: UserRole = UserRole.USER;

	@Column('jsonb', { default: {} })
	preferences: Partial<UserPreferences> = {};

	@Column({ name: 'current_subscription_id', nullable: true })
	currentSubscriptionId?: string;

	@Column('jsonb', { default: [] })
	achievements: Achievement[];
}
