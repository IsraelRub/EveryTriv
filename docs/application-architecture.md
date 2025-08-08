# Application Architecture in EveryTriv

This document provides a comprehensive overview of the application architecture in EveryTriv, covering both frontend and backend aspects, data flow, state management, and system integration.

## Table of Contents

1. [System Overview](#system-overview)
2. [Frontend Architecture](#frontend-architecture)
3. [Backend Architecture](#backend-architecture)
4. [Data Flow](#data-flow)
5. [State Management](#state-management)
6. [Database Architecture](#database-architecture)
7. [Caching Strategy](#caching-strategy)
8. [API Architecture](#api-architecture)
9. [Performance Optimizations](#performance-optimizations)
10. [Deployment Architecture](#deployment-architecture)

## System Overview

EveryTriv is a full-stack application with a React frontend and a NestJS backend, using PostgreSQL for data persistence and Redis for caching. The system follows a modern architecture with clear separation of concerns:

```
+------------------+            +------------------+            +------------------+
|                  |            |                  |            |                  |
|   React Client   |<---------->|   NestJS API     |<---------->|   PostgreSQL     |
|                  |    HTTP    |                  |    SQL     |   Database       |
+------------------+            +------------------+            +------------------+
                                       ^
                                       |
                                       v
                                +------------------+
                                |                  |
                                |   Redis Cache    |
                                |                  |
                                +------------------+
```

## Frontend Architecture

The frontend follows a modular architecture with clear separation of concerns:

### Component Structure

```
src/
├── assets/            # Static assets (images, fonts, etc.)
├── redux/             # Redux state management
│   ├── store.ts       # Root store configuration
│   ├── hooks.ts       # Redux hooks (useAppDispatch, useAppSelector)
│   └── features/      # Redux slices
│       ├── gameSlice.ts
│       ├── statsSlice.ts
│       ├── userSlice.ts
│       └── favoritesSlice.ts
├── shared/            # Shared utilities and components
│   ├── components/    # UI components
│   ├── context/       # React context providers
│   ├── hooks/         # Custom hooks
│   ├── services/      # API services
│   ├── types/         # TypeScript types
│   └── utils/         # Utility functions
├── views/             # Page components
│   ├── home/          # Home page
│   └── user/          # User profile page
├── App.tsx            # Root component
├── AppRoutes.tsx      # Route definitions
└── main.tsx          # Application entry point
```

### Component Hierarchy

```mermaid
graph TD
    A[App] --> B[AppRoutes]
    B --> C[HomeView]
    B --> D[UserProfile]
    B --> E[NotFound]
    C --> F[TriviaForm]
    C --> G[TriviaGame]
    C --> H[FavoriteTopics]
    C --> I[Leaderboard]
    C --> J[ScoringSystem]
    C --> K[CustomDifficultyHistory]
```

### State Management

The frontend uses Redux Toolkit for global state management with the following slices:

- **Game Slice**: Manages game state, trivia questions, and user interactions
- **Stats Slice**: Manages user statistics and achievements
- **User Slice**: Manages user information and preferences
- **Favorites Slice**: Manages favorite topics and recently used items

## Backend Architecture

The backend is built with NestJS and follows a modular architecture:

### Module Structure

```
src/
├── app.module.ts      # Root module
├── app.controller.ts  # Root controller
├── main.ts            # Application entry point
├── common/            # Common utilities
│   └── validation/    # Validation logic
├── config/            # Configuration modules
│   ├── app.config.ts
│   ├── database.config.ts
│   └── redis.config.ts
├── constants/         # Application constants
├── features/          # Feature modules
│   ├── auth/          # Authentication
│   ├── trivia/        # Trivia game logic
│   └── user/          # User management
└── shared/            # Shared resources
    ├── entities/      # Database entities
    ├── middleware/    # HTTP middleware
    ├── modules/       # Shared modules
    ├── services/      # Shared services
    ├── types/         # TypeScript types
    └── utils/         # Utility functions
```

### Module Hierarchy

```mermaid
graph TD
    A[AppModule] --> B[TriviaModule]
    A --> C[AuthModule]
    A --> D[UserModule]
    A --> E[RedisModule]
    B --> F[TriviaService]
    B --> G[TriviaController]
    C --> H[AuthService]
    C --> I[AuthController]
    D --> J[UserService]
    D --> K[UserController]
```

## Data Flow

### Frontend to Backend Flow

1. **UI Event**: User interacts with the UI (e.g., submits a form)
2. **Component Handler**: Component handles the event and calls a service or dispatches a Redux action
3. **API Service**: Service makes an API call to the backend
4. **Redux**: State is updated based on the response
5. **UI Update**: Components re-render with the new state

### Backend Data Flow

1. **HTTP Request**: Request arrives at the NestJS controller
2. **Middleware**: Request passes through global and route-specific middleware
3. **Controller**: Controller handles the request and calls a service
4. **Service**: Service processes the request, interacting with the database or cache
5. **Response**: Controller returns a response to the client

## State Management

### Frontend State

The application uses a combination of state management approaches:

1. **Redux**: Global application state (user, game, stats, favorites)
2. **React Context**: Context-specific state (audio context)
3. **Local Component State**: UI-specific state (form inputs, loading indicators)

### Backend State

The backend maintains state through:

1. **Database**: Persistent data storage in PostgreSQL
2. **Redis**: In-memory cache for frequently accessed data
3. **Session**: User session data (authentication)

## Database Architecture

### PostgreSQL Architecture

The PostgreSQL database uses:

- **JSONB fields** for flexible schema data
- **Full-text search** for efficient text searches
- **Composite indexes** for optimized queries
- **Foreign key constraints** for data integrity

### Data Models

Key data models include:

- **Users**: User information and preferences
- **Trivia Questions**: Question bank with answers and metadata
- **User Stats**: User gameplay statistics and achievements
- **History**: User gameplay history

## Caching Strategy

The application implements a multi-level caching strategy:

1. **Browser Local Storage**: Client-side caching for user preferences and session data
2. **Redis**: Server-side caching for:
   - Frequently accessed trivia questions
   - User statistics
   - Session data
3. **Application Memory Cache**: In-memory caching for frequently used data structures

### Redis as Middle Layer

Redis serves as a middle layer between the application and the database:

```
Client Request --> Check Redis Cache --> If hit: Return cached data
                                     --> If miss: Query database --> Update Redis --> Return data
```

## API Architecture

### REST API Design

The API follows RESTful principles with:

- **Resource-based URLs**: `/trivia`, `/users`, etc.
- **HTTP Methods**: GET, POST, PUT, DELETE
- **Status Codes**: Proper use of HTTP status codes
- **Error Handling**: Consistent error response format

### API Endpoints

Key endpoints include:

- **/trivia**: Get trivia questions, submit answers
- **/users**: User management (profile, preferences)
- **/stats**: User statistics and achievements
- **/auth**: Authentication and authorization

## Performance Optimizations

The application implements several performance optimizations:

### Frontend Optimizations

- **Code Splitting**: Lazy loading of routes and components
- **Memoization**: React.memo, useMemo, and useCallback for optimized rendering
- **Virtualization**: For long lists
- **Asset Optimization**: Optimized images and assets

### Backend Optimizations

- **Redis Caching**: To reduce database load
- **Query Optimization**: Efficient database queries
- **Connection Pooling**: For database connections
- **Data Structure Optimization**: Efficient data structures for specific use cases:
  - Binary Heap Priority Queue
  - LRU Cache (Doubly Linked List + Hash Map)
  - Trie (for autocomplete)
  - Circular Buffer (for recent items)

## Deployment Architecture

The application is containerized using Docker:

```
+------------------+            +------------------+
|                  |            |                  |
|   React Client   |<---------->|   NestJS API     |
|   (Docker)       |    HTTP    |   (Docker)       |
+------------------+            +------------------+
                                       ^
                                       |
                                       v
                      +------------------+            +------------------+
                      |                  |            |                  |
                      |   Redis Cache    |<---------->|   PostgreSQL     |
                      |   (Docker)       |            |   (Docker)       |
                      +------------------+            +------------------+
```

### Docker Compose

The `docker-compose.yaml` file orchestrates the containers:

```yaml
version: '3.8'
services:
  client:
    build: ./client
    ports:
      - "3000:80"
    depends_on:
      - server
  
  server:
    build: ./server
    ports:
      - "4000:4000"
    environment:
      - DATABASE_URL=postgres://postgres:password@postgres:5432/everytriv
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
  
  postgres:
    image: postgres:14
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=everytriv
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./server/database/init:/docker-entrypoint-initdb.d
  
  redis:
    image: redis:7
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

## Conclusion

The EveryTriv application architecture follows modern best practices with a clear separation of concerns, modular design, and efficient data flow. The architecture enables:

- **Scalability**: Through containerization and modular design
- **Performance**: Through multi-level caching and optimized data structures
- **Maintainability**: Through clear separation of concerns and code organization
- **Extensibility**: Through modular architecture and plugin-based design
