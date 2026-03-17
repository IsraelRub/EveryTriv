import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CreditsConfigEntity, CreditTransactionEntity, UserEntity } from '@internal/entities';
import { CacheModule } from '@internal/modules';

import { CreditsController } from './credits.controller';
import { CreditsService } from './credits.service';

@Module({
	imports: [TypeOrmModule.forFeature([CreditTransactionEntity, CreditsConfigEntity, UserEntity]), CacheModule],
	controllers: [CreditsController],
	providers: [CreditsService],
	exports: [CreditsService],
})
export class CreditsModule {}
