import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUpdatedAtToBaseEntities1762486271345 implements MigrationInterface {
	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`
				ALTER TABLE "game_history"
				ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP NOT NULL DEFAULT now()
			`
		);

		await queryRunner.query(
			`
				ALTER TABLE "point_transactions"
				ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP NOT NULL DEFAULT now()
			`
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "point_transactions" DROP COLUMN IF EXISTS "updated_at"`);
		await queryRunner.query(`ALTER TABLE "game_history" DROP COLUMN IF EXISTS "updated_at"`);
	}
}
