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

import { PaymentMethod, PaymentStatus, PaymentMetadata } from '../types/typeorm-compatibility.types';
import { SubscriptionEntity } from './subscription.entity';
import { UserEntity } from './user.entity';

@Entity('payment_history')
export class PaymentHistoryEntity {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ name: 'user_id' })
	@Index()
	userId: string;

	@ManyToOne(() => UserEntity, user => user.id, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'user_id' })
	user: UserEntity;

	@Column({ name: 'subscription_id', nullable: true })
	subscriptionId?: string;

	@ManyToOne(() => SubscriptionEntity, subscription => subscription.id, {
		onDelete: 'SET NULL',
	})
	@JoinColumn({ name: 'subscription_id' })
	subscription?: SubscriptionEntity;

	@Column('decimal', { precision: 10, scale: 2 })
	amount: number;

	@Column({ default: 'USD' })
	currency: string;

	@Column({
		type: 'enum',
		enum: PaymentStatus,
		default: PaymentStatus.PENDING,
	})
	status: PaymentStatus;

	@Column({
		name: 'payment_method',
		type: 'enum',
		enum: PaymentMethod,
		default: PaymentMethod.STRIPE,
	})
	paymentMethod: PaymentMethod;

	@Column({ name: 'stripe_payment_intent_id', nullable: true })
	stripePaymentIntentId?: string;

	@Column({ name: 'stripe_charge_id', nullable: true })
	stripeChargeId?: string;

	@Column({ name: 'paypal_order_id', nullable: true })
	paypalOrderId?: string;

	@Column({ name: 'transaction_id', nullable: true })
	transactionId?: string;

	@Column({ nullable: true })
	description?: string;

	@Column({ name: 'completed_at', type: 'timestamp', nullable: true })
	completedAt?: Date;

	@Column({ name: 'failed_at', type: 'timestamp', nullable: true })
	failedAt?: Date;

	@Column('jsonb', { default: {} })
	metadata: PaymentMetadata;

	@CreateDateColumn({ name: 'created_at' })
	createdAt: Date;

	@UpdateDateColumn({ name: 'updated_at' })
	updatedAt: Date;
}
