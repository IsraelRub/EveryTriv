import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLastLoginToUsers1750000000000 implements MigrationInterface {
	name = 'AddLastLoginToUsers1750000000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		console.log('Starting migration: AddLastLoginToUsers', {
			migrationName: this.name,
			operation: 'up',
		});

		try {
			// Add last_login column to users table
			console.log('Adding last_login column to users table');
			await queryRunner.query(`
				ALTER TABLE "users" 
				ADD COLUMN IF NOT EXISTS "last_login" TIMESTAMP
			`);

			console.log('Migration completed successfully: AddLastLoginToUsers', {
				migrationName: this.name,
				operation: 'up',
				columnAdded: 'last_login',
			});
		} catch (error) {
			console.error('Migration failed: AddLastLoginToUsers', {
				migrationName: this.name,
				operation: 'up',
				error: error instanceof Error ? error.message : String(error),
			});
			throw error;
		}
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		console.log('Starting migration rollback: AddLastLoginToUsers', {
			migrationName: this.name,
			operation: 'down',
		});

		try {
			// Remove last_login column from users table
			console.log('Removing last_login column from users table');
			await queryRunner.query(`
				ALTER TABLE "users" 
				DROP COLUMN IF EXISTS "last_login"
			`);

			console.log('Migration rollback completed successfully: AddLastLoginToUsers', {
				migrationName: this.name,
				operation: 'down',
			});
		} catch (error) {
			console.error('Migration rollback failed: AddLastLoginToUsers', {
				migrationName: this.name,
				operation: 'down',
				error: error instanceof Error ? error.message : String(error),
			});
			throw error;
		}
	}
}
