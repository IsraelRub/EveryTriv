import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

import { PaymentMethod, PaymentStatus } from '@shared/constants';

import type { PaymentHistoryMetadata } from '@internal/types';

import { BaseEntity } from './base.entity';
import { UserEntity } from './user.entity';

@Entity('payment_history')
export class PaymentHistoryEntity extends BaseEntity {
	@Column({ name: 'user_id' })
	@Index()
	userId!: string;

	@ManyToOne(() => UserEntity, user => user.id, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'user_id' })
	user!: UserEntity;

	@Column({ name: 'payment_id', type: 'varchar' })
	providerTransactionId!: string;

	@Column({ name: 'amount', type: 'int' })
	amount: number = 0;

	@Column({ default: 'USD' })
	currency: string = 'USD';

	@Column({ name: 'status', type: 'varchar', default: PaymentStatus.PENDING })
	private statusInternal: PaymentStatus = PaymentStatus.PENDING;

	@Column({ name: 'payment_method', type: 'varchar', nullable: true })
	private paymentMethodInternal?: PaymentMethod;

	@Column({ nullable: true })
	description?: string;

	@Column({ name: 'completed_at', type: 'timestamp', nullable: true })
	completedAt?: Date;

	@Column({ name: 'failed_at', type: 'timestamp', nullable: true })
	failedAt?: Date;

	@Column('jsonb', { name: 'metadata', default: () => "'{}'::jsonb" })
	private metadataInternal: PaymentHistoryMetadata = {};

	get status(): PaymentStatus {
		return this.statusInternal ?? PaymentStatus.PENDING;
	}

	set status(value: PaymentStatus) {
		this.statusInternal = value;
	}

	get paymentMethod(): PaymentMethod | undefined {
		return this.paymentMethodInternal;
	}

	set paymentMethod(value: PaymentMethod | undefined) {
		this.paymentMethodInternal = value;
	}

	get metadata(): PaymentHistoryMetadata {
		if (!this.metadataInternal) {
			this.metadataInternal = {};
		}
		return this.metadataInternal;
	}

	set metadata(value: PaymentHistoryMetadata) {
		this.metadataInternal = value ?? {};
	}
}
