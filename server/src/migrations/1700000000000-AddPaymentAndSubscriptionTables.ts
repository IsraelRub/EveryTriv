import { MigrationInterface, QueryRunner } from 'typeorm';

import { ERROR_CODES } from '@shared/constants';

export class AddPaymentAndSubscriptionTables1700000000000 implements MigrationInterface {
	name = 'AddPaymentAndSubscriptionTables1700000000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		console.log('Starting migration: AddPaymentAndSubscriptionTables', {
			migrationName: this.name,
			operation: 'up',
		});

		try {
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

			// Create indexes
			await queryRunner.query(`CREATE INDEX "IDX_payment_history_user_id" ON "payment_history" ("user_id")`);
			await queryRunner.query(`CREATE INDEX "IDX_payment_history_payment_id" ON "payment_history" ("payment_id")`);
			await queryRunner.query(`CREATE INDEX "IDX_payment_history_status" ON "payment_history" ("status")`);
			await queryRunner.query(`CREATE INDEX "IDX_payment_history_created_at" ON "payment_history" ("created_at")`);

			// Add foreign key constraints
			await queryRunner.query(`
			ALTER TABLE "payment_history" ADD CONSTRAINT "FK_payment_history_user" 
			FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
		`);

			console.log('Migration completed successfully: AddPaymentAndSubscriptionTables', {
				migrationName: this.name,
				operation: 'up',
				tablesCreated: ['payment_history'],
				indexesCreated: 4,
				foreignKeysAdded: 1,
			});
		} catch (error) {
			console.error('Migration failed: AddPaymentAndSubscriptionTables', {
				migrationName: this.name,
				operation: 'up',
				error: error instanceof Error ? error.message : String(error),
			});
			throw error;
		}
	}

	public async down(): Promise<void> {
		throw new Error(ERROR_CODES.ROLLBACK_NOT_SUPPORTED);
	}
}
