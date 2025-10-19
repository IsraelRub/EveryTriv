import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentHistoryEntity, SubscriptionEntity, UserEntity } from 'src/internal/entities';
import { CacheModule, StorageModule } from 'src/internal/modules';

import { PaymentDataPipe } from '../../common/pipes';
import { ValidationModule } from '../../common/validation/validation.module';
import { AuthModule } from '../auth';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';

@Module({
	imports: [
		TypeOrmModule.forFeature([PaymentHistoryEntity, SubscriptionEntity, UserEntity]),
		CacheModule,
		StorageModule,
		AuthModule,
		ValidationModule,
	],
	controllers: [PaymentController],
	providers: [PaymentService, PaymentDataPipe],
	exports: [PaymentService],
})
export class PaymentModule {}
