import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { config } from 'dotenv';
import logger from '../shared/utils/logger';

config();

// Custom logger for TypeORM
const dbLogger = {
  log: (level: 'log' | 'info' | 'warn', message: any) => {
    if (level === 'log') {
      logger.debug(message, { context: 'Database' });
    } else if (level === 'info') {
      logger.info(message, { context: 'Database' });
    } else {
      logger.warn(message, { context: 'Database' });
    }
  },
  logQuery: (query: string, parameters?: any[]) => {
    if (process.env.NODE_ENV !== 'prod') {
      logger.debug(`Query: ${query}`, { 
        context: 'Database', 
        parameters: parameters || [] 
      });
    }
  },
  logQueryError: (error: string, query: string, parameters?: any[]) => {
    logger.error(`Query Error: ${error}`, { 
      context: 'Database', 
      query, 
      parameters: parameters || [] 
    });
  },
  logQuerySlow: (time: number, query: string, parameters?: any[]) => {
    logger.warn(`Slow Query (${time}ms): ${query}`, { 
      context: 'Database', 
      time,
      parameters: parameters || [] 
    });
  },
  logMigration: (message: string) => {
    logger.info(`Migration: ${message}`, { context: 'Database' });
  },
  logSchemaBuild: (message: string) => {
    logger.info(`Schema Build: ${message}`, { context: 'Database' });
  },
  logConnect: (connection: any) => {
    logger.info(`Database Connected`, { 
      context: 'Database',
      database: connection.options.database,
      host: connection.options.host
    });
  },
  logDisconnect: () => {
    logger.info(`Database Disconnected`, { context: 'Database' });
  },
};

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USERNAME || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'everytriv',
  schema: process.env.DATABASE_SCHEMA || 'public',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],
  synchronize: process.env.NODE_ENV !== 'prod',
  logging: process.env.NODE_ENV !== 'prod',
  logger: dbLogger,
  ssl: process.env.DATABASE_SSL === 'true' || process.env.NODE_ENV === 'prod',
  extra: {
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
    connectionTimeoutMillis: 2000, // How long to wait before timing out when connecting a new client
  },
  // Remove Redis cache for now to fix startup issues
  // cache: {
  //   type: 'redis',
  //   options: {
  //     host: process.env.REDIS_HOST || 'localhost',
  //     port: parseInt(process.env.REDIS_PORT || '6379', 10),
  //     password: process.env.REDIS_PASSWORD,
  //     db: 0,
  //   },
  //   duration: 60000, // Cache duration in milliseconds (1 minute)
  // },
};