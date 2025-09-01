import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateColumnNamesToSnakeCase1730000000000 implements MigrationInterface {
	name = 'UpdateColumnNamesToSnakeCase1730000000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		console.log('Starting migration: UpdateColumnNamesToSnakeCase', {
			migrationName: this.name,
			operation: 'up',
		});

		try {
			// Update users table columns
			console.log('Updating users table column names to snake_case');
			await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "passwordHash" TO "password_hash"`);
			await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "googleId" TO "google_id"`);
			await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "fullName" TO "full_name"`);
			await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "firstName" TO "first_name"`);
			await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "lastName" TO "last_name"`);
			await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "dateOfBirth" TO "date_of_birth"`);
			await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "purchasedPoints" TO "purchased_points"`);
			await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "dailyFreeQuestions" TO "daily_free_questions"`);
			await queryRunner.query(
				`ALTER TABLE "users" RENAME COLUMN "remainingFreeQuestions" TO "remaining_free_questions"`
			);
			await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "lastCreditRefill" TO "last_credit_refill"`);
			await queryRunner.query(
				`ALTER TABLE "users" RENAME COLUMN "lastFreeQuestionsReset" TO "last_free_questions_reset"`
			);
			await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "reset_password_token" TO "reset_password_token"`); // Already correct
			await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "reset_password_expires" TO "reset_password_expires"`); // Already correct
			await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "additionalInfo" TO "additional_info"`);
			await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "agreeToNewsletter" TO "agree_to_newsletter"`);
			await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "currentSubscriptionId" TO "current_subscription_id"`);
			await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "createdAt" TO "created_at"`);
			await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "updatedAt" TO "updated_at"`);

			// Update game_history table columns
			console.log('Updating game_history table column names to snake_case');
			await queryRunner.query(`ALTER TABLE "game_history" RENAME COLUMN "userId" TO "user_id"`);
			await queryRunner.query(`ALTER TABLE "game_history" RENAME COLUMN "gameId" TO "game_id"`);
			await queryRunner.query(`ALTER TABLE "game_history" RENAME COLUMN "totalQuestions" TO "total_questions"`);
			await queryRunner.query(`ALTER TABLE "game_history" RENAME COLUMN "correctAnswers" TO "correct_answers"`);
			await queryRunner.query(`ALTER TABLE "game_history" RENAME COLUMN "incorrectAnswers" TO "incorrect_answers"`);
			await queryRunner.query(`ALTER TABLE "game_history" RENAME COLUMN "timeTaken" TO "time_taken"`);
			await queryRunner.query(`ALTER TABLE "game_history" RENAME COLUMN "searchVector" TO "search_vector"`);
			await queryRunner.query(`ALTER TABLE "game_history" RENAME COLUMN "createdAt" TO "created_at"`);
			await queryRunner.query(`ALTER TABLE "game_history" RENAME COLUMN "updatedAt" TO "updated_at"`);

			// Update trivia table columns
			console.log('Updating trivia table column names to snake_case');
			await queryRunner.query(`ALTER TABLE "trivia" RENAME COLUMN "correctAnswer" TO "correct_answer"`);
			await queryRunner.query(`ALTER TABLE "trivia" RENAME COLUMN "incorrectAnswers" TO "incorrect_answers"`);
			await queryRunner.query(`ALTER TABLE "trivia" RENAME COLUMN "searchVector" TO "search_vector"`);
			await queryRunner.query(`ALTER TABLE "trivia" RENAME COLUMN "createdAt" TO "created_at"`);
			await queryRunner.query(`ALTER TABLE "trivia" RENAME COLUMN "updatedAt" TO "updated_at"`);

			// Update payment_history table columns
			console.log('Updating payment_history table column names to snake_case');
			await queryRunner.query(`ALTER TABLE "payment_history" RENAME COLUMN "userId" TO "user_id"`);
			await queryRunner.query(`ALTER TABLE "payment_history" RENAME COLUMN "paymentId" TO "payment_id"`);
			await queryRunner.query(`ALTER TABLE "payment_history" RENAME COLUMN "paymentMethod" TO "payment_method"`);
			await queryRunner.query(`ALTER TABLE "payment_history" RENAME COLUMN "createdAt" TO "created_at"`);
			await queryRunner.query(`ALTER TABLE "payment_history" RENAME COLUMN "updatedAt" TO "updated_at"`);

			// Update subscriptions table columns
			console.log('Updating subscriptions table column names to snake_case');
			await queryRunner.query(`ALTER TABLE "subscriptions" RENAME COLUMN "userId" TO "user_id"`);
			await queryRunner.query(`ALTER TABLE "subscriptions" RENAME COLUMN "subscriptionId" TO "subscription_id"`);
			await queryRunner.query(`ALTER TABLE "subscriptions" RENAME COLUMN "planId" TO "plan_id"`);
			await queryRunner.query(
				`ALTER TABLE "subscriptions" RENAME COLUMN "currentPeriodStart" TO "current_period_start"`
			);
			await queryRunner.query(`ALTER TABLE "subscriptions" RENAME COLUMN "currentPeriodEnd" TO "current_period_end"`);
			await queryRunner.query(
				`ALTER TABLE "subscriptions" RENAME COLUMN "cancelAtPeriodEnd" TO "cancel_at_period_end"`
			);
			await queryRunner.query(`ALTER TABLE "subscriptions" RENAME COLUMN "createdAt" TO "created_at"`);
			await queryRunner.query(`ALTER TABLE "subscriptions" RENAME COLUMN "updatedAt" TO "updated_at"`);

			// Update point_transactions table columns
			console.log('Updating point_transactions table column names to snake_case');
			await queryRunner.query(`ALTER TABLE "point_transactions" RENAME COLUMN "userId" TO "user_id"`);
			await queryRunner.query(`ALTER TABLE "point_transactions" RENAME COLUMN "balanceAfter" TO "balance_after"`);
			await queryRunner.query(
				`ALTER TABLE "point_transactions" RENAME COLUMN "freeQuestionsAfter" TO "free_questions_after"`
			);
			await queryRunner.query(
				`ALTER TABLE "point_transactions" RENAME COLUMN "purchasedPointsAfter" TO "purchased_points_after"`
			);
			await queryRunner.query(`ALTER TABLE "point_transactions" RENAME COLUMN "gameHistoryId" TO "game_history_id"`);
			await queryRunner.query(`ALTER TABLE "point_transactions" RENAME COLUMN "paymentId" TO "payment_id"`);
			await queryRunner.query(`ALTER TABLE "point_transactions" RENAME COLUMN "transactionDate" TO "transaction_date"`);
			await queryRunner.query(`ALTER TABLE "point_transactions" RENAME COLUMN "createdAt" TO "created_at"`);

			console.log('Migration completed successfully: UpdateColumnNamesToSnakeCase', {
				migrationName: this.name,
				operation: 'up',
				tablesUpdated: ['users', 'game_history', 'trivia', 'payment_history', 'subscriptions', 'point_transactions'],
				columnsRenamed: 45,
			});
		} catch (error) {
			console.error('Migration failed: UpdateColumnNamesToSnakeCase', {
				migrationName: this.name,
				operation: 'up',
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		console.log('Starting migration rollback: UpdateColumnNamesToSnakeCase', {
			migrationName: this.name,
			operation: 'down',
		});

		try {
			// Revert users table columns
			console.log('Reverting users table column names to camelCase');
			await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "password_hash" TO "passwordHash"`);
			await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "google_id" TO "googleId"`);
			await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "full_name" TO "fullName"`);
			await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "first_name" TO "firstName"`);
			await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "last_name" TO "lastName"`);
			await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "date_of_birth" TO "dateOfBirth"`);
			await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "purchased_points" TO "purchasedPoints"`);
			await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "daily_free_questions" TO "dailyFreeQuestions"`);
			await queryRunner.query(
				`ALTER TABLE "users" RENAME COLUMN "remaining_free_questions" TO "remainingFreeQuestions"`
			);
			await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "last_credit_refill" TO "lastCreditRefill"`);
			await queryRunner.query(
				`ALTER TABLE "users" RENAME COLUMN "last_free_questions_reset" TO "lastFreeQuestionsReset"`
			);
			await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "additional_info" TO "additionalInfo"`);
			await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "agree_to_newsletter" TO "agreeToNewsletter"`);
			await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "current_subscription_id" TO "currentSubscriptionId"`);
			await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "created_at" TO "createdAt"`);
			await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "updated_at" TO "updatedAt"`);

			// Revert game_history table columns
			console.log('Reverting game_history table column names to camelCase');
			await queryRunner.query(`ALTER TABLE "game_history" RENAME COLUMN "user_id" TO "userId"`);
			await queryRunner.query(`ALTER TABLE "game_history" RENAME COLUMN "game_id" TO "gameId"`);
			await queryRunner.query(`ALTER TABLE "game_history" RENAME COLUMN "total_questions" TO "totalQuestions"`);
			await queryRunner.query(`ALTER TABLE "game_history" RENAME COLUMN "correct_answers" TO "correctAnswers"`);
			await queryRunner.query(`ALTER TABLE "game_history" RENAME COLUMN "incorrect_answers" TO "incorrectAnswers"`);
			await queryRunner.query(`ALTER TABLE "game_history" RENAME COLUMN "time_taken" TO "timeTaken"`);
			await queryRunner.query(`ALTER TABLE "game_history" RENAME COLUMN "search_vector" TO "searchVector"`);
			await queryRunner.query(`ALTER TABLE "game_history" RENAME COLUMN "created_at" TO "createdAt"`);
			await queryRunner.query(`ALTER TABLE "game_history" RENAME COLUMN "updated_at" TO "updatedAt"`);

			// Revert trivia table columns
			console.log('Reverting trivia table column names to camelCase');
			await queryRunner.query(`ALTER TABLE "trivia" RENAME COLUMN "correct_answer" TO "correctAnswer"`);
			await queryRunner.query(`ALTER TABLE "trivia" RENAME COLUMN "incorrect_answers" TO "incorrectAnswers"`);
			await queryRunner.query(`ALTER TABLE "trivia" RENAME COLUMN "search_vector" TO "searchVector"`);
			await queryRunner.query(`ALTER TABLE "trivia" RENAME COLUMN "created_at" TO "createdAt"`);
			await queryRunner.query(`ALTER TABLE "trivia" RENAME COLUMN "updated_at" TO "updatedAt"`);

			// Revert payment_history table columns
			console.log('Reverting payment_history table column names to camelCase');
			await queryRunner.query(`ALTER TABLE "payment_history" RENAME COLUMN "user_id" TO "userId"`);
			await queryRunner.query(`ALTER TABLE "payment_history" RENAME COLUMN "payment_id" TO "paymentId"`);
			await queryRunner.query(`ALTER TABLE "payment_history" RENAME COLUMN "payment_method" TO "paymentMethod"`);
			await queryRunner.query(`ALTER TABLE "payment_history" RENAME COLUMN "created_at" TO "createdAt"`);
			await queryRunner.query(`ALTER TABLE "payment_history" RENAME COLUMN "updated_at" TO "updatedAt"`);

			// Revert subscriptions table columns
			console.log('Reverting subscriptions table column names to camelCase');
			await queryRunner.query(`ALTER TABLE "subscriptions" RENAME COLUMN "user_id" TO "userId"`);
			await queryRunner.query(`ALTER TABLE "subscriptions" RENAME COLUMN "subscription_id" TO "subscriptionId"`);
			await queryRunner.query(`ALTER TABLE "subscriptions" RENAME COLUMN "plan_id" TO "planId"`);
			await queryRunner.query(
				`ALTER TABLE "subscriptions" RENAME COLUMN "current_period_start" TO "currentPeriodStart"`
			);
			await queryRunner.query(`ALTER TABLE "subscriptions" RENAME COLUMN "current_period_end" TO "currentPeriodEnd"`);
			await queryRunner.query(
				`ALTER TABLE "subscriptions" RENAME COLUMN "cancel_at_period_end" TO "cancelAtPeriodEnd"`
			);
			await queryRunner.query(`ALTER TABLE "subscriptions" RENAME COLUMN "created_at" TO "createdAt"`);
			await queryRunner.query(`ALTER TABLE "subscriptions" RENAME COLUMN "updated_at" TO "updatedAt"`);

			// Revert point_transactions table columns
			console.log('Reverting point_transactions table column names to camelCase');
			await queryRunner.query(`ALTER TABLE "point_transactions" RENAME COLUMN "user_id" TO "userId"`);
			await queryRunner.query(`ALTER TABLE "point_transactions" RENAME COLUMN "balance_after" TO "balanceAfter"`);
			await queryRunner.query(
				`ALTER TABLE "point_transactions" RENAME COLUMN "free_questions_after" TO "freeQuestionsAfter"`
			);
			await queryRunner.query(
				`ALTER TABLE "point_transactions" RENAME COLUMN "purchased_points_after" TO "purchasedPointsAfter"`
			);
			await queryRunner.query(`ALTER TABLE "point_transactions" RENAME COLUMN "game_history_id" TO "gameHistoryId"`);
			await queryRunner.query(`ALTER TABLE "point_transactions" RENAME COLUMN "payment_id" TO "paymentId"`);
			await queryRunner.query(`ALTER TABLE "point_transactions" RENAME COLUMN "transaction_date" TO "transactionDate"`);
			await queryRunner.query(`ALTER TABLE "point_transactions" RENAME COLUMN "created_at" TO "createdAt"`);

			console.log('Migration rollback completed: UpdateColumnNamesToSnakeCase', {
				migrationName: this.name,
				operation: 'down',
				tablesReverted: ['users', 'game_history', 'trivia', 'payment_history', 'subscriptions', 'point_transactions'],
				columnsReverted: 45,
			});
		} catch (error) {
			console.error('Migration rollback failed: UpdateColumnNamesToSnakeCase', {
				migrationName: this.name,
				operation: 'down',
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}
}
