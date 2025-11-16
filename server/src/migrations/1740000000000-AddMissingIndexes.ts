import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMissingIndexes1740000000000 implements MigrationInterface {
	name = 'AddMissingIndexes1740000000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		console.log('Starting migration: AddMissingIndexes', {
			migrationName: this.name,
			operation: 'up',
		});

		try {
			// Add indexes to game_history table
			console.log('Creating indexes for game_history table');

			// Index on created_at for date range queries
			await queryRunner.query(`
				CREATE INDEX IF NOT EXISTS "IDX_game_history_created_at" 
				ON "game_history" ("created_at")
			`);

			// Index on topic for GROUP BY and WHERE queries
			await queryRunner.query(`
				CREATE INDEX IF NOT EXISTS "IDX_game_history_topic" 
				ON "game_history" ("topic")
			`);

			// Index on difficulty for GROUP BY and WHERE queries
			await queryRunner.query(`
				CREATE INDEX IF NOT EXISTS "IDX_game_history_difficulty" 
				ON "game_history" ("difficulty")
			`);

			// Composite index on (user_id, created_at) for efficient user history queries
			await queryRunner.query(`
				CREATE INDEX IF NOT EXISTS "IDX_game_history_user_id_created_at" 
				ON "game_history" ("user_id", "created_at")
			`);

			// Add indexes to trivia table
			console.log('Creating indexes for trivia table');

			// Index on difficulty for WHERE queries
			await queryRunner.query(`
				CREATE INDEX IF NOT EXISTS "IDX_trivia_difficulty" 
				ON "trivia" ("difficulty")
			`);

			// Composite index on (topic, difficulty) for efficient trivia queries
			await queryRunner.query(`
				CREATE INDEX IF NOT EXISTS "IDX_trivia_topic_difficulty" 
				ON "trivia" ("topic", "difficulty")
			`);

			console.log('Migration completed successfully: AddMissingIndexes');
		} catch (error) {
			console.error('Migration failed: AddMissingIndexes', {
				error: error instanceof Error ? error.message : String(error),
			});
			throw error;
		}
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		console.log('Starting migration rollback: AddMissingIndexes', {
			migrationName: this.name,
			operation: 'down',
		});

		try {
			// Drop indexes from game_history table
			console.log('Dropping indexes from game_history table');
			await queryRunner.query(`DROP INDEX IF EXISTS "IDX_game_history_created_at"`);
			await queryRunner.query(`DROP INDEX IF EXISTS "IDX_game_history_topic"`);
			await queryRunner.query(`DROP INDEX IF EXISTS "IDX_game_history_difficulty"`);
			await queryRunner.query(`DROP INDEX IF EXISTS "IDX_game_history_user_id_created_at"`);

			// Drop indexes from trivia table
			console.log('Dropping indexes from trivia table');
			await queryRunner.query(`DROP INDEX IF EXISTS "IDX_trivia_difficulty"`);
			await queryRunner.query(`DROP INDEX IF EXISTS "IDX_trivia_topic_difficulty"`);

			console.log('Migration rollback completed successfully: AddMissingIndexes');
		} catch (error) {
			console.error('Migration rollback failed: AddMissingIndexes', {
				error: error instanceof Error ? error.message : String(error),
			});
			throw error;
		}
	}
}
