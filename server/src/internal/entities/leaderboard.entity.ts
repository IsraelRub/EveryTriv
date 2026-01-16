import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

import { BaseEntity } from './base.entity';
import { UserEntity } from './user.entity';
import { UserStatsEntity } from './userStats.entity';

@Entity('leaderboard')
export class LeaderboardEntity extends BaseEntity {
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

	@Column('timestamp', { name: 'last_rank_update', nullable: true })
	lastRankUpdate?: Date;
}
