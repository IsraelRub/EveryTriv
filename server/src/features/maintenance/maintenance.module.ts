import { forwardRef, Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';

import { GameHistoryEntity, TriviaEntity, UserStatsEntity } from '@internal/entities';
import { CacheModule, StorageModule } from '@internal/modules';

import { AnalyticsModule } from '../analytics/analytics.module';
import { GameModule } from '../game/game.module';
import { DataMaintenanceService } from './data-maintenance.service';
import { MaintenanceController } from './maintenance.controller';
import { GameSessionScheduler, ScoreResetScheduler } from './schedulers';
import { UserStatsMaintenanceService } from './user-stats-maintenance.service';

@Module({
	imports: [
		ScheduleModule.forRoot(),
		TypeOrmModule.forFeature([UserStatsEntity, GameHistoryEntity, TriviaEntity]),
		forwardRef(() => AnalyticsModule), // For UserStatsUpdateService
		forwardRef(() => GameModule), // For GameService
		StorageModule, // For GameSessionScheduler
		CacheModule, // For DataMaintenanceService
	],
	controllers: [MaintenanceController],
	providers: [UserStatsMaintenanceService, DataMaintenanceService, ScoreResetScheduler, GameSessionScheduler],
	exports: [UserStatsMaintenanceService, DataMaintenanceService],
})
export class MaintenanceModule {}
