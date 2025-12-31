import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

import { CreditTransactionType } from '@shared/constants';
import { CreditSource } from '@internal/constants';
import { BaseEntity } from './base.entity';
import { UserEntity } from './user.entity';

@Entity('credit_transactions')
export class CreditTransactionEntity extends BaseEntity {
	@Column({ name: 'user_id', type: 'uuid' })
	@Index()
	userId: string;

	@ManyToOne(() => UserEntity)
	@JoinColumn({ name: 'user_id' })
	user: UserEntity;

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
	amount: number; // Positive for credit, negative for debit

	@Column({ name: 'balance_after', type: 'int' })
	balanceAfter: number; // Total balance after this transaction

	@Column({ name: 'free_questions_after', type: 'int', default: 0 })
	freeQuestionsAfter: number; // Remaining free questions after transaction

	@Column({ name: 'purchased_credits_after', type: 'int', default: 0 })
	purchasedCreditsAfter: number; // Remaining purchased credits after transaction

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
		questionsPerRequest?: number;
		requiredCredits?: number;
		pricePerCredit?: number;
		originalAmount?: number;
		gameMode?: string;
		freeQuestionsUsed?: number;
		purchasedCreditsUsed?: number;
		creditsUsed?: number;
		reason?: string | null;
		isBonus?: boolean;
	} = {};

	@Index()
	@Column({ name: 'transaction_date', type: 'date', default: () => 'CURRENT_DATE' })
	transactionDate: Date;
}
