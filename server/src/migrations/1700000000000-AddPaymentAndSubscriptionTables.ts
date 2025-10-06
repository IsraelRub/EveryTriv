import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPaymentAndSubscriptionTables1700000000000 implements MigrationInterface {
	name = 'AddPaymentAndSubscriptionTables1700000000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		// Create payment_history table
		await queryRunner.query(`
			CREATE TABLE "payment_history" (
				"id" uuid NOT NULL DEFAULT uuid_generate_v4(),
				"user_id" uuid NOT NULL,
				"payment_id" character varying NOT NULL,
				"amount" integer NOT NULL,
				"currency" character varying NOT NULL DEFAULT 'USD',
				"status" character varying NOT NULL,
				"payment_method" character varying,
				"description" character varying,
				"metadata" jsonb NOT NULL DEFAULT '{}',
				"created_at" TIMESTAMP NOT NULL DEFAULT now(),
				"updated_at" TIMESTAMP NOT NULL DEFAULT now(),
				CONSTRAINT "PK_payment_history_id" PRIMARY KEY ("id")
			)
		`);

		// Create subscriptions table
		await queryRunner.query(`
			CREATE TABLE "subscriptions" (
				"id" uuid NOT NULL DEFAULT uuid_generate_v4(),
				"user_id" uuid NOT NULL,
				"subscription_id" character varying NOT NULL,
				"plan_id" character varying NOT NULL,
				"status" character varying NOT NULL,
				"current_period_start" TIMESTAMP,
				"current_period_end" TIMESTAMP,
				"cancel_at_period_end" boolean NOT NULL DEFAULT false,
				"metadata" jsonb NOT NULL DEFAULT '{}',
				"created_at" TIMESTAMP NOT NULL DEFAULT now(),
				"updated_at" TIMESTAMP NOT NULL DEFAULT now(),
				CONSTRAINT "PK_subscriptions_id" PRIMARY KEY ("id")
			)
		`);

		// Create indexes
		await queryRunner.query(`CREATE INDEX "IDX_payment_history_user_id" ON "payment_history" ("user_id")`);
		await queryRunner.query(`CREATE INDEX "IDX_payment_history_payment_id" ON "payment_history" ("payment_id")`);
		await queryRunner.query(`CREATE INDEX "IDX_payment_history_status" ON "payment_history" ("status")`);
		await queryRunner.query(`CREATE INDEX "IDX_payment_history_created_at" ON "payment_history" ("created_at")`);

		await queryRunner.query(`CREATE INDEX "IDX_subscriptions_user_id" ON "subscriptions" ("user_id")`);
		await queryRunner.query(`CREATE INDEX "IDX_subscriptions_subscription_id" ON "subscriptions" ("subscription_id")`);
		await queryRunner.query(`CREATE INDEX "IDX_subscriptions_status" ON "subscriptions" ("status")`);
		await queryRunner.query(`CREATE INDEX "IDX_subscriptions_plan_id" ON "subscriptions" ("plan_id")`);

		// Add foreign key constraints
		await queryRunner.query(`
			ALTER TABLE "payment_history" ADD CONSTRAINT "FK_payment_history_user" 
			FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
		`);

		await queryRunner.query(`
			ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_subscriptions_user" 
			FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
		`);

		console.log('Migration completed successfully: AddPaymentAndSubscriptionTables', {
			migrationName: this.name,
			operation: 'up',
			tablesCreated: ['payment_history', 'subscriptions'],
			indexesCreated: 8,
			foreignKeysAdded: 2,
		});
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		// Drop foreign key constraints
		await queryRunner.query(`ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_subscriptions_user"`);
		await queryRunner.query(`ALTER TABLE "payment_history" DROP CONSTRAINT "FK_payment_history_user"`);

		// Drop tables
		await queryRunner.query(`DROP TABLE "subscriptions"`);
		await queryRunner.query(`DROP TABLE "payment_history"`);
	}
}
