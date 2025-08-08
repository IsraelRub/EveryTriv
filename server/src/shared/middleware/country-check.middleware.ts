import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware that checks the country of the request
 * As shown in the architecture diagram ("check country")
 */
@Injectable()
export class CountryCheckMiddleware implements NestMiddleware {
  use(req: Request, _: Response, next: NextFunction) {
    // Get country from request headers or IP
    const country = req.headers['x-country'] as string || this.getCountryFromIP(req.ip || '');
    
    // Set country in request object for controllers to use
    (req as any).country = country;
    
    // Could implement country restrictions here if needed
    
    next();
  }
  
  private getCountryFromIP(_: string): string {
    // In a real implementation, you would use a geolocation service
    // This is a simplified example
    return 'unknown';
  }
}
