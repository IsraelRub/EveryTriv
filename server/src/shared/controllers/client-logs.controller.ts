import { Controller, Post, Body, HttpCode, Get, Inject } from '@nestjs/common';
import { LoggerService } from '../modules/logger/logger.service';
import type { ClientLogSyncRequest, ClientLogSyncResponse } from '../../../../shared/types/logging.types';
import * as fs from 'fs';
import * as path from 'path';

@Controller('client-logs')
export class ClientLogsController {
  private readonly clientLogPath = path.join(process.cwd(), '..', 'client', 'logs', 'client.log');

  constructor(
    @Inject(LoggerService) private readonly logger: LoggerService
  ) {
    // Ensure client logs directory exists
    this.ensureLogDirectory();
  }

  private ensureLogDirectory(): void {
    try {
      const logDir = path.dirname(this.clientLogPath);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
    } catch (error) {
      this.logger.error('Failed to create client logs directory', { error });
    }
  }

  @Post('write')
  @HttpCode(200)
  async writeClientLogs(@Body() body: ClientLogSyncRequest): Promise<ClientLogSyncResponse> {
    try {
      // Append to file instead of overwriting
      fs.appendFileSync(this.clientLogPath, body.content, 'utf8');
      this.logger.debug('Client logs appended to file', { 
        path: this.clientLogPath, 
        contentLength: body.content.length 
      });
      return { success: true };
    } catch (error) {
      this.logger.error('Failed to write client logs', { error, path: this.clientLogPath });
      return { success: false };
    }
  }

  @Post('clear')
  @HttpCode(200)
  async clearClientLogs(): Promise<ClientLogSyncResponse> {
    try {
      fs.writeFileSync(this.clientLogPath, '', 'utf8');
      this.logger.debug('Client logs cleared', { path: this.clientLogPath });
      return { success: true };
    } catch (error) {
      this.logger.error('Failed to clear client logs', { error, path: this.clientLogPath });
      return { success: false };
    }
  }

  @Get('read')
  async readClientLogs(): Promise<{ success: boolean; content?: string }> {
    try {
      if (!fs.existsSync(this.clientLogPath)) {
        return { success: true, content: '' };
      }
      
      const content = fs.readFileSync(this.clientLogPath, 'utf8');
      this.logger.debug('Client logs read from file', { 
        path: this.clientLogPath, 
        contentLength: content.length 
      });
      return { success: true, content };
    } catch (error) {
      this.logger.error('Failed to read client logs', { error, path: this.clientLogPath });
      return { success: false };
    }
  }
}
