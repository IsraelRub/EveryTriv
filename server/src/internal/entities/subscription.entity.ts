import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

import { PlanType, SubscriptionStatus } from '@shared/constants';
import type { SubscriptionData } from '@shared/types';

import { BaseEntity } from './base.entity';
import { UserEntity } from './user.entity';

type SubscriptionMetadata = Partial<SubscriptionData> & {
	currency?: string;
	paymentHistoryId?: string;
};

@Entity('subscriptions')
export class SubscriptionEntity extends BaseEntity {
	@Column({ name: 'user_id' })
	@Index()
	userId!: string;

	@ManyToOne(() => UserEntity, user => user.id, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'user_id' })
	user!: UserEntity;

	@Column({ name: 'subscription_id', type: 'varchar' })
	subscriptionExternalId: string = '';

	@Column({ name: 'plan_id', type: 'varchar' })
	planId: string = '';

	@Column({ name: 'status', type: 'varchar', default: SubscriptionStatus.PENDING })
	private statusInternal: SubscriptionStatus = SubscriptionStatus.PENDING;

	@Column({ name: 'current_period_start', type: 'timestamp', nullable: true })
	private periodStart?: Date;

	@Column({ name: 'current_period_end', type: 'timestamp', nullable: true })
	private periodEnd?: Date;

	@Column({ name: 'cancel_at_period_end', type: 'boolean', default: false })
	cancelAtPeriodEnd: boolean = false;

	@Column('jsonb', { default: () => "'{}'::jsonb" })
	private metadataInternal: SubscriptionMetadata = {};

	get status(): SubscriptionStatus {
		return this.statusInternal ?? SubscriptionStatus.PENDING;
	}

	set status(value: SubscriptionStatus) {
		this.statusInternal = value;
	}

	get startDate(): Date | undefined {
		return this.periodStart;
	}

	set startDate(value: Date | undefined) {
		this.periodStart = value;
	}

	get endDate(): Date | undefined {
		return this.periodEnd;
	}

	set endDate(value: Date | undefined) {
		this.periodEnd = value;
	}

	get metadata(): SubscriptionMetadata {
		if (!this.metadataInternal) {
			this.metadataInternal = {};
		}
		return this.metadataInternal;
	}

	set metadata(value: SubscriptionMetadata) {
		this.metadataInternal = value ?? {};
	}

	get planType(): PlanType {
		return this.metadata.planType ?? PlanType.BASIC;
	}

	set planType(value: PlanType) {
		this.metadata.planType = value;
		this.planId = value;
	}

	get price(): number {
		return this.metadata.price ?? 0;
	}

	set price(value: number) {
		this.metadata.price = value;
	}

	get currency(): string {
		return this.metadata.currency ?? 'USD';
	}

	set currency(value: string) {
		this.metadata.currency = value;
	}

	get autoRenew(): boolean {
		return this.metadata.autoRenew ?? !this.cancelAtPeriodEnd;
	}

	set autoRenew(value: boolean) {
		this.metadata.autoRenew = value;
		this.cancelAtPeriodEnd = !value;
	}

	get nextBillingDate(): Date | undefined {
		const value = this.metadata.nextBillingDate;
		return value ? new Date(value) : undefined;
	}

	set nextBillingDate(value: Date | undefined) {
		if (value) {
			this.metadata.nextBillingDate = value;
		} else {
			delete this.metadata.nextBillingDate;
		}
	}

	get paymentHistoryId(): string | undefined {
		return this.metadata.paymentHistoryId ?? undefined;
	}

	set paymentHistoryId(value: string | undefined) {
		if (value) {
			this.metadata.paymentHistoryId = value;
		} else {
			delete this.metadata.paymentHistoryId;
		}
	}

	get features(): string[] {
		const value = this.metadata.features;
		return Array.isArray(value) ? [...value] : [];
	}

	set features(value: string[]) {
		this.metadata.features = value ?? [];
	}

	get cancelledAt(): Date | undefined {
		const value = this.metadata.cancelledAt;
		return value ? new Date(value) : undefined;
	}

	set cancelledAt(value: Date | undefined) {
		if (value) {
			this.metadata.cancelledAt = value;
		} else {
			delete this.metadata.cancelledAt;
		}
	}
}
