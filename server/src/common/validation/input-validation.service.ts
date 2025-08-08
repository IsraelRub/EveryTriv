import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../config/redis.service';

interface LanguageToolError {
  message: string;
  offset: number;
  length: number;
  rule: {
    id: string;
    description: string;
    category: string;
  };
  context: {
    text: string;
    offset: number;
    length: number;
  };
}

interface LanguageToolResponse {
  software: {
    name: string;
    version: string;
    buildDate: string;
    apiVersion: number;
    status: string;
  };
  language: {
    name: string;
    code: string;
    detectedLanguage: {
      name: string;
      code: string;
      confidence: number;
    };
  };
  matches: LanguageToolError[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: Array<{
    message: string;
    suggestion?: string;
    position: {
      start: number;
      end: number;
    };
  }>;
}

@Injectable()
export class InputValidationService {
  private readonly logger = new Logger(InputValidationService.name);

  constructor(private readonly redisService: RedisService) {}

  async validateInput(text: string): Promise<ValidationResult> {
    try {
      // Check cache first
      const cacheKey = `validation:${Buffer.from(text).toString('base64')}`;
      const cached = await this.redisService.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached as string);
      }

      const response = await fetch('https://api.languagetool.org/v2/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          text,
          language: 'en-US',
          enabledOnly: 'false',
        }),
      });

      if (!response.ok) {
        throw new Error('Language validation service unavailable');
      }

      const data: LanguageToolResponse = await response.json();

      const result: ValidationResult = {
        isValid: data.matches.length === 0,
        errors: data.matches.map(error => ({
          message: error.message,
          suggestion: error.rule.description,
          position: {
            start: error.offset,
            end: error.offset + error.length,
          },
        })),
      };

      // Cache the result
      await this.redisService.set(
        cacheKey,
        JSON.stringify(result),
        60 * 60 // 1 hour TTL
      );

      return result;
    } catch (error) {
      this.logger.error('Input validation error:', error);
      // Return valid result if service is unavailable
      return {
        isValid: true,
        errors: [],
      };
    }
  }

  async validateBatch(texts: string[]): Promise<ValidationResult[]> {
    return Promise.all(texts.map(text => this.validateInput(text)));
  }
}