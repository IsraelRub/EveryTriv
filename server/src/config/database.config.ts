import { TypeOrmModuleOptions } from '@nestjs/typeorm';

import { AppConfig } from './app.config';

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
