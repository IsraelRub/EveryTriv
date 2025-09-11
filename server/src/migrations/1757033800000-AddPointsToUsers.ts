import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPointsToUsers1757033800000 implements MigrationInterface {
	name = 'AddPointsToUsers1757033800000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		console.log('Starting migration: AddPointsToUsers', {
			migrationName: this.name,
			operation: 'up',
		});

		try {
			// Add points column to users table
			console.log('Adding points column to users table');
			await queryRunner.query(`ALTER TABLE "users" ADD "points" integer NOT NULL DEFAULT '0'`);

			console.log('Migration completed successfully: AddPointsToUsers', {
				migrationName: this.name,
				operation: 'up',
				columnAdded: 'points',
			});
		} catch (error) {
			console.error('Migration failed: AddPointsToUsers', {
				migrationName: this.name,
				operation: 'up',
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		console.log('Starting migration rollback: AddPointsToUsers', {
			migrationName: this.name,
			operation: 'down',
		});

		try {
			// Remove points column from users table
			console.log('Removing points column from users table');
			await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "points"`);

			console.log('Migration rollback completed: AddPointsToUsers', {
				migrationName: this.name,
				operation: 'down',
				columnRemoved: 'points',
			});
		} catch (error) {
			console.error('Migration rollback failed: AddPointsToUsers', {
				migrationName: this.name,
				operation: 'down',
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}
}
