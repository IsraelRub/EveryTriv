import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CreditTransactionEntity, UserEntity } from '@internal/entities';
import { CacheModule } from '@internal/modules';

import { CreditsController } from './credits.controller';
import { CreditsService } from './credits.service';

@Module({
	imports: [TypeOrmModule.forFeature([CreditTransactionEntity, UserEntity]), CacheModule],
	controllers: [CreditsController],
	providers: [CreditsService],
	exports: [CreditsService],
})
export class CreditsModule {}
