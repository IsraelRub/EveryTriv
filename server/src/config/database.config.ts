import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { serverLogger } from 'everytriv-shared/services/logging/serverLogger.service';

import { AppConfig } from './app.config';

export const setDatabaseLogger = (): void => {
	// This function is kept for backward compatibility but we use serverLogger directly
};

export const DatabaseConfig: TypeOrmModuleOptions = {
	type: 'postgres',
	host: AppConfig.database.host,
	port: AppConfig.database.port,
	username: AppConfig.database.username,
	password: AppConfig.database.password,
	database: AppConfig.database.name,
	schema: AppConfig.database.schema,
	entities: [__dirname + '/../**/*.entity{.ts,.js}'],
	migrations: [__dirname + '/../migrations/*{.ts,.js}'],
	synchronize: AppConfig.database.synchronize,
	logging: AppConfig.database.logging,
	ssl: AppConfig.database.ssl,
	autoLoadEntities: true,
	extra: {
		max: AppConfig.database.pool.max,
		min: AppConfig.database.pool.min,
		acquire: AppConfig.database.pool.acquire,
		idle: AppConfig.database.pool.idle,
	},
};

// Debug: Log database configuration
serverLogger.databaseInfo('Database configuration loaded', {
	host: AppConfig.database.host,
	port: AppConfig.database.port,
	username: AppConfig.database.username,
	password: AppConfig.database.password ? '***' : 'not set',
	database: AppConfig.database.name,
	schema: AppConfig.database.schema,
	synchronize: AppConfig.database.synchronize,
	logging: AppConfig.database.logging,
	ssl: AppConfig.database.ssl,
});

// Debug: Log TypeORM configuration
serverLogger.databaseInfo('TypeORM configuration loaded', {
	type: DatabaseConfig.type || 'postgres',
	host: DatabaseConfig.host || 'localhost',
	port: DatabaseConfig.port || 5432,
	username: DatabaseConfig.username || 'postgres',
	password: DatabaseConfig.password ? '***' : 'not set',
	database: DatabaseConfig.database || 'everytriv',
	schema: DatabaseConfig.schema || 'public',
	synchronize: DatabaseConfig.synchronize || false,
	logging: DatabaseConfig.logging || false,
	ssl: DatabaseConfig.ssl ? 'enabled' : 'disabled',
});

// Debug: Log actual connection attempt
serverLogger.databaseInfo('Attempting to connect to database', {
	connectionString: `postgresql://${DatabaseConfig.username}:***@${DatabaseConfig.host}:${DatabaseConfig.port}/${DatabaseConfig.database}`,
});
