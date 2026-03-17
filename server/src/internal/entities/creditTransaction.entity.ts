import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

import { CreditSource, CreditTransactionType } from '@shared/constants';

import type { CreditTransaction } from '@internal/types';

import { BaseEntity } from './base.entity';
import { GameHistoryEntity } from './gameHistory.entity';
import { PaymentHistoryEntity } from './paymentHistory.entity';
import { UserEntity } from './user.entity';

@Entity('credit_transactions')
export class CreditTransactionEntity extends BaseEntity {
	@Column({ name: 'user_id', type: 'uuid' })
	@Index()
	userId!: string;

	@ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'user_id' })
	user!: UserEntity;

	@Column({
		type: 'enum',
		enum: CreditTransactionType,
	})
	type: CreditTransactionType;

	@Column({
		type: 'enum',
		enum: CreditSource,
		nullable: true,
	})
	source?: CreditSource;

	@Column('int')
	amount: number;

	@Column({ name: 'balance_after', type: 'int' })
	balanceAfter: number;

	@Column({ name: 'free_questions_after', type: 'int', default: 0 })
	freeQuestionsAfter: number;

	@Column({ name: 'purchased_credits_after', type: 'int', default: 0 })
	purchasedCreditsAfter: number;

	@Column({ nullable: true })
	description?: string;

	@Column({ name: 'game_history_id', type: 'uuid', nullable: true })
	gameHistoryId?: string;

	@ManyToOne(() => GameHistoryEntity, { nullable: true, onDelete: 'SET NULL' })
	@JoinColumn({ name: 'game_history_id' })
	gameHistory?: GameHistoryEntity;

	@Column({ name: 'payment_id', type: 'varchar', nullable: true })
	@Index()
	paymentId?: string;

	@ManyToOne(() => PaymentHistoryEntity, { nullable: true, onDelete: 'SET NULL' })
	@JoinColumn({ name: 'payment_id', referencedColumnName: 'providerTransactionId' })
	paymentHistory?: PaymentHistoryEntity;

	@Column('jsonb', { default: {} })
	metadata: CreditTransaction['metadata'] = {};

	@Index()
	@Column({
		name: 'transaction_date',
		type: 'date',
		default: () => 'CURRENT_DATE',
	})
	transactionDate: Date;
}
