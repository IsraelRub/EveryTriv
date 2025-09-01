import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { LoggerService } from '../../shared/controllers';
import { PaymentHistoryEntity } from '../../shared/entities';
import { CacheModule } from '../../shared/modules';
import { PaymentController } from './payment.controller';
import { PaymentService } from './services/payment.service';

@Module({
	imports: [TypeOrmModule.forFeature([PaymentHistoryEntity]), CacheModule],
	controllers: [PaymentController],
	providers: [PaymentService, LoggerService],
	exports: [PaymentService],
})
export class PaymentModule {}
