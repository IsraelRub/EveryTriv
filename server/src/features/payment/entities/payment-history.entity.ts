import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('payment_history')
export class PaymentHistoryEntity {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column()
	user_id: string;

	@Column()
	amount: number;

	@Column()
	currency: string;

	@Column()
	payment_type: string;

	@Column()
	payment_method: string;

	@Column()
	status: string;

	@Column({ nullable: true })
	transaction_id: string;

	@Column({ nullable: true })
	completed_at: Date;

	@Column({ nullable: true })
	failed_at: Date;

	@CreateDateColumn()
	created_at: Date;

	@UpdateDateColumn()
	updated_at: Date;
}
