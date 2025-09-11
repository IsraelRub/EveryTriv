/**
 * Application Controller
 *
 * @module AppController
 * @description Main application controller for health checks and basic routes
 * @used_by server/app, server/main
 */
import { Controller, Get } from '@nestjs/common';
import { API_VERSION } from '@shared';
import { Public } from './common';

/**
 * Main application controller
 * @description Handles basic application routes and health checks
 * @used_by server/app, server/main
 */
@Controller()
export class AppController {
	@Get('/')
	@Public()
	getHello(): string {
		return 'EveryTriv API is running!';
	}

	@Get('/health')
	@Public()
	getHealth(): { status: string; timestamp: string; version: string } {
		return {
			status: 'ok',
			timestamp: new Date().toISOString(),
			version: API_VERSION,
		};
	}
}
