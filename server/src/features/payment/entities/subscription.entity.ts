import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('subscriptions')
export class SubscriptionEntity {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column()
	user_id: string;

	@Column()
	plan_type: string;

	@Column()
	status: string;

	@Column({ type: 'timestamp' })
	start_date: Date;

	@Column({ type: 'timestamp' })
	end_date: Date;

	@Column({ nullable: true })
	payment_history_id: string;

	@Column({ nullable: true })
	auto_renew: boolean;

	@Column({ nullable: true })
	next_billing_date: Date;

	@Column({ nullable: true })
	cancelled_at: Date;

	@CreateDateColumn()
	created_at: Date;

	@UpdateDateColumn()
	updated_at: Date;
}
