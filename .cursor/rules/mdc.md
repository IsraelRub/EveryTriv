# Applies to: server/**/_.{ts}

## ✅ Project Structure

- All source code must reside under the `src/` directory.
- Use feature-based modules: `features/`, `shared/`, `config/`, `constants/`.
- Each feature module should be self-contained with its own controllers, services, and DTOs.

## 🔧 TypeScript

- Always use TypeScript with `"strict": true` mode.
- Do not use `any`; prefer `unknown` with proper type refinement.
- Type all function inputs and outputs explicitly.
- Store shared types in `shared/types/`.
- Use TypeORM decorators for entity definitions.

## 🌐 API Design

- Use NestJS decorators for route definitions (`@Controller`, `@Get`, etc.).
- Keep business logic in services, not controllers.
- Use DTOs for request/response validation.
- Follow RESTful principles.
- Use OpenAPI/Swagger decorators for API documentation.

## 📦 Required Packages

Core:
- @nestjs/common
- @nestjs/core
- @nestjs/platform-express
- @nestjs/typeorm
- @nestjs/config
- typeorm
- class-validator
- class-transformer
- winston (for logging)

Optional:
- @nestjs/swagger
- @nestjs/caching
- @nestjs/schedule
- @nestjs/websockets

## 🧪 Testing

- Use Jest with `@nestjs/testing` for unit tests.
- Test services and controllers independently.
- Use e2e tests for full feature testing.
- Mock dependencies using NestJS's dependency injection.

## 📁 Module Structure

Each feature module should contain:
- `controllers/` – Route handlers and request/response logic
- `services/` – Business logic
- `dtos/` – Data transfer objects for validation
- `entities/` – TypeORM entities
- `types/` – Feature-specific types and interfaces
- `{feature}.module.ts` – Module definition

Shared code:
- `shared/services/` – Common services (logging, caching, etc.)
- `shared/utils/` – Utility functions
- `shared/types/` – Global types
- `shared/middleware/` – Global middleware
- `shared/modules/` – Reusable modules

## 🚀 Scripts

- `"start:dev"` – Run in development mode with hot reload
- `"build"` – Compile TypeScript
- `"start:prod"` – Run compiled code in production
- `"test"` – Run unit tests
- `"test:e2e"` – Run end-to-end tests

## 🔐 Security

- Use environment variables for sensitive data
- Implement proper authentication/authorization
- Validate all inputs using class-validator
- Use proper CORS configuration
- Implement rate limiting
- Use Helmet for security headers

## 🌟 Best Practices

- Follow Single Responsibility Principle
- Use dependency injection
- Keep controllers thin, services thick
- Use custom decorators for common functionality
- Implement proper error handling
- Use logging service instead of console.log
- Cache expensive operations
- Use TypeORM repositories for database operations

## 🎨 Code Style

- Use PascalCase for classes and interfaces
- Use camelCase for variables and functions
- Use UPPER_CASE for constants
- Use kebab-case for file names
- Add JSDoc comments for public APIs
- Follow NestJS naming conventions

## 🔄 State Management

- Use TypeORM repositories for database state
- Use Redis for caching and session storage
- Implement proper transaction handling
- Use event emitters for cross-module communication

## 📝 Documentation

- Use JSDoc comments for all public methods
- Document environment variables
- Keep README.md up to date
- Use OpenAPI/Swagger for API documentation
- Document database schema changes

# Applies to: client/**/_.{ts,tsx}

## ✅ Project Structure

- All source code must reside under the `src/` directory.
- Use feature-based organization:
  src/
  ├── redux/             # All state slices
  ├── shared/
  │   ├── components/
  │   │   ├── ui/
  │   │   ├── layout/
  │   │   └── game/
  │   ├── hooks/
  │   ├── services/
  │   ├── utils/
  │   ├── types/
  │   └── constants/
  ├── views/             # Thin route-level components
  └── App.tsx

## 🔧 TypeScript

- Always use TypeScript with `"strict": true` mode.
- Do not use `any`; prefer `unknown` with proper type refinement.
- Type all props and state explicitly.
- Store shared types in `shared/types/`.
- Use proper type imports/exports.

## 🎨 Component Design

- Use functional components with hooks.
- Keep components focused and reusable.
- Use proper prop typing with interfaces.
- Implement proper error boundaries.
- Use React.memo for performance optimization.

## 📦 Required Packages

Core:
- react
- react-dom
- react-router-dom
- @reduxjs/toolkit
- react-redux
- typescript
- vite
- lucide-react

Optional:
- react-query
- react-hook-form
- tailwindcss
- axios
- date-fns

## 🧪 Testing

- Use Vitest for unit testing
- Use React Testing Library for component testing
- Test hooks independently
- Mock API calls and Redux store

## 📁 Folder Structure

- `views/` – Main feature screens
  - Each feature in its own directory
  - Components specific to the feature
  - Feature-specific hooks and utils
  
- `shared/` – Reusable code
  - `components/` – Common UI components
  - `hooks/` – Custom React hooks
  - `utils/` – Utility functions
  - `types/` – Shared TypeScript types
  - `services/` – API clients and services

- `redux/` – State management
  - `store.ts` – Store configuration
  - `hooks.ts` – Typed hooks
  - `features/` – Redux slices
  - `middleware/` – Custom middleware

- `assets/` – Static files
  - Images, icons, fonts, etc.

## 🚀 Scripts

- `"dev"` – Run development server
- `"build"` – Build for production
- `"preview"` – Preview production build
- `"test"` – Run tests
- `"lint"` – Run ESLint
- `"format"` – Run Prettier

## 🔐 Security

- Sanitize user inputs
- Use environment variables for sensitive data
- Implement proper authentication handling
- Use HTTPS for API calls
- Validate data from APIs

## 🌟 Best Practices

### Components
- Keep components small and focused
- Use proper prop typing
- Implement error boundaries
- Use React.memo when needed
- Follow composition over inheritance

### State Management
- Use Redux Toolkit for global state
- Use local state for UI-only state
- Implement proper loading states
- Handle errors gracefully
- Use selectors for derived state

### Performance
- Lazy load routes and components
- Use proper key props in lists
- Optimize re-renders
- Use proper image formats and sizes
- Implement proper caching

### Hooks
- Follow hooks rules
- Create custom hooks for reusable logic
- Use proper dependency arrays
- Handle cleanup in useEffect
- Use proper hook naming

## 🎨 Code Style

- Use PascalCase for components
- Use camelCase for variables and functions
- Use UPPER_CASE for constants
- Use kebab-case for file names
- Add JSDoc comments for complex logic

## 🔄 Data Flow

- Use Redux for global state
- Use React Query for server state
- Implement proper loading states
- Handle errors gracefully
- Use proper TypeScript types

## 📝 Documentation

- Document complex components
- Document custom hooks
- Keep README.md up to date
- Document environment variables
- Use proper JSDoc comments