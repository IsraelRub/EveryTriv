import { MigrationInterface, QueryRunner } from 'typeorm';

import { ERROR_CODES } from '@shared/constants';

export class AddCreditTransactionSystem1710000000000 implements MigrationInterface {
	name = 'AddCreditTransactionSystem1710000000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		console.log('Starting migration: AddCreditTransactionSystem', {
			migrationName: this.name,
			operation: 'up',
		});

		try {
			// Create credit transaction type enum
			console.log('Creating credit transaction type enum');
			await queryRunner.query(`
				CREATE TYPE "credit_transaction_type_enum" AS ENUM(
					'DAILY_RESET', 'PURCHASE', 'GAME_USAGE', 'ADMIN_ADJUSTMENT', 'REFUND'
				)
			`);

			// Create credit source enum
			console.log('Creating credit source enum');
			await queryRunner.query(`
				CREATE TYPE "credit_source_enum" AS ENUM(
					'FREE_DAILY', 'PURCHASED', 'BONUS', 'REFUND'
				)
			`);

			// Create credit_transactions table
			console.log('Creating credit_transactions table');
			await queryRunner.query(`
				CREATE TABLE "credit_transactions" (
					"id" uuid NOT NULL DEFAULT uuid_generate_v4(),
					"user_id" uuid NOT NULL,
					"type" "credit_transaction_type_enum" NOT NULL,
					"source" "credit_source_enum",
					"amount" integer NOT NULL,
					"balance_after" integer NOT NULL,
					"free_questions_after" integer NOT NULL DEFAULT 0,
					"purchased_credits_after" integer NOT NULL DEFAULT 0,
					"description" character varying,
					"game_history_id" character varying,
					"payment_id" character varying,
					"metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
					"transaction_date" date NOT NULL DEFAULT CURRENT_DATE,
					"created_at" TIMESTAMP NOT NULL DEFAULT now(),
					"updated_at" TIMESTAMP NOT NULL DEFAULT now(),
					CONSTRAINT "PK_credit_transactions_id" PRIMARY KEY ("id")
				)
			`);

			// Create indexes
			console.log('Creating indexes for credit_transactions table');
			await queryRunner.query(`CREATE INDEX "IDX_credit_transactions_user_id" ON "credit_transactions" ("user_id")`);
			await queryRunner.query(
				`CREATE INDEX "IDX_credit_transactions_date" ON "credit_transactions" ("transaction_date")`
			);

			// Add foreign key constraint
			console.log('Adding foreign key constraint for credit_transactions');
			await queryRunner.query(`
				ALTER TABLE "credit_transactions" ADD CONSTRAINT "FK_credit_transactions_user" 
				FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
			`);

			console.log('Migration completed successfully: AddCreditTransactionSystem', {
				migrationName: this.name,
				operation: 'up',
				tablesCreated: ['credit_transactions'],
				enumsCreated: ['credit_transaction_type_enum', 'credit_source_enum'],
				indexesCreated: 2,
				foreignKeysAdded: 1,
			});
		} catch (error) {
			console.error('Migration failed: AddCreditTransactionSystem', {
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
