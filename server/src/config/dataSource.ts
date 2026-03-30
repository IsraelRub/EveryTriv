import 'reflect-metadata';

import '../load-env';
import { DataSource } from 'typeorm';

import { AppConfig } from './app.config';

export default new DataSource(AppConfig.createTypeOrmDataSourceOptions());
