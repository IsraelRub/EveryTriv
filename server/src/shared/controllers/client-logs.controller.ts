import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { log } from '../../shared/utils/logger';
import * as fs from 'fs';
import * as path from 'path';

@Controller('client-logs')
export class ClientLogsController {
  private readonly clientLogPath = path.join(process.cwd(), '..', 'client', 'logs', 'client.log');

  constructor() {
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
      log.error('Failed to create client logs directory', { error });
    }
  }

  @Post('write')
  @HttpCode(200)
  async writeClientLogs(@Body() body: { content: string }): Promise<{ success: boolean }> {
    try {
      fs.writeFileSync(this.clientLogPath, body.content, 'utf8');
      log.debug('Client logs written to file', { path: this.clientLogPath });
      return { success: true };
    } catch (error) {
      log.error('Failed to write client logs', { error, path: this.clientLogPath });
      return { success: false };
    }
  }

  @Post('clear')
  @HttpCode(200)
  async clearClientLogs(): Promise<{ success: boolean }> {
    try {
      fs.writeFileSync(this.clientLogPath, '', 'utf8');
      log.debug('Client logs cleared', { path: this.clientLogPath });
      return { success: true };
    } catch (error) {
      log.error('Failed to clear client logs', { error, path: this.clientLogPath });
      return { success: false };
    }
  }
}
