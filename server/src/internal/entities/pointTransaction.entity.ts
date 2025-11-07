import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

import { PointSource, PointTransactionType } from '@shared/constants';

import { BaseEntity } from './base.entity';
import { UserEntity } from './user.entity';

@Entity('point_transactions')
export class PointTransactionEntity extends BaseEntity {
	@Column({ name: 'user_id', type: 'uuid' })
	@Index()
	userId: string;

	@ManyToOne(() => UserEntity)
	@JoinColumn({ name: 'user_id' })
	user: UserEntity;

	@Column({
		type: 'enum',
		enum: PointTransactionType,
	})
	type: PointTransactionType;

	@Column({
		type: 'enum',
		enum: PointSource,
		nullable: true,
	})
	source?: PointSource;

	@Column('int')
	amount: number; // Positive for credit, negative for debit

	@Column({ name: 'balance_after', type: 'int' })
	balanceAfter: number; // Total balance after this transaction

	@Column({ name: 'free_questions_after', type: 'int', default: 0 })
	freeQuestionsAfter: number; // Remaining free questions after transaction

	@Column({ name: 'purchased_points_after', type: 'int', default: 0 })
	purchasedPointsAfter: number; // Remaining purchased points after transaction

	@Column({ nullable: true })
	description?: string;

	@Column({ name: 'game_history_id', nullable: true })
	gameHistoryId?: string; // Reference to game session if applicable

	@Column({ name: 'payment_id', nullable: true })
	paymentId?: string; // Reference to payment if applicable

	@Column('jsonb', { default: {} })
	metadata: {
		difficulty?: string;
		topic?: string;
		questionCount?: number;
		pricePerPoint?: number;
		originalAmount?: number;
		gameMode?: string;
		freeQuestionsUsed?: number;
		purchasedPointsUsed?: number;
		creditsUsed?: number;
	} = {};

	@Index()
	@Column({ name: 'transaction_date', type: 'date', default: () => 'CURRENT_DATE' })
	transactionDate: Date;
}
