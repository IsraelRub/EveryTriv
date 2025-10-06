/**
 * Points Module
 *
 * @module PointsModule
 * @description Module for managing user points, purchases, and transactions
 * @used_by server/src/app, server/src/controllers
 * @dependencies TypeOrmModule, CacheModule, PaymentModule
 * @provides PointsService
 * @entities PointTransactionEntity, UserEntity
 */
import { PointTransactionEntity, UserEntity } from 'src/internal/entities';
import { CacheModule } from 'src/internal/modules';

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ValidationModule } from '../../common/validation/validation.module';
import { AuthModule } from '../auth/auth.module';
import { PaymentModule } from '../payment';
import { PointsController } from './points.controller';
import { PointsService } from './points.service';

@Module({
	imports: [
		TypeOrmModule.forFeature([PointTransactionEntity, UserEntity]),
		CacheModule,
		PaymentModule,
		ValidationModule,
		AuthModule,
	],
	controllers: [PointsController],
	providers: [PointsService],
	exports: [PointsService],
})
export class PointsModule {}
