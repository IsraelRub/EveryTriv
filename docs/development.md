# EveryTriv - API וגיידליינים לפיתוח

## מדריך התחלה מהירה

### התקנה והפעלה
```bash
# שכפול הפרויקט
git clone https://github.com/IsraelRub/EveryTriv.git
cd EveryTriv

# התקנת dependencies
npm install --legacy-peer-deps

# הפעלת סביבת פיתוח (client + server)
npm run start:dev

# או בנפרד:
cd server && npm run start:dev  # Backend על port 3000
cd client && npm run dev       # Frontend על port 5173
```

### קונפיגורציה
צרו קובץ `.env` בתיקיית השורש עם:
```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/everytriv
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=your_username
DATABASE_PASSWORD=your_password
DATABASE_NAME=everytriv

# Redis
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=1d

# AI Providers
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
GOOGLE_AI_API_KEY=your-google-ai-api-key

# App Configuration
NODE_ENV=development
PORT=3000
```

## API Documentation

### Authentication Endpoints

#### POST /auth/register
רישום משתמש חדש
```typescript
Request Body:
{
  username: string;
  email: string;
  password: string;
}

Response:
{
  access_token: string;
  user: {
    id: string;
    username: string;
    email: string;
    credits: number;
    role: string;
  }
}
```

#### POST /auth/login
כניסה למערכת
```typescript
Request Body:
{
  username: string;
  password: string;
}

Response:
{
  access_token: string;
  user: UserProfile;
}
```

#### GET /auth/profile
קבלת פרופיל משתמש (דורש authentication)
```typescript
Headers:
Authorization: Bearer <jwt_token>

Response:
{
  id: string;
  username: string;
  email: string;
  score: number;
  credits: number;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Trivia Endpoints

#### POST /trivia/generate
יצירת שאלת טריוויה
```typescript
Request Body:
{
  topic: string;
  difficulty: string;
  questionCount: number; // 3, 4, או 5
  userId?: string;
}

Response:
{
  data: {
    id: string;
    topic: string;
    difficulty: string;
    question: string;
    answers: Array<{
      text: string;
      isCorrect: boolean;
    }>;
    correctAnswerIndex: number;
    metadata?: {
      actualDifficulty?: string;
      questionCount?: number;
      customDifficultyMultiplier?: number;
    };
  }
}
```

#### POST /trivia/submit
שליחת תשובה לשאלה
```typescript
Request Body:
{
  questionId: string;
  userAnswer: string;
  timeSpent?: number;
  gameMode: 'time-limited' | 'question-limited' | 'unlimited';
}

Response:
{
  data: {
    isCorrect: boolean;
    correctAnswer: string;
    score: number;
    totalScore: number;
    explanation?: string;
  }
}
```

#### GET /trivia/history
היסטוריית משחקים של משתמש
```typescript
Query Parameters:
- page?: number (default: 1)
- limit?: number (default: 10)
- topic?: string
- difficulty?: string

Response:
{
  data: Array<{
    id: string;
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    difficulty: string;
    topic: string;
    gameMode: string;
    timeSpent: number;
    creditsUsed: number;
    createdAt: Date;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }
}
```

### User Endpoints

#### GET /users/stats
סטטיסטיקות משתמש
```typescript
Response:
{
  data: {
    totalQuestions: number;
    correctAnswers: number;
    successRate: number;
    currentStreak: number;
    bestStreak: number;
    topicsPlayed: Record<string, number>;
    difficultyStats: Record<string, {
      correct: number;
      total: number;
      successRate: number;
    }>;
    lastPlayed: Date;
  }
}
```

#### GET /users/leaderboard
לוח תוצאות
```typescript
Query Parameters:
- period?: 'daily' | 'weekly' | 'monthly' | 'all-time' (default: 'all-time')
- limit?: number (default: 10)

Response:
{
  data: Array<{
    userId: string;
    username: string;
    score: number;
    avatar?: string;
    rank: number;
  }>
}
```

#### PUT /users/profile
עדכון פרופיל משתמש
```typescript
Request Body:
{
  fullName?: string;
  avatar?: string;
  preferences?: {
    theme: 'light' | 'dark';
    soundEnabled: boolean;
    musicEnabled: boolean;
    notifications: boolean;
  };
}

Response:
{
  data: UserProfile;
}
```

### Custom Difficulty Endpoints

#### POST /custom-difficulty/validate
ולידציה של תיאור קושי מותאם
```typescript
Request Body:
{
  description: string;
}

Response:
{
  data: {
    isValid: boolean;
    multiplier: number;
    suggestions: string[];
    errors?: Array<{
      message: string;
      suggestion?: string;
      position: {
        start: number;
        end: number;
      };
    }>;
  }
}
```

#### GET /custom-difficulty/suggestions
הצעות לקושי מותאם לפי נושא
```typescript
Query Parameters:
- topic: string

Response:
{
  data: {
    suggestions: string[];
    categories: string[];
  }
}
```

## טיפוסי TypeScript משותפים

### Core Types
```typescript
// shared/types/core.types.ts

