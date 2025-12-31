/**
 * Credits Module
 *
 * @module CreditsModule
 * @description Module for managing user credits, purchases, and transactions
 * @used_by server/src/app, server/src/controllers
 * @dependencies TypeOrmModule, CacheModule, PaymentModule
 * @provides CreditsService
 * @entities CreditTransactionEntity, UserEntity
 */
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CreditTransactionEntity, UserEntity } from '@internal/entities';
import { CacheModule } from '@internal/modules';
import { ValidationModule } from '../../common/validation/validation.module';
import { AuthModule } from '../auth';
import { PaymentModule } from '../payment';
import { CreditsController } from './credits.controller';
import { CreditsService } from './credits.service';

@Module({
	imports: [
		TypeOrmModule.forFeature([CreditTransactionEntity, UserEntity]),
		CacheModule,
		PaymentModule,
		ValidationModule,
		forwardRef(() => AuthModule),
	],
	controllers: [CreditsController],
	providers: [CreditsService],
	exports: [CreditsService],
})
export class CreditsModule {}
