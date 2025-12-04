import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFullTextSearch1720000000000 implements MigrationInterface {
	name = 'AddFullTextSearch1720000000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		console.log('Starting migration: AddFullTextSearch', {
			migrationName: this.name,
			operation: 'up',
		});

		try {
			// Create game_history table
			console.log('Creating game_history table');
			await queryRunner.query(`
				CREATE TABLE "game_history" (
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
					"created_at" TIMESTAMP NOT NULL DEFAULT now(),
					"updated_at" TIMESTAMP NOT NULL DEFAULT now(),
					CONSTRAINT "PK_game_history_id" PRIMARY KEY ("id")
				)
			`);

			// Create trivia table
			console.log('Creating trivia table');
			await queryRunner.query(`
				CREATE TABLE "trivia" (
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

			// Create indexes
			console.log('Creating indexes for game_history and trivia tables');
			await queryRunner.query(`CREATE INDEX "IDX_game_history_user_id" ON "game_history" ("user_id")`);
			await queryRunner.query(`CREATE INDEX "IDX_game_history_topic" ON "game_history" ("topic")`);
			await queryRunner.query(`CREATE INDEX "IDX_game_history_difficulty" ON "game_history" ("difficulty")`);
			await queryRunner.query(`CREATE INDEX "IDX_game_history_score" ON "game_history" ("score" DESC)`);
			await queryRunner.query(`CREATE INDEX "IDX_game_history_created_at" ON "game_history" ("created_at")`);

			await queryRunner.query(`CREATE INDEX "IDX_trivia_topic" ON "trivia" ("topic")`);
			await queryRunner.query(`CREATE INDEX "IDX_trivia_difficulty" ON "trivia" ("difficulty")`);
			await queryRunner.query(`CREATE INDEX "IDX_trivia_user_id" ON "trivia" ("user_id")`);

			// Add foreign key constraints
			console.log('Adding foreign key constraints');
			await queryRunner.query(`
				ALTER TABLE "game_history" ADD CONSTRAINT "FK_game_history_user" 
				FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
			`);

			await queryRunner.query(`
				ALTER TABLE "trivia" ADD CONSTRAINT "FK_trivia_user" 
				FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
			`);

			// Drop unused columns and indexes if they exist (for existing databases)
			console.log('Dropping unused search_vector columns and indexes if they exist');
			await queryRunner.query(`DROP INDEX IF EXISTS "IDX_game_history_search"`);
			await queryRunner.query(`DROP INDEX IF EXISTS "IDX_trivia_search"`);
			await queryRunner.query(`ALTER TABLE "game_history" DROP COLUMN IF EXISTS "search_vector"`);
			await queryRunner.query(`ALTER TABLE "trivia" DROP COLUMN IF EXISTS "search_vector"`);

			console.log('Migration completed successfully: AddFullTextSearch', {
				migrationName: this.name,
				operation: 'up',
				tablesCreated: ['game_history', 'trivia'],
				indexesCreated: 8,
				foreignKeysAdded: 2,
			});
		} catch (error) {
			console.error('Migration failed: AddFullTextSearch', {
				migrationName: this.name,
				operation: 'up',
				error: error instanceof Error ? error.message : String(error),
			});
			throw error;
		}
	}

	public async down(): Promise<void> {
		throw new Error('Migration rollback is not supported');
	}
}
