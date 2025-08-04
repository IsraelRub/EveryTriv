import { Module } from '@nestjs/common';
import { AIService } from './ai.service';
import { LoggerModule } from '../../modules/logger/logger.module';

@Module({
  imports: [LoggerModule],
  providers: [AIService],
  exports: [AIService],
})
export class AIModule {}