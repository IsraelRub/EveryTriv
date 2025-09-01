import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { LoggerService } from '../../shared/controllers';
import { UserEntity } from '../../shared/entities';
import { PaymentModule } from '../payment';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';

@Module({
	imports: [TypeOrmModule.forFeature([UserEntity]), PaymentModule],
	controllers: [SubscriptionController],
	providers: [SubscriptionService, LoggerService],
	exports: [SubscriptionService],
})
export class SubscriptionModule {}
