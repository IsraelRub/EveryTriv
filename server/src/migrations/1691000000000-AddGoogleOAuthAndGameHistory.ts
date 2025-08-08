import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGoogleOAuthAndGameHistory1691000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add Google OAuth fields to users table
    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD COLUMN "googleId" VARCHAR,
      ADD COLUMN "fullName" VARCHAR,
      ADD COLUMN "credits" INTEGER NOT NULL DEFAULT 100,
      ADD COLUMN "lastCreditRefill" DATE,
      ALTER COLUMN "passwordHash" DROP NOT NULL
    `);

    // Create game_history table
    await queryRunner.query(`
      CREATE TABLE "game_history" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "score" INTEGER NOT NULL,
        "totalQuestions" INTEGER NOT NULL,
        "correctAnswers" INTEGER NOT NULL,
        "difficulty" VARCHAR NOT NULL,
        "topic" VARCHAR,
        "gameMode" VARCHAR NOT NULL DEFAULT 'question-limited',
        "timeSpent" INTEGER,
        "creditsUsed" INTEGER NOT NULL,
        "questionsData" jsonb NOT NULL DEFAULT '[]',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "FK_game_history_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    // Create indexes for better performance
    await queryRunner.query(`CREATE INDEX "IDX_game_history_userId" ON "game_history" ("userId")`);
    await queryRunner.query(`CREATE INDEX "IDX_game_history_createdAt" ON "game_history" ("createdAt")`);
    await queryRunner.query(`CREATE INDEX "IDX_users_googleId" ON "users" ("googleId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_users_googleId"`);
    await queryRunner.query(`DROP INDEX "IDX_game_history_createdAt"`);
    await queryRunner.query(`DROP INDEX "IDX_game_history_userId"`);
    
    // Drop game_history table
    await queryRunner.query(`DROP TABLE "game_history"`);
    
    // Remove Google OAuth fields from users table
    await queryRunner.query(`
      ALTER TABLE "users" 
      DROP COLUMN "googleId",
      DROP COLUMN "fullName",
      DROP COLUMN "credits",
      DROP COLUMN "lastCreditRefill",
      ALTER COLUMN "passwordHash" SET NOT NULL
    `);
  }
}
