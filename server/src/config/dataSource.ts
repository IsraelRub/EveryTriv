import { DataSource } from 'typeorm';

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
	host: process.env.DATABASE_HOST || 'localhost',
	port: parseInt(process.env.DATABASE_PORT || '5432', 10),
	username: process.env.DATABASE_USERNAME || 'everytriv_user',
	password: process.env.DATABASE_PASSWORD || 'test123',
	database: process.env.DATABASE_NAME || 'everytriv',
	schema: process.env.DATABASE_SCHEMA || 'public',
	entities: [
		__dirname + '/../shared/entities/user.entity.ts',
		__dirname + '/../shared/entities/gameHistory.entity.ts',
		__dirname + '/../shared/entities/trivia.entity.ts',
		__dirname + '/../shared/entities/subscription.entity.ts',
		__dirname + '/../shared/entities/paymentHistory.entity.ts',
		__dirname + '/../shared/entities/pointTransaction.entity.ts',
	],
	migrations: [__dirname + '/../migrations/*{.ts,.js}'],
	synchronize: false, // Always false for migrations - NEVER change this!
	logging: process.env.NODE_ENV !== 'prod',
	ssl: process.env.DATABASE_SSL === 'true' || process.env.NODE_ENV === 'prod',
	extra: {
		max: 20,
		min: 5,
		acquire: 30000,
		idle: 10000,
	},
});
