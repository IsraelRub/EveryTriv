import 'reflect-metadata';
import '../loadEnv';

import { DataSource } from 'typeorm';

import { AppConfig } from './app.config';

export default new DataSource(AppConfig.createTypeOrmDataSourceOptions());
