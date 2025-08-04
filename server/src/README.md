# Trivia Game Application

A NestJS-based trivia game application with user management, authentication, and real-time game features.

## Project Structure

The application is organized into several main directories, each serving a specific purpose:

### Core Directory (/)

The main application root that ties together all features, shared code, and configuration:

- `app.module.ts` - Main NestJS module
- `main.ts` - Application entry point
- `app.controller.ts` - Core application controller (consider moving to features/core)

### Config Directory (/config)

Contains configuration files and modules for the application:

- `app.config.ts` - Main application configuration
- `database.config.ts` - Database (TypeORM) configuration
- `redis.config.ts` - Redis configuration
- `redis.module.ts` / `redis.service.ts` - Redis integration
- `global-exception.filter.ts` - Global error handling

### Constants Directory (/constants)

Contains application-wide constants and enums:

- `app.constants.ts` - Application-wide constants (e.g., API versions, cache TTLs)
- Other constant definitions used across features

### Features Directory (/features)

Contains all the main business features of the application, organized by domain:

#### Auth Feature (/features/auth)
Handles authentication and authorization logic:
- `controllers/` - Auth API endpoints (login, register, etc.)
- `services/` - Business logic for authentication
- `guards/` - Route guards for protecting endpoints
- `types/` - Auth-related types and DTOs
- `auth.module.ts` - NestJS module for the auth feature

#### User Feature (/features/user)
Handles user management:
- `controllers/` - User API endpoints (profile, etc.)
- `services/` - Business logic for user management
- `user.module.ts` - NestJS module for the user feature

#### Trivia Feature (/features/trivia)
Handles trivia game logic:
- `controllers/` - Trivia API endpoints (questions, history, leaderboard, etc.)
- `services/` - Business logic for trivia
- `trivia.module.ts` - NestJS module for the trivia feature
- `queue.module.ts` - Queue logic for trivia processing

### Shared Directory (/shared)

Contains code shared across multiple features:

- `entities/` - TypeORM entities (UserEntity, TriviaEntity)
- `middleware/` - Global or reusable middleware (rate limiting, authentication)
- `types/` - Shared TypeScript types and DTOs

## Key Features

1. **Authentication & Authorization**
   - User registration and login
   - JWT-based authentication
   - Role-based access control
   - Password reset functionality

2. **User Management**
   - User profiles
   - Score tracking
   - User data management

3. **Trivia Game**
   - Dynamic question generation with LLM providers (OpenAI, Anthropic)
   - Score tracking and history
   - Leaderboard system
   - Priority queue for question processing
   - Redis caching for performance

4. **Infrastructure**
   - Redis caching
   - PostgreSQL database
   - Rate limiting
   - Health monitoring
   - Global error handling

## Development Guidelines

1. **Modular Structure**
   - Each feature is self-contained with its own module, controllers, and services
   - Shared code is centralized in the shared directory
   - Configuration is isolated in the config directory
   - Constants are maintained in a dedicated directory

2. **Dependency Management**
   - Features can depend on shared code
   - Features should not directly depend on other features (use interfaces/services)
   - Configuration should be environment-aware
   - Use relative imports for better maintainability

3. **Scalability**
   - Each feature can be scaled independently
   - Redis caching improves performance
   - Queue system handles heavy processing
   - LLM providers can be easily switched or load balanced

4. **Security**
   - Global rate limiting
   - JWT authentication
   - Role-based access control
   - Secure password handling
   - Environment-based configuration 