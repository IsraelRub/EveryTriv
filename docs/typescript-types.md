# TypeScript Type System Documentation

## Overview

EveryTriv implements a comprehensive TypeScript type system to ensure type safety, improve developer experience, and prevent runtime errors. This document outlines our approach to TypeScript types and interfaces across both client and server.

## Type Organization

### Core Type Structure

All shared types are organized in the following directories:

#### Client
```
client/src/shared/types/
├── index.ts            # Common shared types and re-exports
├── api.types.ts        # API response and request types
├── trivia.types.ts     # Trivia game related types
├── user.types.ts       # User profile related types
├── stats.types.ts      # Statistics and tracking types
└── audio.ts            # Audio system types
```

#### Server
```
server/src/shared/types/
├── index.ts            # Common shared types and re-exports
├── trivia.types.ts     # Trivia domain types
├── user.types.ts       # User domain types
├── llm.types.ts        # Language model types
└── api.types.ts        # API interfaces
```

## Type Sharing Strategy

To maintain consistency between frontend and backend, we follow these principles:

1. **Domain Types**: Core domain types are defined in one place and shared
2. **Extension Types**: Layer-specific extensions add properties as needed
3. **Validation Types**: DTOs handle validation concerns separately from domain types

## Key Shared Types

### Trivia Domain

```typescript
// Basic types shared across client and server
export type QuestionCount = 3 | 4 | 5;

export interface TriviaAnswer {
  text: string;
  isCorrect: boolean;
}

export interface TriviaQuestion {
  id: string;
  topic: string;
  difficulty: string;
  question: string;
  answers: TriviaAnswer[];
  correctAnswerIndex: number;
  createdAt: Date;
}
```

### User Domain

```typescript
export interface User {
  id: string;
  username: string;
  avatar?: string;
  score: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserStats {
  id: string;
  userId: string;
  topicsPlayed: Record<string, number>;
  difficultyStats: Record<string, { correct: number; total: number }>;
  totalQuestions: number;
  correctAnswers: number;
  lastPlayed: Date;
}
```

### API Responses

```typescript
export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

export interface ErrorResponse {
  status: number;
  message: string;
  errors?: string[];
}
```

## Type Safety Best Practices

1. **Strict Null Checks**
   - Always handle potential null/undefined values
   - Use optional chaining and nullish coalescing

2. **Discriminated Unions**
   - For state management (loading/success/error)
   - For different types of game modes

3. **Type Guards**
   - Use custom type guards to narrow types
   - Implement runtime type checking when needed

4. **Generic Types**
   - Use generics for reusable components
   - Apply constraints to limit generic types

5. **Utility Types**
   - Use TypeScript utility types (Pick, Omit, Partial)
   - Create custom mapped types for specific needs

## Common Type Patterns

### State Management Types

```typescript
// Loading state pattern
type LoadingState<T> = 
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string };

// Example usage
type UserState = LoadingState<User>;
```

### Component Props Pattern

```typescript
// Base props that many components share
interface BaseComponentProps {
  className?: string;
  testId?: string;
}

// Specific component extending base props
interface ButtonProps extends BaseComponentProps {
  variant: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  onClick: () => void;
}
```

### Configuration Types

```typescript
// Environment configuration type
interface AppConfig {
  apiUrl: string;
  environment: 'development' | 'staging' | 'production';
  features: {
    enableAudio: boolean;
    enableAnimations: boolean;
    debugMode: boolean;
  };
}
```

## Type Documentation

All complex types should include JSDoc comments explaining:

```typescript
/**
 * Represents a user's game statistics
 * @property topicsPlayed - Record of topics played and count
 * @property difficultyStats - Success rate by difficulty level
 * @property streaks - Current and best answer streaks
 */
export interface GameStats {
  totalGames: number;
  correctAnswers: number;
  topicsPlayed: Record<string, number>;
  difficultyStats: Record<string, { correct: number; total: number }>;
  streaks: {
    current: number;
    best: number;
  };
}
```

## Type Validation

### Frontend Validation

- Zod schema for form validation
- Type guards for runtime checks
- PropTypes for component validation

### Backend Validation

- Class-validator decorators
- Pipes for request validation
- DTO transformation

## Managing Breaking Changes

When making changes to shared types:

1. Consider backward compatibility
2. Use versioning when necessary
3. Add deprecation comments
4. Document migration steps

## Type Evolution

As the application grows:

1. Monitor type complexity
2. Refactor to simpler types when needed
3. Split complex types into domain-specific files
4. Consider generated types from API specs
