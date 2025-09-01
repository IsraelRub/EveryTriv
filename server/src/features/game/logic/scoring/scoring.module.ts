import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { GameHistoryEntity, UserEntity } from '../../../../shared/entities';
import { AuthSharedModule } from '../../../../shared/modules/auth';
import { ScoringController } from './scoring.controller';
import { ScoringService } from './scoring.service';

/**
 * Module for game scoring and leaderboard management
 * Handles points calculation, user scores, and leaderboard operations
 */
@Module({
	imports: [TypeOrmModule.forFeature([UserEntity, GameHistoryEntity]), AuthSharedModule],
	controllers: [ScoringController],
	providers: [ScoringService],
	exports: [ScoringService],
})
export class ScoringModule {}
