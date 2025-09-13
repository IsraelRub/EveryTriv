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

import { UserEntity } from './user.entity';
import { UserStatsEntity } from './userStats.entity';

/**
 * Leaderboard Entity
 *
 * @entity LeaderboardEntity
 * @description Entity for storing user rankings and leaderboard data
 * Focused on ranking-specific data only, avoiding duplication with UserEntity and UserStatsEntity
 * @used_by server/src/features/leaderboard/leaderboard.service.ts
 */
@Entity('leaderboard')
export class LeaderboardEntity {
	@PrimaryGeneratedColumn('uuid')
	id: string = '';

	@Column({ name: 'user_id', type: 'uuid' })
	@Index({ unique: true })
	userId: string = '';

	@ManyToOne(() => UserEntity, { nullable: false, onDelete: 'CASCADE' })
	@JoinColumn({ name: 'user_id' })
	user!: UserEntity;

	@Column({ name: 'user_stats_id', type: 'uuid' })
	@Index()
	userStatsId: string = '';

	@ManyToOne(() => UserStatsEntity, { nullable: false, onDelete: 'CASCADE' })
	@JoinColumn({ name: 'user_stats_id' })
	userStats!: UserStatsEntity;

	// Ranking-specific data only
	@Column('int')
	@Index()
	rank: number = 0;

	@Column('int')
	@Index()
	percentile: number = 0;

	@Column('int')
	@Index()
	score: number = 0;

	@Column('int', { name: 'total_users' })
	totalUsers: number = 0;

	// Time-based rankings (calculated from UserStatsEntity)
	@Column('int', { name: 'weekly_rank' })
	@Index()
	weeklyRank: number = 0;

	@Column('int', { name: 'monthly_rank' })
	@Index()
	monthlyRank: number = 0;

	@Column('int', { name: 'yearly_rank' })
	@Index()
	yearlyRank: number = 0;

	// Ranking metadata
	@Column('timestamp', { name: 'last_rank_update', nullable: true })
	lastRankUpdate?: Date;

	@Column('timestamp', { name: 'last_weekly_rank_update', nullable: true })
	lastWeeklyRankUpdate?: Date;

	@Column('timestamp', { name: 'last_monthly_rank_update', nullable: true })
	lastMonthlyRankUpdate?: Date;

	@Column('timestamp', { name: 'last_yearly_rank_update', nullable: true })
	lastYearlyRankUpdate?: Date;

	// Ranking history (for trend analysis)
	@Column('jsonb', { name: 'rank_history', default: [] })
	rankHistory: Array<{
		rank: number;
		score: number;
		date: Date;
		period: 'daily' | 'weekly' | 'monthly' | 'yearly';
	}> = [];

	@CreateDateColumn({ name: 'created_at' })
	createdAt: Date = new Date();

	@UpdateDateColumn({ name: 'updated_at' })
	updatedAt: Date = new Date();
}
