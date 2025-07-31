# Development Guidelines

## Code Style

1. **TypeScript Best Practices**
   - Use strict type checking
   - Avoid `any` type
   - Use interfaces for data structures
   - Use enums for constants
   - Use type guards when necessary

2. **NestJS Patterns**
   - Follow dependency injection principles
   - Use decorators appropriately
   - Implement proper exception filters
   - Use pipes for validation
   - Use guards for authorization

3. **File Organization**
   ```typescript
   // Imports order
   import { NestJS imports } from '@nestjs/common';
   import { Third party imports } from 'package';
   import { Local imports } from './local';
   ```

## Database

1. **Entity Design**
   - Use TypeORM decorators
   - Define proper relations
   - Use migrations for schema changes
   - Include proper indices

2. **Query Optimization**
   - Use repository pattern
   - Implement proper relations
   - Use QueryBuilder for complex queries
   - Cache when appropriate

## API Design

1. **RESTful Principles**
   - Use proper HTTP methods
   - Return appropriate status codes
   - Version your APIs
   - Use proper error responses

2. **DTOs**
   - Define request/response DTOs
   - Use class-validator decorators
   - Keep DTOs simple and focused
   - Document with Swagger

## Testing

1. **Unit Tests**
   ```typescript
   describe('ServiceName', () => {
     it('should do something', () => {
       // Arrange
       // Act
       // Assert
     });
   });
   ```

2. **E2E Tests**
   - Test complete flows
   - Use test database
   - Clean up after tests
   - Mock external services

## Error Handling

1. **Exception Hierarchy**
   ```typescript
   export class CustomException extends HttpException {
     constructor(message: string) {
       super(message, HttpStatus.BAD_REQUEST);
     }
   }
   ```

2. **Error Responses**
   ```json
   {
     "status": 400,
     "message": "Validation failed",
     "errors": [
       {
         "field": "email",
         "message": "Invalid email format"
       }
     ]
   }
   ```

## Performance

1. **Caching Strategy**
   - Use Redis for distributed caching
   - Cache expensive operations
   - Implement proper cache invalidation
   - Use appropriate TTLs

2. **Query Optimization**
   - Use proper indices
   - Implement pagination
   - Optimize N+1 queries
   - Use proper relations

## Security

1. **Authentication**
   - Use JWT tokens
   - Implement refresh tokens
   - Secure password storage
   - Rate limiting

2. **Authorization**
   - Role-based access control
   - Guard protected routes
   - Validate user permissions
   - Audit logging

## Deployment

1. **Environment Configuration**
   ```bash
   # .env.example
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=user
   DB_PASS=pass
   ```

2. **Build Process**
   ```bash
   # Production build
   npm run build
   npm run start:prod
   ```

## Documentation

1. **Code Documentation**
   ```typescript
   /**
    * Service description
    * @param param1 - Parameter description
    * @returns Return value description
    */
   ```

2. **API Documentation**
   - Use Swagger decorators
   - Document all endpoints
   - Include example requests/responses
   - Document error cases 