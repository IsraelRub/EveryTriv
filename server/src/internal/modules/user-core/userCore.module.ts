import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserEntity } from '@internal/entities';

import { UserCoreService } from './userCore.service';

@Global()
@Module({
	imports: [TypeOrmModule.forFeature([UserEntity])],
	providers: [UserCoreService],
	exports: [UserCoreService],
})
export class UserCoreModule {}
