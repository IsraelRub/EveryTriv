import { Injectable } from '@nestjs/common';
import { log } from '../../utils/logger';

@Injectable()
export class LoggerService {
  error(message: string, meta?: any) {
    log.error(message, meta);
  }

  warn(message: string, meta?: any) {
    log.warn(message, meta);
  }

  info(message: string, meta?: any) {
    log.info(message, meta);
  }

  debug(message: string, meta?: any) {
    log.debug(message, meta);
  }
}