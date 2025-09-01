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
					"game_id" character varying NOT NULL,
					"topic" character varying NOT NULL,
					"difficulty" character varying NOT NULL,
					"score" integer NOT NULL DEFAULT 0,
					"total_questions" integer NOT NULL DEFAULT 0,
					"correct_answers" integer NOT NULL DEFAULT 0,
					"incorrect_answers" integer NOT NULL DEFAULT 0,
					"time_taken" integer NOT NULL DEFAULT 0,
					"questions" jsonb NOT NULL DEFAULT '[]',
					"answers" jsonb NOT NULL DEFAULT '[]',
					"metadata" jsonb NOT NULL DEFAULT '{}',
					"search_vector" tsvector,
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
					"question" text NOT NULL,
					"correct_answer" text NOT NULL,
					"incorrect_answers" text[] NOT NULL,
					"category" character varying NOT NULL,
					"difficulty" character varying NOT NULL,
					"type" character varying NOT NULL DEFAULT 'multiple',
					"explanation" text,
					"metadata" jsonb NOT NULL DEFAULT '{}',
					"search_vector" tsvector,
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

			await queryRunner.query(`CREATE INDEX "IDX_trivia_category" ON "trivia" ("category")`);
			await queryRunner.query(`CREATE INDEX "IDX_trivia_difficulty" ON "trivia" ("difficulty")`);
			await queryRunner.query(`CREATE INDEX "IDX_trivia_type" ON "trivia" ("type")`);

			// Create full-text search indexes
			console.log('Creating full-text search indexes');
			await queryRunner.query(`CREATE INDEX "IDX_game_history_search" ON "game_history" USING GIN ("search_vector")`);
			await queryRunner.query(`CREATE INDEX "IDX_trivia_search" ON "trivia" USING GIN ("search_vector")`);

			// Add foreign key constraints
			console.log('Adding foreign key constraints');
			await queryRunner.query(`
				ALTER TABLE "game_history" ADD CONSTRAINT "FK_game_history_user" 
				FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
			`);

			console.log('Migration completed successfully: AddFullTextSearch', {
				migrationName: this.name,
				operation: 'up',
				tablesCreated: ['game_history', 'trivia'],
				indexesCreated: 10,
				foreignKeysAdded: 1,
			});
		} catch (error) {
			console.error('Migration failed: AddFullTextSearch', {
				migrationName: this.name,
				operation: 'up',
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		console.log('Starting migration rollback: AddFullTextSearch', {
			migrationName: this.name,
			operation: 'down',
		});

		try {
			// Drop foreign key constraints
			console.log('Dropping foreign key constraints');
			await queryRunner.query(`ALTER TABLE "game_history" DROP CONSTRAINT "FK_game_history_user"`);

			// Drop indexes
			console.log('Dropping indexes');
			await queryRunner.query(`DROP INDEX "IDX_trivia_search"`);
			await queryRunner.query(`DROP INDEX "IDX_game_history_search"`);
			await queryRunner.query(`DROP INDEX "IDX_trivia_type"`);
			await queryRunner.query(`DROP INDEX "IDX_trivia_difficulty"`);
			await queryRunner.query(`DROP INDEX "IDX_trivia_category"`);
			await queryRunner.query(`DROP INDEX "IDX_game_history_created_at"`);
			await queryRunner.query(`DROP INDEX "IDX_game_history_score"`);
			await queryRunner.query(`DROP INDEX "IDX_game_history_difficulty"`);
			await queryRunner.query(`DROP INDEX "IDX_game_history_topic"`);
			await queryRunner.query(`DROP INDEX "IDX_game_history_user_id"`);

			// Drop tables
			console.log('Dropping game_history and trivia tables');
			await queryRunner.query(`DROP TABLE "trivia"`);
			await queryRunner.query(`DROP TABLE "game_history"`);

			console.log('Migration rollback completed: AddFullTextSearch', {
				migrationName: this.name,
				operation: 'down',
				tablesDropped: ['trivia', 'game_history'],
				indexesDropped: 10,
				foreignKeysDropped: 1,
			});
		} catch (error) {
			console.error('Migration rollback failed: AddFullTextSearch', {
				migrationName: this.name,
				operation: 'down',
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}
}
