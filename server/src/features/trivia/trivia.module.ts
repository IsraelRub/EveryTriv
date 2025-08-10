import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TriviaEntity } from '../../shared/entities/trivia.entity';
import { UserEntity } from '../../shared/entities/user.entity';
import { TriviaController } from './controllers';
import { TriviaAnalyticsController } from './controllers/trivia-analytics.controller';
import { TriviaService } from './services';
import { RedisModule } from '../../config/redis.module';
import { ValidationModule } from '../../common/validation/validation.module';
import { QueueModule } from './queue.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TriviaEntity, UserEntity]),
    RedisModule,
    ValidationModule,
    QueueModule,
    UserModule
  ],
  controllers: [TriviaController, TriviaAnalyticsController],
  providers: [TriviaService],
  exports: [TriviaService],
})
export class TriviaModule {}
