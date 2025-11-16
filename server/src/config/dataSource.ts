import 'reflect-metadata';

import { DataSource, DataSourceOptions } from 'typeorm';

import { DatabaseConfig } from './database.config';

const { autoLoadEntities, ...typeOrmConfig } = DatabaseConfig;

export default new DataSource(typeOrmConfig as DataSourceOptions);
