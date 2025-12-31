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
	private paymentIdInternal!: string;

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

	@Column('jsonb', { name: 'metadata', default: () => "'{}'::jsonb" })
	private metadataInternal: PaymentHistoryMetadata = {};

	get paymentId(): string {
		return this.paymentIdInternal;
	}

	set paymentId(value: string) {
		this.paymentIdInternal = value;
	}

	get transactionId(): string {
		return this.paymentIdInternal;
	}

	set transactionId(value: string | undefined) {
		if (value) {
			this.paymentIdInternal = value;
		}
	}

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

	get completedAt(): Date | undefined {
		const value = this.metadata.completedAt;
		return value ? new Date(value) : undefined;
	}

	set completedAt(value: Date | undefined) {
		if (value) {
			this.metadata.completedAt = value.toISOString();
		} else {
			delete this.metadata.completedAt;
		}
	}

	get failedAt(): Date | undefined {
		const value = this.metadata.failedAt;
		return value ? new Date(value) : undefined;
	}

	set failedAt(value: Date | undefined) {
		if (value) {
			this.metadata.failedAt = value.toISOString();
		} else {
			delete this.metadata.failedAt;
		}
	}

	get originalAmount(): number | undefined {
		return this.metadata.originalAmount;
	}

	set originalAmount(value: number | undefined) {
		if (value === undefined || Number.isNaN(value)) {
			delete this.metadata.originalAmount;
		} else {
			this.metadata.originalAmount = value;
		}
	}

	get originalCurrency(): string | undefined {
		return this.metadata.originalCurrency;
	}

	set originalCurrency(value: string | undefined) {
		if (!value) {
			delete this.metadata.originalCurrency;
		} else {
			this.metadata.originalCurrency = value;
		}
	}
}
