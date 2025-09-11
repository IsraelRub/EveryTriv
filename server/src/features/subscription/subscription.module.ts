import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserEntity } from 'src/internal/entities';
import { AuthModule } from '../auth/auth.module';
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
