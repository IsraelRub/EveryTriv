import { Global, Injectable, Module, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

import { getErrorMessage } from '@shared/utils';

import { redisConfig } from '@config';
import { serverLogger as logger } from '@internal/services';

@Injectable()
export class RedisSocketIoService {
	private pubClient: Redis | null = null;
	private subClient: Redis | null = null;

	async createPubSubClients(): Promise<{ pubClient: Redis; subClient: Redis } | null> {
		if (!redisConfig.host) {
			logger.systemError('Redis not configured for Socket.IO adapter');
			return null;
		}

		if (this.pubClient && this.subClient) {
			return { pubClient: this.pubClient, subClient: this.subClient };
		}

		try {
			this.pubClient = new Redis(redisConfig);
			this.subClient = this.pubClient.duplicate();

			await Promise.all([
				new Promise<void>((resolve, reject) => {
					if (!this.pubClient) {
						reject(new Error('Pub client not initialized'));
						return;
					}
					this.pubClient.on('connect', () => resolve());
					this.pubClient.on('error', err => reject(err));
				}),
				new Promise<void>((resolve, reject) => {
					if (!this.subClient) {
						reject(new Error('Sub client not initialized'));
						return;
					}
					this.subClient.on('connect', () => resolve());
					this.subClient.on('error', err => reject(err));
				}),
			]);

			logger.systemInfo('Redis pub/sub clients created for Socket.IO adapter', {
				host: redisConfig.host,
				port: redisConfig.port,
			});

			return { pubClient: this.pubClient, subClient: this.subClient };
		} catch (error) {
			logger.systemError('Failed to create Redis pub/sub clients for Socket.IO adapter', {
				errorInfo: { message: getErrorMessage(error) },
			});
			return null;
		}
	}
}

@Global()
@Module({
	providers: [
		{
			provide: 'REDIS_CLIENT',
			useFactory: (): Redis | null => {
				// Only create Redis client if Redis is configured
				if (!redisConfig.host) {
					logger.systemError('Redis not configured - using null client');
					return null;
				}

				const redisClient = new Redis(redisConfig);

				// Setup Redis event logging
				redisClient.on('connect', () => {
					logger.appStartup();
				});

				redisClient.on('ready', () => {
					logger.appStartup();
				});

				redisClient.on('error', (err: Error) => {
					logger.systemError(`Redis client error: ${err.message}`, {
						errorInfo: { message: err.message },
						host: redisConfig.host,
						port: redisConfig.port,
					});
				});

				redisClient.on('reconnecting', (delay: number) => {
					logger.systemError(`Redis client reconnecting in ${delay}ms`, {
						delay,
						host: redisConfig.host,
						port: redisConfig.port,
					});
				});

				redisClient.on('end', () => {
					logger.systemInfo('Redis client connection closed', {
						host: redisConfig.host,
						port: redisConfig.port,
					});
				});

				return redisClient;
			},
		},
		RedisSocketIoService,
	],
	exports: ['REDIS_CLIENT', RedisSocketIoService],
})
export class RedisModule implements OnModuleInit {
	onModuleInit() {
		logger.systemInfo('Redis module initialized', {
			host: redisConfig.host,
			port: redisConfig.port,
			password: redisConfig.password ? '***' : 'not set',
			db: redisConfig.db,
			keyPrefix: redisConfig.keyPrefix,
			connectTimeout: redisConfig.connectTimeout,
			commandTimeout: redisConfig.commandTimeout,
		});
	}
}
