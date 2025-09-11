import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserStatsAndRefactorLeaderboard1730000000000 implements MigrationInterface {
	name = 'AddUserStatsAndRefactorLeaderboard1730000000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		console.log('Starting migration: AddUserStatsAndRefactorLeaderboard', {
			migrationName: this.name,
			operation: 'up',
		});

		try {
			// Create user_stats table
			console.log('Creating user_stats table');
			await queryRunner.query(`
				CREATE TABLE "user_stats" (
					"id" uuid NOT NULL DEFAULT uuid_generate_v4(),
					"user_id" uuid NOT NULL,
					"total_games" integer NOT NULL DEFAULT '0',
					"total_questions" integer NOT NULL DEFAULT '0',
					"correct_answers" integer NOT NULL DEFAULT '0',
					"incorrect_answers" integer NOT NULL DEFAULT '0',
					"overall_success_rate" decimal(5,2) NOT NULL DEFAULT '0',
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
					"unlocked_achievements" jsonb NOT NULL DEFAULT '[]',
					"total_achievements" integer NOT NULL DEFAULT '0',
					"created_at" TIMESTAMP NOT NULL DEFAULT now(),
					"updated_at" TIMESTAMP NOT NULL DEFAULT now(),
					CONSTRAINT "UQ_user_stats_user_id" UNIQUE ("user_id"),
					CONSTRAINT "PK_user_stats_id" PRIMARY KEY ("id")
				)
			`);

			// Create indexes for user_stats table
			console.log('Creating indexes for user_stats table');
			await queryRunner.query(`CREATE INDEX "IDX_user_stats_user_id" ON "user_stats" ("user_id")`);
			await queryRunner.query(`CREATE INDEX "IDX_user_stats_total_games" ON "user_stats" ("total_games")`);
			await queryRunner.query(`CREATE INDEX "IDX_user_stats_overall_success_rate" ON "user_stats" ("overall_success_rate")`);
			await queryRunner.query(`CREATE INDEX "IDX_user_stats_weekly_score" ON "user_stats" ("weekly_score")`);
			await queryRunner.query(`CREATE INDEX "IDX_user_stats_monthly_score" ON "user_stats" ("monthly_score")`);
			await queryRunner.query(`CREATE INDEX "IDX_user_stats_yearly_score" ON "user_stats" ("yearly_score")`);

			// Add foreign key constraint
			console.log('Adding foreign key constraint for user_stats');
			await queryRunner.query(`
				ALTER TABLE "user_stats" ADD CONSTRAINT "FK_user_stats_user" 
				FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
			`);

			// Drop existing leaderboard table
			console.log('Dropping existing leaderboard table');
			await queryRunner.query(`DROP TABLE IF EXISTS "leaderboard"`);

			// Create new leaderboard table with improved structure
			console.log('Creating new leaderboard table');
			await queryRunner.query(`
				CREATE TABLE "leaderboard" (
					"id" uuid NOT NULL DEFAULT uuid_generate_v4(),
					"user_id" uuid NOT NULL,
					"user_stats_id" uuid NOT NULL,
					"rank" integer NOT NULL DEFAULT '0',
					"percentile" integer NOT NULL DEFAULT '0',
					"total_users" integer NOT NULL DEFAULT '0',
					"weekly_rank" integer NOT NULL DEFAULT '0',
					"monthly_rank" integer NOT NULL DEFAULT '0',
					"yearly_rank" integer NOT NULL DEFAULT '0',
					"last_rank_update" TIMESTAMP,
					"last_weekly_rank_update" TIMESTAMP,
					"last_monthly_rank_update" TIMESTAMP,
					"last_yearly_rank_update" TIMESTAMP,
					"rank_history" jsonb NOT NULL DEFAULT '[]',
					"created_at" TIMESTAMP NOT NULL DEFAULT now(),
					"updated_at" TIMESTAMP NOT NULL DEFAULT now(),
					CONSTRAINT "UQ_leaderboard_user_id" UNIQUE ("user_id"),
					CONSTRAINT "PK_leaderboard_id" PRIMARY KEY ("id")
				)
			`);

			// Create indexes for leaderboard table
			console.log('Creating indexes for leaderboard table');
			await queryRunner.query(`CREATE INDEX "IDX_leaderboard_user_id" ON "leaderboard" ("user_id")`);
			await queryRunner.query(`CREATE INDEX "IDX_leaderboard_user_stats_id" ON "leaderboard" ("user_stats_id")`);
			await queryRunner.query(`CREATE INDEX "IDX_leaderboard_rank" ON "leaderboard" ("rank")`);
			await queryRunner.query(`CREATE INDEX "IDX_leaderboard_percentile" ON "leaderboard" ("percentile")`);
			await queryRunner.query(`CREATE INDEX "IDX_leaderboard_weekly_rank" ON "leaderboard" ("weekly_rank")`);
			await queryRunner.query(`CREATE INDEX "IDX_leaderboard_monthly_rank" ON "leaderboard" ("monthly_rank")`);
			await queryRunner.query(`CREATE INDEX "IDX_leaderboard_yearly_rank" ON "leaderboard" ("yearly_rank")`);

			// Add foreign key constraints for leaderboard
			console.log('Adding foreign key constraints for leaderboard');
			await queryRunner.query(`
				ALTER TABLE "leaderboard" ADD CONSTRAINT "FK_leaderboard_user" 
				FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
			`);
			await queryRunner.query(`
				ALTER TABLE "leaderboard" ADD CONSTRAINT "FK_leaderboard_user_stats" 
				FOREIGN KEY ("user_stats_id") REFERENCES "user_stats"("id") ON DELETE CASCADE ON UPDATE NO ACTION
			`);

			// Create leaderboard view for real-time calculations
			console.log('Creating leaderboard view');
			await queryRunner.query(`
				CREATE VIEW leaderboard_view AS
				SELECT 
					u.id as user_id,
					u.username,
					u.avatar,
					u.score,
					COALESCE(us.total_games, 0) as total_games,
					COALESCE(us.total_questions, 0) as total_questions,
					COALESCE(us.correct_answers, 0) as correct_answers,
					COALESCE(us.overall_success_rate, 0) as success_rate,
					COALESCE(us.current_streak, 0) as current_streak,
					COALESCE(us.longest_streak, 0) as longest_streak,
					us.last_play_date,
					us.weekly_score,
					us.monthly_score,
					us.yearly_score,
					RANK() OVER (ORDER BY u.score DESC) as rank,
					PERCENT_RANK() OVER (ORDER BY u.score DESC) * 100 as percentile
				FROM users u
				LEFT JOIN user_stats us ON u.id = us.user_id
				WHERE u.is_active = true
			`);

			console.log('Migration completed successfully: AddUserStatsAndRefactorLeaderboard', {
				migrationName: this.name,
				operation: 'up',
				tablesCreated: ['user_stats', 'leaderboard'],
				viewCreated: ['leaderboard_view'],
				indexesCreated: 12,
				foreignKeysAdded: 3,
			});
		} catch (error) {
			console.error('Migration failed: AddUserStatsAndRefactorLeaderboard', {
				migrationName: this.name,
				operation: 'up',
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		console.log('Starting migration rollback: AddUserStatsAndRefactorLeaderboard', {
			migrationName: this.name,
			operation: 'down',
		});

		try {
			// Drop view
			console.log('Dropping leaderboard view');
			await queryRunner.query(`DROP VIEW IF EXISTS leaderboard_view`);

			// Drop foreign key constraints
			console.log('Dropping foreign key constraints');
			await queryRunner.query(`ALTER TABLE "leaderboard" DROP CONSTRAINT IF EXISTS "FK_leaderboard_user_stats"`);
			await queryRunner.query(`ALTER TABLE "leaderboard" DROP CONSTRAINT IF EXISTS "FK_leaderboard_user"`);
			await queryRunner.query(`ALTER TABLE "user_stats" DROP CONSTRAINT IF EXISTS "FK_user_stats_user"`);

			// Drop tables
			console.log('Dropping tables');
			await queryRunner.query(`DROP TABLE IF EXISTS "leaderboard"`);
			await queryRunner.query(`DROP TABLE IF EXISTS "user_stats"`);

			console.log('Migration rollback completed: AddUserStatsAndRefactorLeaderboard', {
				migrationName: this.name,
				operation: 'down',
				tablesDropped: ['leaderboard', 'user_stats'],
				viewDropped: ['leaderboard_view'],
				foreignKeysDropped: 3,
			});
		} catch (error) {
			console.error('Migration rollback failed: AddUserStatsAndRefactorLeaderboard', {
				migrationName: this.name,
				operation: 'down',
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}
}
