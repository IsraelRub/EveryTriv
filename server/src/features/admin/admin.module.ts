import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule as CommonAuthModule } from 'src/common/auth';

import { GameHistoryEntity, TriviaEntity, UserEntity, UserStatsEntity } from '@internal/entities';
import { CacheModule } from '@internal/modules';

import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminBootstrapService } from './adminBootstrap.service';

@Module({
	imports: [
		CommonAuthModule,
		TypeOrmModule.forFeature([GameHistoryEntity, TriviaEntity, UserStatsEntity, UserEntity]),
		CacheModule,
	],
	controllers: [AdminController],
	providers: [AdminService, AdminBootstrapService],
	exports: [AdminService],
})
export class AdminModule {}
