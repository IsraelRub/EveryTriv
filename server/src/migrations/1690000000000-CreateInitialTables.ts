import { MigrationInterface, QueryRunner } from 'typeorm';

import { ERROR_CODES } from '@shared/constants';

export class CreateInitialTables1690000000000 implements MigrationInterface {
	name = 'CreateInitialTables1690000000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		console.log('Starting migration: CreateInitialTables', {
			migrationName: this.name,
			operation: 'up',
		});

		try {
			// Enable uuid-ossp extension
			console.log('Enabling uuid-ossp extension');
			await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

			// Create users table
			console.log('Creating users table');
			await queryRunner.query(`
				CREATE TABLE "users" (
					"id" uuid NOT NULL DEFAULT uuid_generate_v4(),
					"email" character varying NOT NULL,
					"password_hash" character varying,
					"google_id" character varying,
					"first_name" character varying,
					"last_name" character varying,
					"avatar" character varying,
					"credits" integer NOT NULL DEFAULT '100',
					"purchased_credits" integer NOT NULL DEFAULT '0',
					"daily_free_questions" integer NOT NULL DEFAULT '20',
					"remaining_free_questions" integer NOT NULL DEFAULT '20',
					"last_free_questions_reset" date,
					"is_active" boolean NOT NULL DEFAULT true,
					"role" character varying NOT NULL DEFAULT 'user',
					"preferences" jsonb NOT NULL DEFAULT '{}',
					"current_subscription_id" character varying,
					"achievements" jsonb NOT NULL DEFAULT '[]',
					"created_at" TIMESTAMP NOT NULL DEFAULT now(),
					"updated_at" TIMESTAMP NOT NULL DEFAULT now(),
					CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"),
					CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
				)
			`);

			// Create indexes for users table
			console.log('Creating indexes for users table');
			await queryRunner.query(`CREATE INDEX "IDX_users_email" ON "users" ("email")`);
			await queryRunner.query(`CREATE INDEX "IDX_users_google_id" ON "users" ("google_id")`);
			await queryRunner.query(`CREATE INDEX "IDX_users_created_at" ON "users" ("created_at")`);

			// Drop unused columns if they exist (for existing databases)
			console.log('Dropping unused columns from users table if they exist');
			await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "reset_password_token"`);
			await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "reset_password_expires"`);
			await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "search_vector"`);

			console.log('Migration completed successfully: CreateInitialTables', {
				migrationName: this.name,
				operation: 'up',
				tablesCreated: ['users'],
				indexesCreated: 3,
			});
		} catch (error) {
			console.error('Migration failed: CreateInitialTables', {
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
