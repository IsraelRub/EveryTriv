import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddScoreToLeaderboard1757032620613 implements MigrationInterface {
	name = 'AddScoreToLeaderboard1757032620613';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "leaderboard" ADD "score" integer NOT NULL DEFAULT '0'`);
		await queryRunner.query(`CREATE INDEX "IDX_leaderboard_score" ON "leaderboard" ("score")`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP INDEX "public"."IDX_leaderboard_score"`);
		await queryRunner.query(`ALTER TABLE "leaderboard" DROP COLUMN "score"`);
	}
}
