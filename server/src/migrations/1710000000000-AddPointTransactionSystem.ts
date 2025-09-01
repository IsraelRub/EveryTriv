import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPointTransactionSystem1710000000000 implements MigrationInterface {
	name = 'AddPointTransactionSystem1710000000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		console.log('Starting migration: AddPointTransactionSystem', {
			migrationName: this.name,
			operation: 'up',
		});

		try {
			// Create point transaction type enum
			console.log('Creating point transaction type enum');
			await queryRunner.query(`
				CREATE TYPE "point_transaction_type_enum" AS ENUM(
					'DAILY_RESET', 'PURCHASE', 'GAME_USAGE', 'ADMIN_ADJUSTMENT', 'REFUND'
				)
			`);

			// Create point source enum
			console.log('Creating point source enum');
			await queryRunner.query(`
				CREATE TYPE "point_source_enum" AS ENUM(
					'FREE_DAILY', 'PURCHASED', 'BONUS', 'REFUND'
				)
			`);

			// Create point_transactions table
			console.log('Creating point_transactions table');
			await queryRunner.query(`
				CREATE TABLE "point_transactions" (
					"id" uuid NOT NULL DEFAULT uuid_generate_v4(),
					"user_id" uuid NOT NULL,
					"type" "point_transaction_type_enum" NOT NULL,
					"source" "point_source_enum",
					"amount" integer NOT NULL,
					"balance_after" integer NOT NULL,
					"free_questions_after" integer NOT NULL DEFAULT 0,
					"purchased_points_after" integer NOT NULL DEFAULT 0,
					"description" character varying,
					"game_history_id" character varying,
					"payment_id" character varying,
					"metadata" jsonb NOT NULL DEFAULT '{}',
					"transaction_date" date NOT NULL DEFAULT CURRENT_DATE,
					"created_at" TIMESTAMP NOT NULL DEFAULT now(),
					CONSTRAINT "PK_point_transactions_id" PRIMARY KEY ("id")
				)
			`);

			// Create indexes
			console.log('Creating indexes for point_transactions table');
			await queryRunner.query(`CREATE INDEX "IDX_point_transactions_user_id" ON "point_transactions" ("user_id")`);
			await queryRunner.query(
				`CREATE INDEX "IDX_point_transactions_date" ON "point_transactions" ("transaction_date")`
			);

			// Add foreign key constraint
			console.log('Adding foreign key constraint for point_transactions');
			await queryRunner.query(`
				ALTER TABLE "point_transactions" ADD CONSTRAINT "FK_point_transactions_user" 
				FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
			`);

			console.log('Migration completed successfully: AddPointTransactionSystem', {
				migrationName: this.name,
				operation: 'up',
				tablesCreated: ['point_transactions'],
				enumsCreated: ['point_transaction_type_enum', 'point_source_enum'],
				indexesCreated: 2,
				foreignKeysAdded: 1,
			});
		} catch (error) {
			console.error('Migration failed: AddPointTransactionSystem', {
				migrationName: this.name,
				operation: 'up',
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		console.log('Starting migration rollback: AddPointTransactionSystem', {
			migrationName: this.name,
			operation: 'down',
		});

		try {
			// Drop foreign key constraint
			console.log('Dropping foreign key constraint');
			await queryRunner.query(`ALTER TABLE "point_transactions" DROP CONSTRAINT "FK_point_transactions_user"`);

			// Drop indexes
			console.log('Dropping indexes');
			await queryRunner.query(`DROP INDEX "IDX_point_transactions_date"`);
			await queryRunner.query(`DROP INDEX "IDX_point_transactions_user_id"`);

			// Drop table
			console.log('Dropping point_transactions table');
			await queryRunner.query(`DROP TABLE "point_transactions"`);

			// Drop enums
			console.log('Dropping enums');
			await queryRunner.query(`DROP TYPE "point_source_enum"`);
			await queryRunner.query(`DROP TYPE "point_transaction_type_enum"`);

			console.log('Migration rollback completed: AddPointTransactionSystem', {
				migrationName: this.name,
				operation: 'down',
				tablesDropped: ['point_transactions'],
				enumsDropped: ['point_source_enum', 'point_transaction_type_enum'],
				indexesDropped: 2,
				foreignKeysDropped: 1,
			});
		} catch (error) {
			console.error('Migration rollback failed: AddPointTransactionSystem', {
				migrationName: this.name,
				operation: 'down',
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}
}
