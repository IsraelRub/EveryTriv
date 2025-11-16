import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

import { BaseEntity } from './base.entity';
import { UserEntity } from './user.entity';

/**
 * User Stats Entity
 *
 * @entity UserStatsEntity
 * @description Entity for storing user game statistics and performance metrics
 * @used_by server/src/features/analytics, server/src/features/game
 */
@Entity('user_stats')
export class UserStatsEntity extends BaseEntity {
	@Column({ name: 'user_id', type: 'uuid' })
	@Index({ unique: true })
	userId: string = '';

	@ManyToOne(() => UserEntity, { nullable: false, onDelete: 'CASCADE' })
	@JoinColumn({ name: 'user_id' })
	user!: UserEntity;

	// Game Statistics
	@Column('int', { name: 'total_games', default: 0 })
	@Index()
	totalGames: number = 0;

	@Column('int', { name: 'total_questions', default: 0 })
	totalQuestions: number = 0;

	@Column('int', { name: 'correct_answers', default: 0 })
	correctAnswers: number = 0;

	@Column('int', { name: 'incorrect_answers', default: 0 })
	incorrectAnswers: number = 0;

	@Column('decimal', { name: 'overall_success_rate', precision: 5, scale: 2, default: 0 })
	@Index()
	overallSuccessRate: number = 0;

	// Streak Statistics
	@Column('int', { name: 'current_streak', default: 0 })
	currentStreak: number = 0;

	@Column('int', { name: 'longest_streak', default: 0 })
	longestStreak: number = 0;

	@Column('timestamp', { name: 'last_play_date', nullable: true })
	lastPlayDate?: Date;

	@Column('int', { name: 'consecutive_days_played', default: 0 })
	consecutiveDaysPlayed: number = 0;

	// Topic Statistics (JSONB for flexibility)
	@Column('jsonb', { name: 'topic_stats', default: {} })
	topicStats: Record<
		string,
		{
			totalQuestions: number;
			correctAnswers: number;
			successRate: number;
			score: number;
			lastPlayed: Date;
		}
	> = {};

	// Difficulty Statistics (JSONB for flexibility)
	@Column('jsonb', { name: 'difficulty_stats', default: {} })
	difficultyStats: Record<
		string,
		{
			totalQuestions: number;
			correctAnswers: number;
			successRate: number;
			score: number;
			lastPlayed: Date;
		}
	> = {};

	// Time-based Statistics
	@Column('int', { name: 'weekly_score', default: 0 })
	@Index()
	weeklyScore: number = 0;

	@Column('int', { name: 'monthly_score', default: 0 })
	@Index()
	monthlyScore: number = 0;

	@Column('int', { name: 'yearly_score', default: 0 })
	@Index()
	yearlyScore: number = 0;

	@Column('timestamp', { name: 'last_weekly_reset', nullable: true })
	lastWeeklyReset?: Date;

	@Column('timestamp', { name: 'last_monthly_reset', nullable: true })
	lastMonthlyReset?: Date;

	@Column('timestamp', { name: 'last_yearly_reset', nullable: true })
	lastYearlyReset?: Date;

	// Performance Metrics
	@Column('int', { name: 'average_time_per_question', default: 0 })
	averageTimePerQuestion: number = 0; // in seconds

	@Column('int', { name: 'total_play_time', default: 0 })
	totalPlayTime: number = 0; // in seconds

	@Column('int', { name: 'best_game_score', default: 0 })
	bestGameScore: number = 0;

	@Column('timestamp', { name: 'best_game_date', nullable: true })
	bestGameDate?: Date;
}
