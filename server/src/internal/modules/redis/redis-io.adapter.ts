import { INestApplicationContext } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { ServerOptions } from 'socket.io';

import { getErrorMessage } from '@shared/utils';

import { serverLogger as logger } from '@internal/services';

import { RedisSocketIoService } from './redis.module';

export class RedisIoAdapter extends IoAdapter {
	private adapterConstructor: ReturnType<typeof createAdapter> | undefined;
	private appContext: INestApplicationContext;

	constructor(app: INestApplicationContext) {
		super(app);
		this.appContext = app;
	}

	async connectToRedis(): Promise<void> {
		try {
			const redisSocketIoService = this.appContext.get(RedisSocketIoService, { strict: false });
			if (!redisSocketIoService) {
				logger.systemError('RedisSocketIoService not available for Socket.IO adapter');
				return;
			}

			const clients = await redisSocketIoService.createPubSubClients();
			if (!clients) {
				logger.systemError('Failed to create Redis pub/sub clients for Socket.IO adapter');
				return;
			}

			const { pubClient, subClient } = clients;
			this.adapterConstructor = createAdapter(pubClient, subClient);
			logger.systemInfo('Redis adapter initialized for Socket.IO', {
				host: pubClient.options.host,
				port: pubClient.options.port,
			});
		} catch (error) {
			logger.systemError('Failed to connect to Redis for Socket.IO adapter', {
				errorInfo: { message: getErrorMessage(error) },
			});
		}
	}

	createIOServer(port: number, options?: ServerOptions): any {
		const server = super.createIOServer(port, options);
		if (this.adapterConstructor) {
			server.adapter(this.adapterConstructor);
		}
		return server;
	}
}
