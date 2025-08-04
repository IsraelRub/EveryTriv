# EveryTriv Project Structure

## Overview

The project follows a modular, feature-based architecture using NestJS for the backend and React with Redux Toolkit for the frontend.

## Backend Structure (server/)

```
server/
├── src/
│   ├── features/           # Feature modules
│   │   ├── trivia/        # Trivia game feature
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   ├── dtos/
│   │   │   ├── entities/
│   │   │   └── trivia.module.ts
│   │   ├── user/          # User management
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   ├── dtos/
│   │   │   ├── entities/
│   │   │   └── user.module.ts
│   │   └── auth/          # Authentication
│   │       ├── controllers/
│   │       ├── services/
│   │       ├── guards/
│   │       └── auth.module.ts
│   ├── shared/            # Shared code
│   │   ├── services/      # Common services
│   │   │   ├── ai/       # AI integration
│   │   │   └── cache/    # Redis caching
│   │   ├── modules/       # Shared modules
│   │   │   └── logger/   # Logging module
│   │   ├── middleware/    # Global middleware
│   │   ├── utils/        # Utility functions
│   │   └── types/        # Shared types
│   ├── config/           # Configuration
│   │   ├── app.config.ts
│   │   ├── database.config.ts
│   │   └── redis.config.ts
│   ├── constants/        # Global constants
│   ├── app.module.ts     # Main module
│   └── main.ts          # Application entry
├── database/            # Database scripts
│   └── init/           # Initialization
├── test/               # Test files
├── Dockerfile          # Container config
└── package.json

## Frontend Structure (client/)

```
client/
├── src/
│   ├── views/           # Feature screens
│   │   ├── trivia/     # Trivia game screens
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── types/
│   │   ├── user/       # User profile screens
│   │   └── home/       # Home and dashboard
│   ├── shared/         # Shared code
│   │   ├── components/ # Common UI components
│   │   ├── hooks/     # Custom React hooks
│   │   ├── services/  # API clients
│   │   └── types/     # Shared types
│   ├── redux/         # State management
│   │   ├── store.ts
│   │   ├── hooks.ts
│   │   └── features/  # Redux slices
│   ├── assets/        # Static files
│   ├── App.tsx
│   └── main.tsx
├── public/            # Public assets
├── Dockerfile         # Container config
└── package.json
```

## Key Features

### Backend

1. **Trivia Module**
   - Question generation using AI
   - Score tracking
   - Leaderboard management
   - Game history

2. **User Module**
   - Profile management
   - Progress tracking
   - Achievements

3. **Auth Module**
   - Authentication
   - Authorization
   - Session management

4. **Shared Services**
   - AI integration (OpenAI, Anthropic, etc.)
   - Caching with Redis
   - Logging service
   - Error handling

### Frontend

1. **Trivia Views**
   - Game interface
   - Question display
   - Answer submission
   - Score display

2. **User Views**
   - Profile management
   - Progress tracking
   - Settings

3. **Shared Components**
   - Loading states
   - Error boundaries
   - Common UI elements

4. **State Management**
   - Redux for global state
   - React Query for API state
   - Local state for UI

## Development Guidelines

1. **Code Organization**
   - Keep features modular and self-contained
   - Share common code through shared modules
   - Use proper TypeScript types

2. **State Management**
   - Use Redux for global application state
   - Use React Query for server state
   - Keep components focused

3. **Testing**
   - Write unit tests for services
   - Test components with React Testing Library
   - Use e2e tests for critical flows

4. **Documentation**
   - Document APIs with OpenAPI/Swagger
   - Keep README files up to date
   - Use JSDoc for complex functions

5. **Performance**
   - Implement proper caching
   - Optimize database queries
   - Use proper indexes
   - Lazy load components