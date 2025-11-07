import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserEntity } from '@internal/entities';

import { AuthModule } from '../auth';
import { PaymentModule } from '../payment';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';

@Module({
	imports: [TypeOrmModule.forFeature([UserEntity]), PaymentModule, AuthModule],
	controllers: [SubscriptionController],
	providers: [SubscriptionService],
	exports: [SubscriptionService],
})
export class SubscriptionModule {}
