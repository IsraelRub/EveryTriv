import 'reflect-metadata';

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';

import { AppConfig } from './app.config';

const possibleEnvPaths = [
	path.resolve(process.cwd(), '.env'),
	path.resolve(__dirname, '../../.env'),
	path.resolve(__dirname, '../../../.env'),
	path.resolve(process.cwd(), '../.env'),
];

if (!process.env.DATABASE_PASSWORD) {
	let envPath: string | undefined;
	for (const possiblePath of possibleEnvPaths) {
		if (fs.existsSync(possiblePath)) {
			envPath = possiblePath;
			break;
		}
	}

	if (envPath) {
		const result = dotenv.config({ path: envPath, override: true });
		if (result.error) {
			// eslint-disable-next-line no-console
			console.warn(`Warning: Failed to load .env file from ${envPath}:`, result.error);
		}
	} else {
		dotenv.config({ override: true });
	}
}

const dbConfig = AppConfig.createDatabaseConfig();

const { name, pool, ...dbConfigRest } = dbConfig;

const typeOrmConfig: DataSourceOptions = {
	type: 'postgres',
	...dbConfigRest,
	database: name,
	entities: [__dirname + '/../**/*.entity{.ts,.js}'],
	migrations: [__dirname + '/../migrations/*{.ts,.js}'],
	extra: pool,
};

export default new DataSource(typeOrmConfig);
