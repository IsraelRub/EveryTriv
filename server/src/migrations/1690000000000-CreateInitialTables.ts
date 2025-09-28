import { getErrorMessage } from '@shared';
import { MigrationInterface, QueryRunner } from 'typeorm';

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
					"username" character varying NOT NULL,
					"email" character varying NOT NULL,
					"password_hash" character varying,
					"google_id" character varying,
					"full_name" character varying,
					"first_name" character varying,
					"last_name" character varying,
					"phone" character varying,
					"date_of_birth" date,
					"avatar" character varying,
					"score" integer NOT NULL DEFAULT '0',
					"credits" integer NOT NULL DEFAULT '100',
					"purchased_points" integer NOT NULL DEFAULT '0',
					"daily_free_questions" integer NOT NULL DEFAULT '20',
					"remaining_free_questions" integer NOT NULL DEFAULT '20',
					"last_credit_refill" date,
					"last_free_questions_reset" date,
					"is_active" boolean NOT NULL DEFAULT true,
					"role" character varying NOT NULL DEFAULT 'user',
					"reset_password_token" character varying,
					"reset_password_expires" TIMESTAMP,
					"preferences" jsonb NOT NULL DEFAULT '{}',
					"address" jsonb NOT NULL DEFAULT '{}',
					"additional_info" character varying,
					"agree_to_newsletter" boolean NOT NULL DEFAULT false,
					"current_subscription_id" character varying,
					"stats" jsonb NOT NULL DEFAULT '{"topicsPlayed": {}, "difficultyStats": {}, "totalQuestions": 0, "correctAnswers": 0, "lastPlayed": null, "streaks": {"current": 0, "longest": 0, "lastPlayDate": null}, "pointsHistory": []}',
					"achievements" jsonb NOT NULL DEFAULT '[]',
					"search_vector" tsvector,
					"created_at" TIMESTAMP NOT NULL DEFAULT now(),
					"updated_at" TIMESTAMP NOT NULL DEFAULT now(),
					CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"),
					CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"),
					CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
				)
			`);

			// Create indexes for users table
			console.log('Creating indexes for users table');
			await queryRunner.query(`CREATE INDEX "IDX_users_email" ON "users" ("email")`);
			await queryRunner.query(`CREATE INDEX "IDX_users_username" ON "users" ("username")`);
			await queryRunner.query(`CREATE INDEX "IDX_users_google_id" ON "users" ("google_id")`);
			await queryRunner.query(`CREATE INDEX "IDX_users_score" ON "users" ("score" DESC)`);
			await queryRunner.query(`CREATE INDEX "IDX_users_created_at" ON "users" ("created_at")`);

			console.log('Migration completed successfully: CreateInitialTables', {
				migrationName: this.name,
				operation: 'up',
				tablesCreated: ['users'],
				indexesCreated: 5,
			});
		} catch (error) {
			console.error('Migration failed: CreateInitialTables', {
				migrationName: this.name,
				operation: 'up',
				error: getErrorMessage(error),
			});
			throw error;
		}
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		console.log('Starting migration rollback: CreateInitialTables', {
			migrationName: this.name,
			operation: 'down',
		});

		try {
			console.log('Dropping users table');
			await queryRunner.query(`DROP TABLE "users"`);

			console.log('Migration rollback completed: CreateInitialTables', {
				migrationName: this.name,
				operation: 'down',
				tablesDropped: ['users'],
			});
		} catch (error) {
			console.error('Migration rollback failed: CreateInitialTables', {
				migrationName: this.name,
				operation: 'down',
				error: getErrorMessage(error),
			});
			throw error;
		}
	}
}
