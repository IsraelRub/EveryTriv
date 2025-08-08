import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware that performs basic validation on request body
 * As shown in the architecture diagram ("body is valid ???")
 */
@Injectable()
export class BodyValidationMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    // Skip validation for GET requests and similar
    if (!['POST', 'PUT', 'PATCH'].includes(req.method)) {
      next();
      return;
    }

    // Check if body exists for methods that should have one
    if (!req.body || Object.keys(req.body).length === 0) {
      throw new BadRequestException('Request body is required');
    }

    // Basic validation - ensure body is valid JSON
    try {
      // Body is already parsed by Express, but we can do additional checks here
      // For now, just ensure it's an object
      if (typeof req.body !== 'object' || req.body === null) {
        throw new BadRequestException('Invalid request body format');
      }
      
      next();
    } catch (error) {
      throw new BadRequestException('Invalid request body');
    }
  }
}
