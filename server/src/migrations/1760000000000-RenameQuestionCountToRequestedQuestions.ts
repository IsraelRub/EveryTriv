import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration to rename questionCount to requestedQuestions in credit_transactions.metadata
 * This migration updates the JSONB metadata field to use the new naming convention
 */
export class RenameQuestionCountToRequestedQuestions1760000000000 implements MigrationInterface {
	name = 'RenameQuestionCountToRequestedQuestions1760000000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		console.log('Starting migration: RenameQuestionCountToRequestedQuestions', {
			migrationName: this.name,
		});

		// Update credit_transactions.metadata JSONB field
		// Rename questionCount to requestedQuestions in all records where questionCount exists
		// This migration copies the value and removes the old field
		await queryRunner.query(`
			UPDATE credit_transactions
			SET metadata = jsonb_set(
				metadata - 'questionCount',
				'{requestedQuestions}',
				metadata->'questionCount'
			) - 'questionCount'
			WHERE metadata ? 'questionCount'
		`);

		console.log('Migration completed: RenameQuestionCountToRequestedQuestions');
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		console.log('Reverting migration: RenameQuestionCountToRequestedQuestions', {
			migrationName: this.name,
		});

		// Revert: rename requestedQuestions back to questionCount
		await queryRunner.query(`
			UPDATE credit_transactions
			SET metadata = jsonb_set(
				metadata - 'requestedQuestions',
				'{questionCount}',
				metadata->'requestedQuestions'
			)
			WHERE metadata ? 'requestedQuestions'
		`);

		console.log('Migration reverted: RenameQuestionCountToRequestedQuestions');
	}
}
