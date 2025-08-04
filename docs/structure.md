# Project Structure

The application follows a modular, feature-based architecture using NestJS framework conventions.

## Directory Structure

```
src/
├── app.module.ts          # Main application module
├── main.ts               # Application entry point
├── features/            # Feature modules
│   ├── core/           # Core application features
│   │   ├── app.controller.ts
│   │   └── core.module.ts
│   ├── auth/           # Authentication feature
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── guards/
│   │   └── auth.module.ts
│   ├── user/           # User management feature
│   │   ├── controllers/
│   │   ├── services/
│   │   └── user.module.ts
│   └── trivia/         # Trivia game feature
│       ├── controllers/
│       ├── services/
│       ├── queue.module.ts
│       └── trivia.module.ts
├── shared/             # Shared code
│   ├── entities/       # Database entities
│   ├── middleware/     # Global middleware
│   └── types/         # Shared TypeScript types
├── config/            # Configuration
│   ├── app.config.ts
│   ├── database.config.ts
│   └── redis.config.ts
└── constants/         # Global constants
    └── app.constants.ts
```

## Module Organization

### Core Module
- Basic application functionality
- Health checks and root endpoints
- Global application setup

### Feature Modules
Each feature module is self-contained with its own:
- Controllers (API endpoints)
- Services (business logic)
- DTOs (data transfer objects)
- Types (TypeScript interfaces/types)
- Module definition

### Shared Code
- Entities: TypeORM database models
- Middleware: Global request processing
- Types: Shared TypeScript definitions

### Configuration
- Environment-based configuration
- Database and Redis setup
- Global application settings

### Constants
- Application-wide constants
- Feature-specific enums
- Configuration values

## Best Practices

1. **Module Independence**
   - Features should be self-contained
   - Minimize cross-feature dependencies
   - Use shared code for common functionality

2. **Code Organization**
   - Keep related code together
   - Use clear, consistent naming
   - Follow NestJS conventions

3. **File Naming**
   - Use kebab-case for files
   - Descriptive, purpose-indicating names
   - Consistent suffixes (.controller.ts, .service.ts, etc.)

4. **Import Organization**
   - Use relative paths within features
   - Use absolute paths for shared code
   - Group imports logically 