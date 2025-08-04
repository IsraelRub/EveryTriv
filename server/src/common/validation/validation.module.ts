import { Module } from '@nestjs/common';
import { RedisModule } from '../../config/redis.module';
import { InputValidationService } from './input-validation.service';

@Module({
  imports: [RedisModule],
  providers: [InputValidationService],
  exports: [InputValidationService],
})
export class ValidationModule {}