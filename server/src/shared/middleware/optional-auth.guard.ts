import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

/**
 * Guard that authenticates users if a token is present, but doesn't reject the request if no token is provided
 * Used for endpoints that can work with or without authentication
 */
@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // Extract token from header
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token, but that's OK - continue as unauthenticated
      return true;
    }

    const token = authHeader.split(' ')[1];
    
    // Try to verify token but don't block if invalid
    try {
      const payload = await this.jwtService.verifyAsync(token);
      // Add user to request if valid
      request.user = payload;
    } catch (e) {
      // Invalid token, but that's OK - continue as unauthenticated
    }

    return true;
  }
}
