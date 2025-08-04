import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFullTextSearch1710000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create the function to update trivia search vector
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION trivia_search_vector_update() RETURNS trigger AS $$
      BEGIN
        NEW.search_vector :=
          setweight(to_tsvector('english', COALESCE(NEW.topic, '')), 'A') ||
          setweight(to_tsvector('english', COALESCE(NEW.question, '')), 'B') ||
          setweight(to_tsvector('english', COALESCE(NEW.difficulty, '')), 'C');
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Create the function to update user search vector
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION user_search_vector_update() RETURNS trigger AS $$
      BEGIN
        NEW.search_vector :=
          setweight(to_tsvector('english', COALESCE(NEW.username, '')), 'A') ||
          setweight(to_tsvector('english', COALESCE(NEW.email, '')), 'B');
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Create triggers for trivia
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS trivia_search_vector_trigger ON trivia;
      CREATE TRIGGER trivia_search_vector_trigger
        BEFORE INSERT OR UPDATE ON trivia
        FOR EACH ROW
        EXECUTE FUNCTION trivia_search_vector_update();
    `);

    // Create triggers for users
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS user_search_vector_trigger ON users;
      CREATE TRIGGER user_search_vector_trigger
        BEFORE INSERT OR UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION user_search_vector_update();
    `);

    // Create GIN indexes for full-text search
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS trivia_search_vector_idx ON trivia USING GIN(search_vector);
      CREATE INDEX IF NOT EXISTS user_search_vector_idx ON users USING GIN(search_vector);
    `);

    // Create indexes for JSONB fields
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS trivia_answers_idx ON trivia USING GIN(answers);
      CREATE INDEX IF NOT EXISTS trivia_metadata_idx ON trivia USING GIN(metadata);
      CREATE INDEX IF NOT EXISTS user_preferences_idx ON users USING GIN(preferences);
      CREATE INDEX IF NOT EXISTS user_stats_idx ON users USING GIN(stats);
      CREATE INDEX IF NOT EXISTS user_achievements_idx ON users USING GIN(achievements);
    `);

    // Create composite indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS trivia_topic_difficulty_idx ON trivia(topic, difficulty);
      CREATE INDEX IF NOT EXISTS trivia_user_created_idx ON trivia(user_id, created_at);
      CREATE INDEX IF NOT EXISTS user_score_created_idx ON users(score DESC, created_at);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop triggers
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS trivia_search_vector_trigger ON trivia;
      DROP TRIGGER IF EXISTS user_search_vector_trigger ON users;
    `);

    // Drop functions
    await queryRunner.query(`
      DROP FUNCTION IF EXISTS trivia_search_vector_update();
      DROP FUNCTION IF EXISTS user_search_vector_update();
    `);

    // Drop indexes
    await queryRunner.query(`
      DROP INDEX IF EXISTS trivia_search_vector_idx;
      DROP INDEX IF EXISTS user_search_vector_idx;
      DROP INDEX IF EXISTS trivia_answers_idx;
      DROP INDEX IF EXISTS trivia_metadata_idx;
      DROP INDEX IF EXISTS user_preferences_idx;
      DROP INDEX IF EXISTS user_stats_idx;
      DROP INDEX IF EXISTS user_achievements_idx;
      DROP INDEX IF EXISTS trivia_topic_difficulty_idx;
      DROP INDEX IF EXISTS trivia_user_created_idx;
      DROP INDEX IF EXISTS user_score_created_idx;
    `);
  }
}