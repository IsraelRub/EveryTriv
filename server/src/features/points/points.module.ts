/**
 * Points Module
 *
 * @module PointsModule
 * @description Module for managing user points, purchases, and transactions
 * @used_by server/app, server/controllers
 * @dependencies TypeOrmModule, CacheModule, PaymentModule
 * @provides PointsService
 * @entities PointTransactionEntity, UserEntity
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ValidationService } from '../../common/validation/validation.service';
import { PointTransactionEntity, UserEntity } from '../../shared/entities';
import { CacheModule } from '../../shared/modules';
import { PaymentModule } from '../payment';
import { PointsController } from './points.controller';
import { PointsService } from './points.service';

@Module({
	imports: [TypeOrmModule.forFeature([PointTransactionEntity, UserEntity]), CacheModule, PaymentModule],
	controllers: [PointsController],
	providers: [PointsService, ValidationService],
	exports: [PointsService],
})
export class PointsModule {}
