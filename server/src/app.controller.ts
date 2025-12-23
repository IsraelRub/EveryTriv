/**
 * Application Controller
 *
 * @module AppController
 * @description Main application controller for health checks and basic routes
 * @used_by server/src/app, server/src/main
 */
import { Controller, Get } from '@nestjs/common';

import { API_VERSION, CACHE_DURATION } from '@shared/constants';

import { serverLogger as logger } from '@internal/services';

import { Cache, Public } from './common';

/**
 * Main application controller
 * @description Handles basic application routes and health checks
 * @used_by server/src/app, server/src/main
 */
@Controller()
export class AppController {
	/**
	 * Root endpoint - API status
	 */
	@Get('/')
	@Public()
	@Cache(CACHE_DURATION.MEDIUM) // Cache for 5 minutes
	getHello(): string {
		logger.apiRead('app_root', {});
		return 'EveryTriv API is running!';
	}

	/**
	 * Health check endpoint
	 */
	@Get('/health')
	@Public()
	@Cache(CACHE_DURATION.VERY_SHORT) // Cache for 30 seconds
	getHealth(): { status: string; version: string } {
		logger.apiRead('app_health', {
			version: API_VERSION,
		});

		return {
			status: 'ok',
			version: API_VERSION,
		};
	}
}
