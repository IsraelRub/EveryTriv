import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware that checks the user's role
 * Validates if user is admin or regular user as shown in the architecture diagram
 */
@Injectable()
export class RoleCheckMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Get token from the request
    const token = req.headers.authorization?.split(' ')[1];
    
    if (token) {
      try {
        // In a real implementation, you would decode the token and check roles
        // This is a simplified example that mimics the diagram's "check role - admin? user? no body?" logic
        
        // For now we'll assume the role is in the request
        const userRole = req.headers['x-user-role'] as string || 'user';
        
        // Set role in request object for controllers to use
        (req as any).userRole = userRole;
        
        // If no userRole (no body in diagram terms)
        if (!userRole) {
          return res.status(403).json({ message: 'No role provided' });
        }
      } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
      }
    }
    
    next();
  }
}
