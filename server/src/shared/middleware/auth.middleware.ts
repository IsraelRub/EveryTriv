import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AuthService } from 'src/features/auth/services/auth.service';

/**
 * Middleware that checks if the user is logged in
 * As shown in the architecture diagram ("auth - if the user login or not")
 * This middleware doesn't block requests, it just identifies if user is logged in
 */
@Injectable()
export class AuthMiddleware implements NestMiddleware {
  private readonly logger = new Logger(AuthMiddleware.name);
  constructor(private readonly authService: AuthService) {}

  async use(req: Request & { user?: any }, _: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    
    // If no auth header, user is not logged in - continue without setting user
    if (!authHeader) {
      next();
      return;
    }

    const [type, token] = authHeader.split(' ');
    
    // Invalid token type - continue without setting user
    if (type !== 'Bearer') {
      this.logger.debug('Invalid token type');
      next();
      return;
    }

    try {
      // If token is valid, set user information on the request
      const decoded = await this.authService.verifyToken(token);
      req['user'] = decoded;
    } catch (error) {
      // Invalid token - continue without setting user
      this.logger.debug('Invalid token');
    }
    
    // Always proceed to next middleware/controller
    next();
  }
}
