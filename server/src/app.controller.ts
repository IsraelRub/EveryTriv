import { Controller, Get } from '@nestjs/common';

import { TIME_DURATIONS_SECONDS } from '@shared/constants';

import { serverLogger as logger } from '@internal/services';

import { Cache, Public } from './common';

@Controller()
export class AppController {
	@Get('/')
	@Public()
	@Cache(TIME_DURATIONS_SECONDS.HOUR)
	getHello(): string {
		logger.apiRead('app_root', {});
		return 'EveryTriv API is running!';
	}
}