export interface TriviaQuestion {
  id: string;
  topic: string;
  difficulty: string;
  question: string;
  answers: TriviaAnswer[];
  correctAnswerIndex: number;
  createdAt: Date;
  metadata?: {
    actualDifficulty?: string;
    questionCount?: number;
    customDifficultyMultiplier?: number;
  };
}

export interface TriviaAnswer {
  text: string;
  isCorrect: boolean;
}

export type GameMode = 'time-limited' | 'question-limited' | 'unlimited';
export type QuestionCount = 3 | 4 | 5;

export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Array<{
    message: string;
    suggestion?: string;
    position: {
      start: number;
      end: number;
    };
  }>;
}
```

### Game Types
```typescript
// client/src/shared/types/game.types.ts

export interface GameState {
  trivia: TriviaQuestion | null;
  loading: boolean;
  error: string;
  score: number;
  total: number;
  selected: number | null;
  streak: number;
  gameMode: {
    mode: GameMode;
    timeLimit?: number;
    questionLimit?: number;
    timeRemaining?: number;
    questionsRemaining?: number;
    isGameOver: boolean;
    timer: {
      isRunning: boolean;
      startTime: number | null;
      timeElapsed: number;
    }
  };
}
```

## קבועים משותפים

### Game Constants
```typescript
// shared/constants/game.constants.ts

export const DIFFICULTY_LEVELS = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
} as const;

export const DIFFICULTY_MULTIPLIERS = {
  [DIFFICULTY_LEVELS.EASY]: 1,
  [DIFFICULTY_LEVELS.MEDIUM]: 1.5,
  [DIFFICULTY_LEVELS.HARD]: 2,
  CUSTOM_DEFAULT: 1.3,
} as const;

export const VALID_QUESTION_COUNTS = [3, 4, 5] as const;

export const VALIDATION_LIMITS = {
  TOPIC: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 100,
  },
  CUSTOM_DIFFICULTY: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 200,
  },
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 30,
  },
  PASSWORD: {
    MIN_LENGTH: 8,
  },
} as const;
```

## גיידליינים לפיתוח

### מבנה קוד
- **Features מבוססי תחום**: ארגון לפי לוגיקה עסקית, לא לפי סוג קובץ
- **Shared קוד**: קוד משותף בתיקיית shared/
- **Type Safety**: כיסוי מלא של TypeScript
- **Component Structure**: עקרונות Atomic Design

### תקנים לקוד
```typescript
// שמות משתנים ופונקציות: camelCase
const userName = 'john_doe';
const calculateScore = () => {};

// שמות interfaces ו-types: PascalCase
interface UserProfile {}
type GameMode = 'limited' | 'unlimited';

// שמות קבועים: UPPER_SNAKE_CASE
const MAX_QUESTIONS = 50;

// שמות קבצים: kebab-case
// user-profile.component.tsx
// trivia-service.ts
```

### State Management
- **Redux Toolkit**: state גלובלי
- **React Hooks**: state מקומי של רכיבים
- **React Query**: ניהול server state
- **Form State**: Controlled components עם validation

### Testing Strategy
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage
```

### Performance Best Practices
- **Code Splitting**: שימוש ב-React.lazy
- **Bundle Optimization**: Tree shaking
- **Database**: אינדקסים מתאימים
- **Caching**: מטמון רב-שכבתי

### Error Handling
```typescript
// Client-side error handling
try {
  const response = await apiService.generateTrivia(request);
  // handle success
} catch (error) {
  if (error.response?.status === 429) {
    // Rate limit exceeded
  } else if (error.response?.status === 401) {
    // Unauthorized
  } else {
    // Generic error
  }
}

// Server-side error handling
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    // Log error and return appropriate response
  }
}
```

## Deployment

### Development Environment
```bash
# Docker development
docker-compose -f docker-compose.local.yaml up

# Manual development
npm run start:dev
```

### Production Environment
```bash
# Build for production
npm run build

# Start production server
npm run start:prod

# Docker production
docker-compose -f docker-compose.yaml up -d
```

### Environment Variables (Production)
```env
NODE_ENV=production
DATABASE_URL=postgresql://prod_user:prod_pass@db_host:5432/everytriv_prod
REDIS_URL=redis://redis_host:6379
JWT_SECRET=very-secure-production-secret
OPENAI_API_KEY=prod-openai-key
# ... additional production configs
```

## Monitoring ו-Debugging

### Logging
```typescript
// Using the logger service
logger.info('User logged in', { userId, username });
logger.error('Database connection failed', { error });
logger.debug('Cache hit', { key, value });
```

### Performance Monitoring
- Response times
- Database query performance
- Cache hit rates
- Memory usage
- Error rates

### Debugging Tools
- **Server**: Winston logs, NestJS built-in debugger
- **Client**: Redux DevTools, React Developer Tools
- **Database**: pgAdmin, query logging
- **Redis**: Redis CLI, Redis Insight

## הרחבות עתידיות

### תכונות מתוכננות
- Multiplayer real-time games
- Voice questions ו-answers
- Custom question creation
- Advanced analytics dashboard
- Mobile application

### שיפורים טכניים
- GraphQL API במקום REST
- Microservices architecture
- Real-time notifications עם WebSockets
- Advanced caching strategies
- Machine learning for question difficulty
