import { DataSource } from 'typeorm';

import { AppConfig } from './app.config';

/**
 * TypeORM DataSource for migrations
 *
 * This DataSource is used specifically for running migrations.
 * It should NEVER have synchronize: true to ensure migrations are the only way
 * to modify the database schema.
 *
 * Usage:
 * - pnpm migration:generate src/migrations/MigrationName
 * - pnpm migration:run
 * - pnpm migration:revert
 * - pnpm migration:show
 */
export const AppDataSource = new DataSource({
	type: 'postgres',
	host: AppConfig.database.host,
	port: AppConfig.database.port,
	username: AppConfig.database.username,
	password: AppConfig.database.password,
	database: AppConfig.database.name,
	schema: AppConfig.database.schema,
	entities: [
		__dirname + '/../internal/entities/user.entity.ts',
		__dirname + '/../internal/entities/userStats.entity.ts',
		__dirname + '/../internal/entities/gameHistory.entity.ts',
		__dirname + '/../internal/entities/trivia.entity.ts',
		__dirname + '/../internal/entities/subscription.entity.ts',
		__dirname + '/../internal/entities/paymentHistory.entity.ts',
		__dirname + '/../internal/entities/pointTransaction.entity.ts',
		__dirname + '/../internal/entities/leaderboard.entity.ts',
	],
	migrations: [__dirname + '/../migrations/*{.ts,.js}'],
	synchronize: AppConfig.database.synchronize, // Always false for migrations - NEVER change this!
	logging: AppConfig.database.logging,
	ssl: AppConfig.database.ssl,
	extra: {
		max: AppConfig.database.pool.max,
		min: AppConfig.database.pool.min,
		acquire: AppConfig.database.pool.acquire,
		idle: AppConfig.database.pool.idle,
	},
});
