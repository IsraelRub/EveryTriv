import { forwardRef, Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';

import {
	CreditTransactionEntity,
	GameHistoryEntity,
	PaymentHistoryEntity,
	TriviaEntity,
	UserEntity,
	UserStatsEntity,
} from '@internal/entities';
import { CacheModule, StorageModule } from '@internal/modules';

import { AnalyticsModule } from '../analytics/analytics.module';
import { GameModule } from '../game/game.module';
import { DataMaintenanceService } from './dataMaintenance.service';
import { MaintenanceController } from './maintenance.controller';
import { GameSessionScheduler, ScoreResetScheduler } from './schedulers';
import { UserStatsMaintenanceService } from './userStatsMaintenance.service';

@Module({
	imports: [
		ScheduleModule.forRoot(),
		TypeOrmModule.forFeature([
			UserStatsEntity,
			GameHistoryEntity,
			TriviaEntity,
			UserEntity,
			CreditTransactionEntity,
			PaymentHistoryEntity,
		]),
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
