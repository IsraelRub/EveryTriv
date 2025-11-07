import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

import { PaymentMethod, PlanType, SubscriptionStatus } from '@shared/constants';
import { SubscriptionData } from '@shared/types';

import { BaseEntity } from './base.entity';
import { UserEntity } from './user.entity';

@Entity('subscriptions')
export class SubscriptionEntity extends BaseEntity {
	@Column({ name: 'user_id' })
	@Index()
	userId: string;

	@ManyToOne(() => UserEntity, user => user.id, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'user_id' })
	user: UserEntity;

	@Column({ name: 'plan_id' })
	planId: string;

	@Column({
		type: 'enum',
		enum: SubscriptionStatus,
		default: SubscriptionStatus.PENDING,
	})
	status: SubscriptionStatus;

	@Column('decimal', { precision: 10, scale: 2 })
	price: number;

	@Column({ default: 'USD' })
	currency: string;

	@Column({ name: 'start_date' })
	startDate: Date;

	@Column({ name: 'end_date' })
	endDate: Date;

	@Column({
		name: 'payment_method',
		type: 'enum',
		enum: PaymentMethod,
		default: PaymentMethod.STRIPE,
	})
	paymentMethod: PaymentMethod;

	@Column({ name: 'stripe_price_id', nullable: true })
	stripePriceId?: string;

	@Column({ name: 'stripe_subscription_id', nullable: true })
	stripeSubscriptionId?: string;

	@Column({ name: 'stripe_customer_id', nullable: true })
	stripeCustomerId?: string;

	@Column({
		name: 'plan_type',
		type: 'enum',
		enum: PlanType,
		default: PlanType.BASIC,
	})
	planType: PlanType;

	@Column({ name: 'auto_renew', default: true })
	autoRenew: boolean = true;

	@Column({ name: 'next_billing_date', type: 'timestamp', nullable: true })
	nextBillingDate?: Date;

	@Column({ name: 'cancelled_at', type: 'timestamp', nullable: true })
	cancelledAt?: Date;

	@Column({ name: 'payment_history_id', nullable: true })
	paymentHistoryId?: string;

	@Column('jsonb', { default: {} })
	metadata: SubscriptionData;
}
