import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameHistoryEntity } from '../../shared/entities/game-history.entity';
import { GameHistoryService } from './services/game-history.service';
import { GameHistoryController } from './controllers/game-history.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([GameHistoryEntity]),
    forwardRef(() => AuthModule)
  ],
  controllers: [GameHistoryController],
  providers: [GameHistoryService],
  exports: [GameHistoryService],
})
export class GameHistoryModule {}
