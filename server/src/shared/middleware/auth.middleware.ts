import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AuthService } from 'src/features/auth/services/auth.service';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly authService: AuthService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      throw new UnauthorizedException('No token provided');
    }

    const [type, token] = authHeader.split(' ');
    
    if (type !== 'Bearer') {
      throw new UnauthorizedException('Invalid token type');
    }

    try {
      const decoded = await this.authService.verifyToken(token);
      req['user'] = decoded;
      next();
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
