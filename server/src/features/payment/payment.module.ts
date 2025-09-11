import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentHistoryEntity } from 'src/internal/entities';
import { CacheModule, StorageModule } from 'src/internal/modules';
import { UserEntity, SubscriptionEntity } from 'src/internal/entities';
import { AuthModule } from '../auth/auth.module';
import { ValidationModule } from '../../common/validation/validation.module';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PaymentDataPipe } from '../../common/pipes';

@Module({
	imports: [TypeOrmModule.forFeature([PaymentHistoryEntity, SubscriptionEntity, UserEntity]), CacheModule, StorageModule, AuthModule, ValidationModule],
	controllers: [PaymentController],
	providers: [PaymentService, PaymentDataPipe],
	exports: [PaymentService],
})
export class PaymentModule {}
