import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserLegalAcceptanceAt1780000000001 implements MigrationInterface {
	name = 'AddUserLegalAcceptanceAt1780000000001';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
			ALTER TABLE "users"
			ADD COLUMN IF NOT EXISTS "legal_acceptance_at" TIMESTAMPTZ NULL
		`);

		// Existing accounts: treat as already accepted (created_at is a stable audit anchor).
		await queryRunner.query(`
			UPDATE "users"
			SET "legal_acceptance_at" = COALESCE("created_at", NOW())
			WHERE "legal_acceptance_at" IS NULL
		`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "legal_acceptance_at"`);
	}
}
