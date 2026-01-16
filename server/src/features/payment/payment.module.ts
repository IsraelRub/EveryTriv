import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PaymentHistoryEntity, UserEntity } from '@internal/entities';
import { CacheModule, StorageModule } from '@internal/modules';

import { PaymentDataPipe } from '../../common/pipes';
import { CreditsModule } from '../credits/credits.module';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PayPalApiService, PayPalAuthService, PayPalWebhookController, PayPalWebhookService } from './providers/paypal';

@Module({
	imports: [
		HttpModule,
		TypeOrmModule.forFeature([PaymentHistoryEntity, UserEntity]),
		CacheModule,
		StorageModule,
		CreditsModule,
	],
	controllers: [PaymentController, PayPalWebhookController],
	providers: [PaymentService, PaymentDataPipe, PayPalApiService, PayPalAuthService, PayPalWebhookService],
	exports: [PaymentService],
})
export class PaymentModule {}
