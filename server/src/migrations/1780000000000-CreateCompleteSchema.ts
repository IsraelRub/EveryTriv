import { MigrationInterface, QueryRunner } from 'typeorm';

import { MAX_POINTS_PER_QUESTION, UserRole } from '@shared/constants';

export class CreateCompleteSchema1780000000000 implements MigrationInterface {
	name = 'CreateCompleteSchema1780000000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		console.log('Starting migration: CreateCompleteSchema', {
			migrationName: this.name,
			operation: 'up',
		});

		try {
			// Enable uuid-ossp extension
			console.log('Enabling uuid-ossp extension');
			await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

			// Create credit transaction type enum
			console.log('Creating credit transaction type enum');
			await queryRunner.query(`
				DO $$ BEGIN
					CREATE TYPE "credit_transaction_type_enum" AS ENUM(
						'DAILY_RESET', 'PURCHASE', 'GAME_USAGE', 'ADMIN_ADJUSTMENT', 'REFUND'
					);
				EXCEPTION
					WHEN duplicate_object THEN null;
				END $$;
			`);

			// Create credit source enum
			console.log('Creating credit source enum');
			await queryRunner.query(`
				DO $$ BEGIN
					CREATE TYPE "credit_source_enum" AS ENUM(
						'GRANTED', 'PURCHASED'
					);
				EXCEPTION
					WHEN duplicate_object THEN null;
				END $$;
			`);

			// Create users table
			console.log('Creating users table');
			await queryRunner.query(`
				CREATE TABLE IF NOT EXISTS "users" (
					"id" uuid NOT NULL DEFAULT uuid_generate_v4(),
					"email" character varying NOT NULL,
					"password_hash" character varying,
					"google_id" character varying,
					"first_name" character varying,
					"last_name" character varying,
					"credits" integer DEFAULT '150',
					"purchased_credits" integer NOT NULL DEFAULT '0',
					"last_granted_credits_refill_at" TIMESTAMP NULL,
					"last_login" TIMESTAMP,
					"is_active" boolean NOT NULL DEFAULT true,
					"email_verified" boolean NOT NULL DEFAULT false,
					"role" character varying NOT NULL DEFAULT '${UserRole.USER}',
					"preferences" jsonb NOT NULL DEFAULT '{}',
					"custom_avatar" bytea NULL,
					"custom_avatar_mime" character varying(30) NULL,
					"created_at" TIMESTAMP NOT NULL DEFAULT now(),
					"updated_at" TIMESTAMP NOT NULL DEFAULT now(),
					CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"),
					CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
				)
			`);

			// Legacy free-question columns removed (credits pool is granted + purchased only).
			// DROP IF EXISTS supports DBs created before this column removal.
			console.log('Dropping legacy users free-question columns if present');
			await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "last_free_questions_reset"`);
			await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "daily_free_questions"`);
			await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "remaining_free_questions"`);

			// CREATE TABLE defines the full schema for new DBs; following ALTER … IF NOT EXISTS
			// blocks upgrade older installations where "users" already existed without some columns.

			console.log('Dropping users.achievements column if present (legacy)');
			await queryRunner.query(`
				ALTER TABLE "users" DROP COLUMN IF EXISTS "achievements"
			`);

			// If table already exists with NOT NULL constraint, make credits nullable
			console.log('Ensuring credits column is nullable for admin users');
			await queryRunner.query(`
				DO $$ 
				BEGIN
					-- Check if column exists and has NOT NULL constraint, then remove it
					IF EXISTS (
						SELECT 1 
						FROM information_schema.columns 
						WHERE table_name = 'users' 
						AND column_name = 'credits' 
						AND is_nullable = 'NO'
					) THEN
						ALTER TABLE "users" 
						ALTER COLUMN "credits" DROP NOT NULL;
					END IF;
				END $$;
			`);

			// Set credits to NULL for admin users (credits not applicable for admins)
			console.log('Setting credits to NULL for admin users');
			await queryRunner.query(`
				UPDATE "users" 
				SET "credits" = NULL 
				WHERE "role" = '${UserRole.ADMIN}';
			`);

			// Granted credits rolling refill (merged from AddLastGrantedCreditsRefill migration)
			console.log('Adding last_granted_credits_refill_at and credits default 150 if needed');
			await queryRunner.query(`
				ALTER TABLE "users"
				ADD COLUMN IF NOT EXISTS "last_granted_credits_refill_at" TIMESTAMP NULL;
			`);
			await queryRunner.query(`
				ALTER TABLE "users"
				ALTER COLUMN "credits" SET DEFAULT 150;
			`);

			console.log('Adding email_verified column to users if needed');
			await queryRunner.query(`
				ALTER TABLE "users"
				ADD COLUMN IF NOT EXISTS "email_verified" boolean NOT NULL DEFAULT false
			`);
			await queryRunner.query(`
				UPDATE "users"
				SET "email_verified" = true
				WHERE "google_id" IS NOT NULL
			`);

			console.log('Adding custom_avatar columns to users if needed');
			await queryRunner.query(`
				ALTER TABLE "users"
				ADD COLUMN IF NOT EXISTS "custom_avatar" bytea NULL
			`);
			await queryRunner.query(`
				ALTER TABLE "users"
				ADD COLUMN IF NOT EXISTS "custom_avatar_mime" character varying(30) NULL
			`);

			// Create indexes for users table (email already indexed via UNIQUE constraint)
			console.log('Creating indexes for users table');
			await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_users_google_id" ON "users" ("google_id")`);
			await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_users_created_at" ON "users" ("created_at")`);

			// Create payment_history table
			console.log('Creating payment_history table');
			await queryRunner.query(`
				CREATE TABLE IF NOT EXISTS "payment_history" (
					"id" uuid NOT NULL DEFAULT uuid_generate_v4(),
					"user_id" uuid NOT NULL,
					"payment_id" character varying NOT NULL,
					"amount" integer NOT NULL,
					"currency" character varying NOT NULL DEFAULT 'USD',
					"status" character varying NOT NULL,
					"payment_method" character varying,
					"description" character varying,
					"metadata" jsonb NOT NULL DEFAULT '{}',
					"completed_at" TIMESTAMP NULL,
					"failed_at" TIMESTAMP NULL,
					"created_at" TIMESTAMP NOT NULL DEFAULT now(),
					"updated_at" TIMESTAMP NOT NULL DEFAULT now(),
					CONSTRAINT "PK_payment_history_id" PRIMARY KEY ("id")
				)
			`);

			console.log('Adding completed_at and failed_at columns to payment_history if needed');
			await queryRunner.query(`
				DO $$ BEGIN
					ALTER TABLE "payment_history" ADD COLUMN "completed_at" TIMESTAMP NULL;
				EXCEPTION
					WHEN duplicate_column THEN null;
				END $$;
			`);
			await queryRunner.query(`
				DO $$ BEGIN
					ALTER TABLE "payment_history" ADD COLUMN "failed_at" TIMESTAMP NULL;
				EXCEPTION
					WHEN duplicate_column THEN null;
				END $$;
			`);

			// Create indexes for payment_history table
			console.log('Creating indexes for payment_history table');
			await queryRunner.query(
				`CREATE INDEX IF NOT EXISTS "IDX_payment_history_user_id" ON "payment_history" ("user_id")`
			);
			await queryRunner.query(
				`CREATE INDEX IF NOT EXISTS "IDX_payment_history_status" ON "payment_history" ("status")`
			);
			await queryRunner.query(
				`CREATE INDEX IF NOT EXISTS "IDX_payment_history_created_at" ON "payment_history" ("created_at")`
			);
			await queryRunner.query(
				`CREATE INDEX IF NOT EXISTS "IDX_payment_history_completed_at" ON "payment_history" ("completed_at")`
			);
			await queryRunner.query(
				`CREATE INDEX IF NOT EXISTS "IDX_payment_history_failed_at" ON "payment_history" ("failed_at")`
			);

			// UNIQUE on payment_id: FK target for credit_transactions + index (no duplicate btree on payment_id)
			await queryRunner.query(`
				DO $$ BEGIN
					ALTER TABLE "payment_history"
					ADD CONSTRAINT "UQ_payment_history_payment_id"
					UNIQUE ("payment_id");
				EXCEPTION
					WHEN duplicate_object THEN null;
				END $$;
			`);

			// Add foreign key constraint for payment_history
			await queryRunner.query(`
				DO $$ BEGIN
					ALTER TABLE "payment_history" ADD CONSTRAINT "FK_payment_history_user" 
					FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
				EXCEPTION
					WHEN duplicate_object THEN null;
				END $$;
			`);

			// Create credit_transactions table
			console.log('Creating credit_transactions table');
			await queryRunner.query(`
				CREATE TABLE IF NOT EXISTS "credit_transactions" (
					"id" uuid NOT NULL DEFAULT uuid_generate_v4(),
					"user_id" uuid NOT NULL,
					"type" "credit_transaction_type_enum" NOT NULL,
					"source" "credit_source_enum",
					"amount" integer NOT NULL,
					"balance_after" integer NOT NULL,
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

			console.log('Dropping legacy credit_transactions.free_questions_after if present');
			await queryRunner.query(`ALTER TABLE "credit_transactions" DROP COLUMN IF EXISTS "free_questions_after"`);

			// Create indexes for credit_transactions table
			console.log('Creating indexes for credit_transactions table');
			await queryRunner.query(
				`CREATE INDEX IF NOT EXISTS "IDX_credit_transactions_user_id" ON "credit_transactions" ("user_id")`
			);
			await queryRunner.query(
				`CREATE INDEX IF NOT EXISTS "IDX_credit_transactions_payment_id" ON "credit_transactions" ("payment_id")`
			);
			await queryRunner.query(
				`CREATE INDEX IF NOT EXISTS "IDX_credit_transactions_date" ON "credit_transactions" ("transaction_date")`
			);

			// Add foreign key constraint for credit_transactions
			await queryRunner.query(`
				DO $$ BEGIN
					ALTER TABLE "credit_transactions" ADD CONSTRAINT "FK_credit_transactions_user" 
					FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
				EXCEPTION
					WHEN duplicate_object THEN null;
				END $$;
			`);

			// Add foreign key constraint from credit_transactions.payment_id to payment_history.payment_id
			await queryRunner.query(`
				DO $$ BEGIN
					ALTER TABLE "credit_transactions"
					ADD CONSTRAINT "FK_credit_transactions_payment_history"
					FOREIGN KEY ("payment_id")
					REFERENCES "payment_history"("payment_id")
					ON DELETE SET NULL
					ON UPDATE NO ACTION;
				EXCEPTION
					WHEN duplicate_object THEN null;
				END $$;
			`);

			// Create credits_config table (key-value store for credit packages etc.)
			console.log('Creating credits_config table');
			await queryRunner.query(`
				CREATE TABLE IF NOT EXISTS "credits_config" (
					"id" uuid NOT NULL DEFAULT uuid_generate_v4(),
					"key" character varying(128) NOT NULL,
					"value" jsonb NOT NULL DEFAULT 'null'::jsonb,
					"created_at" TIMESTAMP NOT NULL DEFAULT now(),
					"updated_at" TIMESTAMP NOT NULL DEFAULT now(),
					CONSTRAINT "UQ_credits_config_key" UNIQUE ("key"),
					CONSTRAINT "PK_credits_config" PRIMARY KEY ("id")
				)
			`);

			// Create game_history table
			console.log('Creating game_history table');
			await queryRunner.query(`
				CREATE TABLE IF NOT EXISTS "game_history" (
					"id" uuid NOT NULL DEFAULT uuid_generate_v4(),
					"user_id" uuid NOT NULL,
					"topic" character varying NOT NULL,
					"difficulty" character varying NOT NULL,
					"score" integer NOT NULL DEFAULT 0,
					"game_question_count" integer NOT NULL DEFAULT 0,
					"correct_answers" integer NOT NULL DEFAULT 0,
					"game_mode" character varying NOT NULL DEFAULT 'QUESTION_LIMITED',
					"time_spent" integer,
					"credits_used" integer NOT NULL DEFAULT 0,
					"questions_data" jsonb NOT NULL DEFAULT '[]',
					"client_mutation_id" uuid,
					"created_at" TIMESTAMP NOT NULL DEFAULT now(),
					"updated_at" TIMESTAMP NOT NULL DEFAULT now(),
					CONSTRAINT "PK_game_history_id" PRIMARY KEY ("id")
				)
			`);

			// Create indexes for game_history table
			console.log('Creating indexes for game_history table');
			await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_game_history_user_id" ON "game_history" ("user_id")`);
			await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_game_history_topic" ON "game_history" ("topic")`);
			await queryRunner.query(
				`CREATE INDEX IF NOT EXISTS "IDX_game_history_difficulty" ON "game_history" ("difficulty")`
			);
			await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_game_history_score" ON "game_history" ("score" DESC)`);
			await queryRunner.query(
				`CREATE INDEX IF NOT EXISTS "IDX_game_history_created_at" ON "game_history" ("created_at")`
			);
			await queryRunner.query(`
				CREATE INDEX IF NOT EXISTS "IDX_game_history_user_id_created_at" 
				ON "game_history" ("user_id", "created_at")
			`);
			await queryRunner.query(`
				DO $$ BEGIN
					CREATE UNIQUE INDEX "idx_game_history_client_mutation_id"
					ON "game_history" ("client_mutation_id")
					WHERE "client_mutation_id" IS NOT NULL;
				EXCEPTION
					WHEN duplicate_table THEN null;
				END $$;
			`);

			// Add foreign key constraint for game_history
			await queryRunner.query(`
				DO $$ BEGIN
					ALTER TABLE "game_history" ADD CONSTRAINT "FK_game_history_user" 
					FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
				EXCEPTION
					WHEN duplicate_object THEN null;
				END $$;
			`);

			// Create trivia table
			console.log('Creating trivia table');
			await queryRunner.query(`
				CREATE TABLE IF NOT EXISTS "trivia" (
					"id" uuid NOT NULL DEFAULT uuid_generate_v4(),
					"topic" character varying NOT NULL,
					"difficulty" character varying NOT NULL,
					"question" text NOT NULL,
					"answers" jsonb NOT NULL DEFAULT '[]',
					"correct_answer_index" integer NOT NULL DEFAULT 0,
					"user_id" uuid,
					"is_correct" boolean NOT NULL DEFAULT false,
					"metadata" jsonb,
					"created_at" TIMESTAMP NOT NULL DEFAULT now(),
					"updated_at" TIMESTAMP NOT NULL DEFAULT now(),
					CONSTRAINT "PK_trivia_id" PRIMARY KEY ("id")
				)
			`);

			// Create indexes for trivia table
			console.log('Creating indexes for trivia table');
			await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_trivia_topic" ON "trivia" ("topic")`);
			await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_trivia_difficulty" ON "trivia" ("difficulty")`);
			await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_trivia_user_id" ON "trivia" ("user_id")`);
			await queryRunner.query(`
				CREATE INDEX IF NOT EXISTS "IDX_trivia_topic_difficulty" 
				ON "trivia" ("topic", "difficulty")
			`);

			// Add foreign key constraint for trivia
			await queryRunner.query(`
				DO $$ BEGIN
					ALTER TABLE "trivia" ADD CONSTRAINT "FK_trivia_user" 
					FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
				EXCEPTION
					WHEN duplicate_object THEN null;
				END $$;
			`);

			// Create user_stats table
			console.log('Creating user_stats table');
			await queryRunner.query(`
				CREATE TABLE IF NOT EXISTS "user_stats" (
					"id" uuid NOT NULL DEFAULT uuid_generate_v4(),
					"user_id" uuid NOT NULL,
					"total_games" integer NOT NULL DEFAULT '0',
					"total_questions_answered" integer NOT NULL DEFAULT '0',
					"correct_answers" integer NOT NULL DEFAULT '0',
					"incorrect_answers" integer NOT NULL DEFAULT '0',
					"overall_success_rate" integer NOT NULL DEFAULT '0',
					"current_streak" integer NOT NULL DEFAULT '0',
					"longest_streak" integer NOT NULL DEFAULT '0',
					"last_play_date" TIMESTAMP,
					"consecutive_days_played" integer NOT NULL DEFAULT '0',
					"topic_stats" jsonb NOT NULL DEFAULT '{}',
					"difficulty_stats" jsonb NOT NULL DEFAULT '{}',
					"weekly_score" integer NOT NULL DEFAULT '0',
					"monthly_score" integer NOT NULL DEFAULT '0',
					"yearly_score" integer NOT NULL DEFAULT '0',
					"last_weekly_reset" TIMESTAMP,
					"last_monthly_reset" TIMESTAMP,
					"last_yearly_reset" TIMESTAMP,
					"average_time_per_question" integer NOT NULL DEFAULT '0',
					"total_play_time" integer NOT NULL DEFAULT '0',
					"best_game_score" integer NOT NULL DEFAULT '0',
					"best_game_date" TIMESTAMP,
					"total_score" integer NOT NULL DEFAULT '0',
					"version" integer NOT NULL DEFAULT '0',
					"recent_activity" jsonb NOT NULL DEFAULT '[]'::jsonb,
					"created_at" TIMESTAMP NOT NULL DEFAULT now(),
					"updated_at" TIMESTAMP NOT NULL DEFAULT now(),
					CONSTRAINT "UQ_user_stats_user_id" UNIQUE ("user_id"),
					CONSTRAINT "PK_user_stats_id" PRIMARY KEY ("id")
				)
			`);

			console.log('Adding version column to user_stats if needed');
			await queryRunner.query(`
				DO $$ BEGIN
					ALTER TABLE "user_stats" ADD COLUMN "version" integer NOT NULL DEFAULT '0';
				EXCEPTION
					WHEN duplicate_column THEN null;
				END $$;
			`);

			// Create indexes for user_stats table (user_id already indexed via UNIQUE ("user_id"))
			console.log('Creating indexes for user_stats table');
			await queryRunner.query(
				`CREATE INDEX IF NOT EXISTS "IDX_user_stats_total_games" ON "user_stats" ("total_games")`
			);
			await queryRunner.query(
				`CREATE INDEX IF NOT EXISTS "IDX_user_stats_overall_success_rate" ON "user_stats" ("overall_success_rate")`
			);
			await queryRunner.query(
				`CREATE INDEX IF NOT EXISTS "IDX_user_stats_weekly_score" ON "user_stats" ("weekly_score")`
			);
			await queryRunner.query(
				`CREATE INDEX IF NOT EXISTS "IDX_user_stats_monthly_score" ON "user_stats" ("monthly_score")`
			);
			await queryRunner.query(
				`CREATE INDEX IF NOT EXISTS "IDX_user_stats_yearly_score" ON "user_stats" ("yearly_score")`
			);

			// Add foreign key constraint for user_stats
			await queryRunner.query(`
				DO $$ BEGIN
					ALTER TABLE "user_stats" ADD CONSTRAINT "FK_user_stats_user" 
					FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
				EXCEPTION
					WHEN duplicate_object THEN null;
				END $$;
			`);

			// Leaderboard table was removed - see RemoveLeaderboardTable migration for details

			// Add database optimizations
			console.log('Adding database optimizations');

			// Create GIN indexes on JSONB columns for faster queries
			console.log('Creating GIN indexes on JSONB columns');
			await queryRunner.query(`
				CREATE INDEX IF NOT EXISTS "IDX_user_stats_topic_stats_gin" 
				ON "user_stats" USING GIN ("topic_stats")
			`);
			await queryRunner.query(`
				CREATE INDEX IF NOT EXISTS "IDX_user_stats_difficulty_stats_gin" 
				ON "user_stats" USING GIN ("difficulty_stats")
			`);
			await queryRunner.query(`
				CREATE INDEX IF NOT EXISTS "IDX_game_history_questions_data_gin" 
				ON "game_history" USING GIN ("questions_data")
			`);

			// Create composite indexes for common queries
			console.log('Creating composite indexes');
			await queryRunner.query(`
				CREATE INDEX IF NOT EXISTS "IDX_user_stats_user_total_games" 
				ON "user_stats" ("user_id", "total_games", "overall_success_rate")
			`);
			await queryRunner.query(`
				CREATE INDEX IF NOT EXISTS "IDX_game_history_user_created_score" 
				ON "game_history" ("user_id", "created_at", "score")
			`);

			// Create materialized views for analytics
			console.log('Creating materialized views');
			await queryRunner.query(`
				CREATE MATERIALIZED VIEW IF NOT EXISTS "mv_global_analytics" AS
				SELECT 
					COUNT(DISTINCT gh.user_id) AS total_users,
					COUNT(*) AS total_games,
					CAST(AVG(gh.score) AS DOUBLE PRECISION) AS avg_score,
					CAST(AVG(gh.correct_answers::float / NULLIF(gh.game_question_count, 0)) * 100 AS DOUBLE PRECISION) AS avg_success_rate,
					CAST(SUM(gh.game_question_count) AS INTEGER) AS total_questions,
					CAST(SUM(gh.correct_answers) AS INTEGER) AS total_correct_answers,
					MAX(gh.created_at) AS last_activity
				FROM "game_history" gh
			`);

			await queryRunner.query(`
				CREATE UNIQUE INDEX IF NOT EXISTS "IDX_mv_global_analytics_unique" 
				ON "mv_global_analytics" ((1))
			`);

			await queryRunner.query(`
				CREATE MATERIALIZED VIEW IF NOT EXISTS "mv_topic_stats" AS
				SELECT 
					gh.topic,
					COUNT(*) AS game_count,
					CAST(AVG(gh.score) AS DOUBLE PRECISION) AS avg_score,
					CAST(SUM(gh.game_question_count) AS INTEGER) AS total_questions,
					CAST(SUM(gh.correct_answers) AS INTEGER) AS total_correct_answers,
					CAST(AVG(gh.correct_answers::float / NULLIF(gh.game_question_count, 0)) * 100 AS DOUBLE PRECISION) AS success_rate
				FROM "game_history" gh
				WHERE gh.topic IS NOT NULL AND gh.topic != ''
				GROUP BY gh.topic
			`);

			await queryRunner.query(`
				CREATE INDEX IF NOT EXISTS "IDX_mv_topic_stats_topic" 
				ON "mv_topic_stats" ("topic")
			`);

			// Migrate existing data from metadata to columns (if payment_history already exists)
			console.log('Migrating existing completedAt and failedAt from metadata to columns');
			await queryRunner.query(`
				UPDATE "payment_history"
				SET "completed_at" = CASE 
					WHEN metadata->>'completedAt' IS NOT NULL 
					THEN (metadata->>'completedAt')::TIMESTAMP 
					ELSE NULL 
				END
				WHERE metadata->>'completedAt' IS NOT NULL AND "completed_at" IS NULL
			`);

			await queryRunner.query(`
				UPDATE "payment_history"
				SET "failed_at" = CASE 
					WHEN metadata->>'failedAt' IS NOT NULL 
					THEN (metadata->>'failedAt')::TIMESTAMP 
					ELSE NULL 
				END
				WHERE metadata->>'failedAt' IS NOT NULL AND "failed_at" IS NULL
			`);

			// Normalize user_stats success rates to score-based formula (0–100)
			console.log('Normalizing user_stats success rates to score-based formula');
			await queryRunner.query(`
				UPDATE user_stats
				SET overall_success_rate = LEAST(100, ROUND(100.0 * total_score / NULLIF(total_questions_answered, 0) / ${MAX_POINTS_PER_QUESTION})::integer)
				WHERE total_questions_answered > 0
			`);
			await queryRunner.query(`
				UPDATE user_stats
				SET topic_stats = (
					SELECT COALESCE(jsonb_object_agg(
						t.key,
						t.value || jsonb_build_object(
							'successRate',
							CASE
								WHEN (t.value->>'totalQuestionsAnswered')::int > 0
								THEN LEAST(100, ROUND(100.0 * COALESCE((t.value->>'score')::numeric, 0) / (t.value->>'totalQuestionsAnswered')::int / ${MAX_POINTS_PER_QUESTION})::integer)
								ELSE 0
							END
						)
					), '{}'::jsonb)
					FROM jsonb_each(topic_stats) AS t(key, value)
				)
				WHERE topic_stats IS NOT NULL AND topic_stats != '{}'::jsonb
			`);
			await queryRunner.query(`
				UPDATE user_stats
				SET difficulty_stats = (
					SELECT COALESCE(jsonb_object_agg(
						d.key,
						d.value || jsonb_build_object(
							'successRate',
							CASE
								WHEN (d.value->>'totalQuestionsAnswered')::int > 0
								THEN LEAST(100, ROUND(100.0 * COALESCE((d.value->>'score')::numeric, 0) / (d.value->>'totalQuestionsAnswered')::int / ${MAX_POINTS_PER_QUESTION})::integer)
								ELSE 0
							END
						)
					), '{}'::jsonb)
					FROM jsonb_each(difficulty_stats) AS d(key, value)
				)
				WHERE difficulty_stats IS NOT NULL AND difficulty_stats != '{}'::jsonb
			`);

			console.log('Migration completed successfully: CreateCompleteSchema', {
				migrationName: this.name,
				operation: 'up',
				tablesCreated: [
					'users',
					'credit_transactions',
					'credits_config',
					'payment_history',
					'game_history',
					'trivia',
					'user_stats',
				],
				enumsCreated: ['credit_transaction_type_enum', 'credit_source_enum'],
				materializedViewsCreated: ['mv_global_analytics', 'mv_topic_stats'],
			});
		} catch (error) {
			console.error('Migration failed: CreateCompleteSchema', {
				migrationName: this.name,
				operation: 'up',
				error: error instanceof Error ? error.message : String(error),
			});
			throw error;
		}
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		console.log('Starting migration rollback: CreateCompleteSchema', {
			migrationName: this.name,
			operation: 'down',
		});

		try {
			// Drop materialized views first (they depend on tables)
			console.log('Dropping materialized views');
			await queryRunner.query(`DROP MATERIALIZED VIEW IF EXISTS "mv_topic_stats"`);
			await queryRunner.query(`DROP MATERIALIZED VIEW IF EXISTS "mv_global_analytics"`);

			// Drop tables in reverse dependency order
			console.log('Dropping tables in reverse dependency order');

			// Drop user_stats table (depends on users)
			console.log('Dropping user_stats table');
			await queryRunner.query(`DROP TABLE IF EXISTS "user_stats" CASCADE`);

			// Drop trivia table (depends on users)
			console.log('Dropping trivia table');
			await queryRunner.query(`DROP TABLE IF EXISTS "trivia" CASCADE`);

			// Drop game_history table (depends on users)
			console.log('Dropping game_history table');
			await queryRunner.query(`DROP TABLE IF EXISTS "game_history" CASCADE`);

			// Drop credit_transactions table (depends on users)
			console.log('Dropping credit_transactions table');
			await queryRunner.query(`DROP TABLE IF EXISTS "credit_transactions" CASCADE`);

			// Drop credits_config table
			console.log('Dropping credits_config table');
			await queryRunner.query(`DROP TABLE IF EXISTS "credits_config"`);

			// Drop payment_history table (depends on users)
			console.log('Dropping payment_history table');
			await queryRunner.query(`DROP TABLE IF EXISTS "payment_history" CASCADE`);

			// Drop users table (base table)
			console.log('Dropping users table');
			await queryRunner.query(`DROP TABLE IF EXISTS "users" CASCADE`);

			// Drop enums
			console.log('Dropping enums');
			await queryRunner.query(`DROP TYPE IF EXISTS "credit_source_enum"`);
			await queryRunner.query(`DROP TYPE IF EXISTS "credit_transaction_type_enum"`);

			console.log('Migration rollback completed successfully: CreateCompleteSchema', {
				migrationName: this.name,
				operation: 'down',
			});
		} catch (error) {
			console.error('Migration rollback failed: CreateCompleteSchema', {
				migrationName: this.name,
				operation: 'down',
				error: error instanceof Error ? error.message : String(error),
			});
			throw error;
		}
	}
}
