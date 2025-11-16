# מדריך פיתוח - EveryTriv

מדריך מקיף לפיתוח בפרויקט EveryTriv, כולל הגדרת סביבה, כלי פיתוח, Docker, גיידליינים לפיתוח, API documentation, בדיקות, debugging, וביצועים.

## דרישות מערכת

- **Node.js**: גרסה 18 ומעלה
- **pnpm**: מנהל חבילות (גרסה 8.15.0)
- **Git**: מערכת בקרת גרסאות
- **Docker**: גרסה 20.10 ומעלה (לפיתוח מקומי)
- **Docker Compose**: גרסה 2.0 ומעלה

## התקנה ראשונית

```bash
# שכפול הפרויקט
git clone <repository-url>
cd EveryTriv

# התקנת תלויות לכל החבילות
pnpm run install:all

# או התקנה נפרדת
pnpm run install:server
pnpm run install:client
pnpm run install:shared

# הגדרת משתני סביבה
# העתק את קבצי .env.example ל-.env בכל חבילה
cp server/.env.example server/.env
cp client/.env.example client/.env

# הפעלת מסד נתונים
docker-compose up -d postgres redis

# הרצת מיגרציות
cd server
pnpm run migration:run
```

## משתני סביבה נדרשים

### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:3002
VITE_APP_NAME=EveryTriv
```

### Backend (.env)
```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=everytriv
DATABASE_USERNAME=everytriv_user
DATABASE_PASSWORD=test123

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=R3d!s_Pr0d_P@ssw0rd_2025_S3cur3!

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=1h

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# AI Providers
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
GOOGLE_AI_API_KEY=your-google-key
MISTRAL_API_KEY=your-mistral-key

# Stripe
STRIPE_SECRET_KEY=your-stripe-key
STRIPE_WEBHOOK_SECRET=your-webhook-secret

# Port
PORT=3002
```

## Docker

### הפעלת סביבת פיתוח

```bash
# הפעלת כל השירותים
docker-compose up -d

# צפייה בלוגים
docker-compose logs -f

# צפייה בלוגים של שירות ספציפי
docker-compose logs -f server

# עצירת שירותים
docker-compose down

# בנייה מחדש של שירות
docker-compose build server

# הפעלה מחדש של שירות
docker-compose restart server
```

### תחזוקה

```bash
# ניקוי תמונות לא בשימוש
docker image prune -f

# ניקוי containers לא פעילים
docker container prune -f

# ניקוי volumes לא בשימוש
docker volume prune -f

# ניקוי מלא
docker system prune -a -f

# בדיקת שימוש במשאבים
docker stats
```

## כלי פיתוח

### Prettier

Prettier מעצב את הקוד אוטומטית.

**פקודות:**
```bash
# עיצוב כל הקבצים
pnpm run format

# בדיקה שהקוד מעוצב כראוי
pnpm run format:check
```

**קבצי הגדרה:**
- `tools/.prettierrc` - הגדרות Prettier
- `tools/.prettierignore` - קבצים להתעלם מהם

### ESLint

ESLint מנתח את הקוד לזיהוי שגיאות ובעיות.

**פקודות:**
```bash
# בדיקת שגיאות ובעיות
pnpm run lint

# תיקון אוטומטי של בעיות
pnpm run lint:fix

# בדיקת imports
pnpm run lint:imports
```

**קבצי הגדרה:**
- `tools/eslint.config.js` - הגדרות ESLint

### TypeScript

TypeScript מספק טיפוסים חזקים ובטיחות קוד.

**קבצי הגדרה:**
- `server/tsconfig.json` - הגדרות TypeScript לשרת
- `client/tsconfig.json` - הגדרות TypeScript ללקוח
- `shared/tsconfig.json` - הגדרות TypeScript לחבילה משותפת

**פקדים:**
```bash
# בדיקת טיפוסים
cd server && pnpm tsc --noEmit
cd client && pnpm tsc --noEmit
```

## פקודות זמינות

### עיצוב קוד
```bash
# עיצוב כל הקבצים בפרויקט
pnpm run format

# בדיקה שהקוד מעוצב כראוי
pnpm run format:check
```

### ניתוח קוד
```bash
# בדיקת שגיאות ובעיות בכל הפרויקט
pnpm run lint

# תיקון אוטומטי של בעיות שניתן לתקן
pnpm run lint:fix

# בדיקת imports
pnpm run lint:imports
```

### בדיקות
```bash
# הרצת כל הבדיקות
pnpm run test:all

# בדיקות שרת בלבד
pnpm run test:server

# בדיקות לקוח בלבד
pnpm run test:client
```

### בנייה
```bash
# בניית הפרויקט לייצור
pnpm run build:all

# בניית שרת בלבד
pnpm run build:server

# בניית לקוח בלבד
pnpm run build:client
```

### הפעלה
```bash
# הפעלת סביבת פיתוח
pnpm run start:dev

# הפעלה מקבילית
pnpm run start:dev:concurrent

# הפעלת שרת בלבד
pnpm run start:dev:server

# הפעלת לקוח בלבד
pnpm run start:dev:client
```

### ניקוי
```bash
# ניקוי כל הקבצים המובנים
pnpm run clean:all

# ניקוי cache
pnpm run clean:cache

# ניקוי שרת בלבד
pnpm run clean:server

# ניקוי לקוח בלבד
pnpm run clean:client
```

## גיידליינים לפיתוח

### TypeScript

#### הגדרות מומלצות
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

#### גיידליינים לטיפוסים
- השתמש בטיפוסים מפורשים במקום `any`
- השתמש ב-`unknown` עם type guards
- הגדר interfaces ו-types במקומות המתאימים
- השתמש ב-`@shared/types` לטיפוסים משותפים

### React Components

#### מבנה רכיב מומלץ - TriviaGame Component
```typescript
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { clientLogger as logger } from '@shared/services';
import { TriviaAnswer } from '@shared/types';
import { AudioKey, ButtonVariant, ComponentSize } from '../../constants';
import { useAppDispatch } from '../../hooks';
import { updateScore } from '../../redux/slices';
import { audioService } from '../../services';
import { TriviaGameProps } from '../../types';

export default function TriviaGame({ question, onComplete, timeLimit = 30 }: TriviaGameProps) {
  const dispatch = useAppDispatch();
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [timer, setTimer] = useState(timeLimit);
  const [answered, setAnswered] = useState(false);

  useEffect(() => {
    if (answered || timer <= 0) return;

    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [answered, timer]);

  const handleTimeout = () => {
    if (answered) return;
    audioService.play(AudioKey.ERROR);
    logger.gameError('Question timeout', { questionId: question.id });
    setAnswered(true);
    setTimeout(() => {
      onComplete(false, 0);
    }, 1500);
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (answered) return;
    audioService.play(AudioKey.BUTTON_CLICK);
    setSelectedAnswer(answerIndex);
  };

  const handleSubmit = () => {
    if (answered || selectedAnswer === null) return;
    setAnswered(true);
    const isCorrect = selectedAnswer === question.correctAnswerIndex;

    if (isCorrect) {
      const points = calculatePoints(question.difficulty, timer);
      dispatch(
        updateScore({
          score: points,
          timeSpent: 30 - timer,
          isCorrect: true,
          responseTime: 30 - timer,
        })
      );
      audioService.play(AudioKey.SUCCESS);
      logger.gameInfo('Correct answer', { questionId: question.id, points });
    } else {
      audioService.play(AudioKey.ERROR);
      logger.gameInfo('Incorrect answer', { questionId: question.id });
    }

    setTimeout(() => {
      onComplete(isCorrect, isCorrect ? points : 0);
    }, 1500);
  };

  return (
    <div className="trivia-game">
      {/* Component JSX */}
    </div>
  );
}
```

#### גיידליינים לרכיבים
- השתמש ב-functional components עם hooks
- הפרד לוגיקה עסקית ל-custom hooks
- השתמש ב-React.memo לביצועים
- הימנע מ-prop drilling - השתמש ב-Context או Redux
- השתמש ב-framer-motion לאנימציות
- השתמש ב-audioService לניהול צלילים
- השתמש ב-clientLogger ללוגים

### React Hooks

#### Custom Hooks זמינים

המערכת כוללת מספר custom hooks לניהול לוגיקה עסקית:

##### useTrivia Hook
מנהל יצירת שאלות טריוויה והיסטוריית משחקים:
```typescript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { clientLogger as logger } from '@shared/services';
import { GameData, GameHistoryEntry, TriviaRequest } from '@shared/types';
import { getErrorMessage } from '@shared/utils';
import { apiService, gameHistoryService } from '../services';

const triviaKeys = {
  all: ['trivia'] as const,
  question: (request: TriviaRequest) => [...triviaKeys.all, 'question', request] as const,
  history: () => [...triviaKeys.all, 'history'] as const,
};

export const useGameHistory = (limit: number = 20, offset: number = 0) => {
  return useQuery({
    queryKey: ['game-history', limit, offset],
    queryFn: () => gameHistoryService.getUserGameHistory(limit, offset),
    staleTime: 5 * 60 * 1000,
  });
};

export const useTriviaQuestionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: TriviaRequest) => apiService.getTrivia(request),
    onSuccess: (data) => {
      if (data?.questions) {
        queryClient.setQueryData(triviaKeys.question(data.questions[0]), data);
      }
    },
    onError: (error) => {
      logger.gameError('Failed to get trivia question', {
        error: getErrorMessage(error),
      });
    },
  });
};
```

##### useAuth Hook
מנהל אימות משתמשים:
```typescript
import { useSelector } from 'react-redux';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { setAuthenticated, setUser } from '../redux/slices';
import { authService } from '../services';
import { RootState, UserLoginRequest, UserRegisterRequest } from '../types';
import { useAppDispatch } from './useRedux';

const authKeys = {
  all: ['auth'] as const,
  currentUser: () => [...authKeys.all, 'current-user'] as const,
};

export const useCurrentUser = () => {
  const { isAuthenticated } = useSelector((state: RootState) => state.user);

  return useQuery({
    queryKey: authKeys.currentUser(),
    queryFn: () => authService.getCurrentUser(),
    staleTime: 5 * 60 * 1000,
    enabled: isAuthenticated,
  });
};

export const useLogin = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: (credentials: UserLoginRequest) =>
      authService.login({
        username: credentials.email,
        email: credentials.email,
        password: credentials.password,
      }),
    onSuccess: (data) => {
      dispatch(setAuthenticated(true));
      if (!data.user) {
        throw new Error('User data not found in authentication response');
      }
      dispatch(setUser(data.user));
      queryClient.invalidateQueries({ queryKey: authKeys.all });
      queryClient.clear();
    },
  });
};
```

##### useUser Hook
מנהל נתוני משתמש:
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppDispatch, useSelector } from '../../hooks';
import { setUser } from '../../redux/slices';
import { userService } from '../../services';
import { RootState } from '../../types';

export const useUserProfile = () => {
  const { isAuthenticated } = useSelector((state: RootState) => state.user);

  return useQuery({
    queryKey: ['user', 'profile'],
    queryFn: () => userService.getUserProfile(),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
};

export const useUpdateUserProfile = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: (userData: Partial<UserProfile>) => userService.updateUserProfile(userData),
    onSuccess: (data) => {
      dispatch(setUser(data));
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
};
```

##### usePoints Hook
מנהל נקודות משתמש:
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppDispatch } from '../../hooks';
import { setPointBalance } from '../../redux/slices';
import { pointsService } from '../../services';

export const usePointBalance = () => {
  return useQuery({
    queryKey: ['points', 'balance'],
    queryFn: () => pointsService.getPointBalance(),
    staleTime: 2 * 60 * 1000,
  });
};

export const usePurchasePoints = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: (packageId: string) => pointsService.purchasePoints(packageId),
    onSuccess: (data) => {
      dispatch(setPointBalance(data.pointBalance));
      queryClient.invalidateQueries({ queryKey: ['points'] });
    },
  });
};
```

##### useGameTimer Hook
מנהל טיימר המשחק:
```typescript
import { useEffect, useRef, useState } from 'react';

export const useGameTimer = (timeLimit: number, onTimeout?: () => void) => {
  const [timeRemaining, setTimeRemaining] = useState(timeLimit);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            onTimeout?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeRemaining, onTimeout]);

  const start = () => {
    setIsRunning(true);
  };

  const pause = () => {
    setIsRunning(false);
  };

  const reset = () => {
    setTimeRemaining(timeLimit);
    setIsRunning(false);
  };

  return {
    timeRemaining,
    isRunning,
    start,
    pause,
    reset,
  };
};
```

##### useUserStats Hook
מנהל סטטיסטיקות משתמש:
```typescript
import { useQuery } from '@tanstack/react-query';
import { useAppDispatch, useSelector } from '../../hooks';
import { setStats } from '../../redux/slices';
import { statsService } from '../../services';
import { RootState } from '../../types';

export const useUserStats = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useSelector((state: RootState) => state.user);

  return useQuery({
    queryKey: ['user', 'stats'],
    queryFn: () => statsService.getUserStats(),
    enabled: isAuthenticated,
    staleTime: 10 * 60 * 1000,
    onSuccess: (data) => {
      dispatch(setStats(data));
    },
  });
};
```

#### גיידליינים ל-Hooks
- הפרד בין hooks לניהול state ל-hooks לניהול side effects
- השתמש ב-React Query לניהול server state
- השתמש ב-Redux לניהול global state
- השתמש ב-useState ו-useEffect לניהול local state
- הימנע מ-hooks מורכבים - הפרד ל-hooks קטנים וממוקדים
- תיעוד hooks עם JSDoc

### Redux Toolkit

#### מבנה Store
ה-Redux Store מורכב מ-5 slices עיקריים:
- `game` - מצב המשחק הנוכחי (לא persisted)
- `user` - מצב המשתמש (persisted)
- `stats` - סטטיסטיקות משחק (לא persisted)
- `favorites` - נושאים מועדפים (persisted)
- `gameMode` - מצב משחק והגדרות (persisted)

#### מבנה slice מומלץ - Game Slice
```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TriviaQuestion } from '@shared/types';
import { ClientGameState, GameSliceState, LoadingPayload, ErrorPayload, ScoreUpdatePayload } from '../../types';

const initialGameState: ClientGameState = {
  status: 'idle',
  isPlaying: false,
  currentQuestion: 0,
  totalQuestions: 0,
  questions: [],
  answers: [],
  loading: false,
};

const initialState: GameSliceState = {
  state: initialGameState,
  gameHistory: [],
  leaderboard: [],
  isLoading: false,
  error: null,
};

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<LoadingPayload>) => {
      state.state.status = action.payload.isLoading ? 'loading' : 'idle';
      state.state.loading = action.payload.isLoading;
    },
    setError: (state, action: PayloadAction<ErrorPayload>) => {
      state.error = action.payload.error;
      state.state.status = 'error';
      state.state.error = action.payload.error ?? undefined;
    },
    clearError: (state) => {
      state.error = null;
      state.state.error = undefined;
    },
    setTrivia: (state, action: PayloadAction<TriviaQuestion>) => {
      if (!state.state.data) {
        state.state.data = {
          questions: [],
          answers: [],
          score: 0,
          currentQuestionIndex: 0,
          startTime: new Date(),
        };
      }
      if (!state.state.data.questions) {
        state.state.data.questions = [];
      }
      state.state.data.questions = [action.payload];
      state.state.status = 'playing';
      state.state.error = undefined;
    },
    updateScore: (state, action: PayloadAction<ScoreUpdatePayload>) => {
      if (!state.state.data) return;
      const currentQuestion = state.state.data.questions?.[state.state.data.currentQuestionIndex];
      if (!currentQuestion) return;
      
      if (!state.state.stats) {
        state.state.stats = {
          currentScore: 0,
          maxScore: 0,
          successRate: 0,
          averageTimePerQuestion: 0,
          correctStreak: 0,
          maxStreak: 0,
          questionsAnswered: 0,
          correctAnswers: 0,
          totalGames: 0,
        };
      }
      
      if (action.payload.correct && state.state.stats && state.state.data) {
        const totalTime = action.payload.totalTime ?? 30;
        const timeSpent = action.payload.timeSpent ?? 0;
        const streak = state.state.stats.correctStreak ?? 0;
        const pointsEarned = calculateScore(currentQuestion, totalTime, timeSpent, streak, true);
        
        state.state.data.score += pointsEarned;
        state.state.stats.currentScore += pointsEarned;
        state.state.stats.correctStreak += 1;
        state.state.stats.maxStreak = Math.max(state.state.stats.maxStreak, state.state.stats.correctStreak);
      } else {
        if (state.state.stats) {
          state.state.stats.correctStreak = 0;
        }
      }
    },
    resetGame: () => initialState,
  },
});

export const { updateScore, resetGame } = gameSlice.actions;
export default gameSlice.reducer;
```

#### מבנה slice מומלץ - User Slice
```typescript
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { BasicUser } from '@shared/types';
import { UserState, LoadingPayload, ErrorPayload, PointBalancePayload } from '../../types';
import { authService } from '../../services';
import { POINT_BALANCE_DEFAULT_VALUES } from '../../constants';

export const fetchUserData = createAsyncThunk('user/fetchUserData', async (_, { rejectWithValue }) => {
  try {
    const user = await authService.getCurrentUser();
    return user;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

const initialState: UserState = {
  currentUser: null,
  username: '',
  avatar: '',
  pointBalance: POINT_BALANCE_DEFAULT_VALUES,
  isLoading: false,
  error: null,
  isAuthenticated: false,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<BasicUser | null>) => {
      if (action.payload) {
        state.currentUser = action.payload;
        state.username = action.payload.username;
        state.avatar = '';
        state.isAuthenticated = true;
      } else {
        state.currentUser = null;
        state.username = '';
        state.avatar = '';
        state.isAuthenticated = false;
      }
      state.isLoading = false;
      state.error = null;
    },
    setPointBalance: (state, action: PayloadAction<PointBalancePayload>) => {
      const freeQuestions = action.payload.freePoints;
      const dailyLimit = action.payload.dailyLimit ?? state.pointBalance?.dailyLimit ?? 20;
      const nextResetTime = action.payload.nextResetTime ?? state.pointBalance?.nextResetTime ?? null;

      state.pointBalance = {
        totalPoints: action.payload.balance,
        freeQuestions,
        purchasedPoints: action.payload.purchasedPoints,
        dailyLimit,
        canPlayFree: freeQuestions > 0,
        nextResetTime,
      };
    },
    setAuthenticated: (state, action: PayloadAction<boolean>) => {
      state.isAuthenticated = action.payload;
    },
    logout: (state) => {
      state.currentUser = null;
      state.username = '';
      state.avatar = '';
      state.isLoading = false;
      state.error = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setUser, setPointBalance, setAuthenticated } = userSlice.actions;
export default userSlice.reducer;
```

#### Redux Persist Configuration
```typescript
import { configureStore } from '@reduxjs/toolkit';
import { persistReducer, persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

const userPersistConfig = {
  key: 'user',
  storage,
  whitelist: ['user'],
};

const favoritesPersistConfig = {
  key: 'favorites',
  storage,
  whitelist: ['favorites'],
};

const gameModePersistConfig = {
  key: 'gameMode',
  storage,
  whitelist: ['currentSettings'],
};

export const store = configureStore({
  reducer: {
    game: gameReducer,
    stats: statsReducer,
    favorites: persistReducer(favoritesPersistConfig, favoritesReducer),
    user: persistReducer(userPersistConfig, userReducer),
    gameMode: persistReducer(gameModePersistConfig, gameModeReducer),
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['stats/setStats', 'persist/PERSIST', 'persist/REHYDRATE'],
        ignoredActionPaths: ['payload.created_at', 'payload.updated_at', 'payload.lastPlayed'],
        ignoredPaths: ['stats.stats.lastPlayed', 'user.user.created_at', 'user.user.updated_at'],
      },
    }),
});
```

### NestJS Backend

#### מבנה מודול מומלץ - Game Module
```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PointCalculationService } from '@shared/services';
import { GameHistoryEntity, TriviaEntity, UserEntity, UserStatsEntity } from '@internal/entities';
import { CacheModule, StorageModule } from '@internal/modules';
import { CustomDifficultyPipe, GameAnswerPipe, TriviaQuestionPipe, TriviaRequestPipe } from '../../common/pipes';
import { ValidationModule } from '../../common/validation/validation.module';
import { AnalyticsModule } from '../analytics';
import { AuthModule } from '../auth';
import { LeaderboardModule } from '../leaderboard';
import { UserModule } from '../user';
import { GameController } from './game.controller';
import { GameService } from './game.service';
import { AiProvidersController, AiProvidersService } from './logic/providers/management';
import { TriviaGenerationService } from './logic/triviaGeneration.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, UserStatsEntity, GameHistoryEntity, TriviaEntity]),
    AnalyticsModule,
    AuthModule,
    LeaderboardModule,
    CacheModule,
    StorageModule,
    ValidationModule,
    UserModule,
  ],
  controllers: [GameController, AiProvidersController],
  providers: [
    GameService,
    TriviaGenerationService,
    AiProvidersService,
    PointCalculationService,
    CustomDifficultyPipe,
    TriviaQuestionPipe,
    GameAnswerPipe,
    TriviaRequestPipe,
  ],
  exports: [GameService, AiProvidersService],
})
export class GameModule {}
```

#### מבנה controller מומלץ - Game Controller
```typescript
import { Body, Controller, Get, HttpException, HttpStatus, Param, Post, UsePipes } from '@nestjs/common';
import { CACHE_DURATION } from '@shared/constants';
import { serverLogger as logger } from '@shared/services';
import { getErrorMessage } from '@shared/utils';
import { Cache, CurrentUserId, NoCache } from '../../common';
import { GameAnswerPipe, TriviaRequestPipe } from '../../common/pipes';
import { SubmitAnswerDto } from './dtos/submitAnswer.dto';
import { TriviaRequestDto } from './dtos/triviaRequest.dto';
import { GameService } from './game.service';

@Controller('game')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Post('trivia')
  @NoCache()
  async getTriviaQuestions(
    @CurrentUserId() userId: string,
    @Body(TriviaRequestPipe) body: TriviaRequestDto
  ) {
    try {
      if (!body.topic || !body.difficulty || !body.questionCount) {
        throw new HttpException('Topic, difficulty, and question count are required', HttpStatus.BAD_REQUEST);
      }

      const result = await this.gameService.getTriviaQuestion(
        body.topic,
        body.difficulty,
        body.questionCount,
        userId
      );

      logger.apiCreate('game_trivia_questions', {
        userId,
        topic: body.topic,
        difficulty: body.difficulty,
        questionCount: body.questionCount,
      });

      return result;
    } catch (error) {
      logger.gameError('Error getting trivia questions', {
        error: getErrorMessage(error),
        userId,
        topic: body.topic,
        difficulty: body.difficulty,
      });
      throw error;
    }
  }

  @Post('answer')
  @UsePipes(GameAnswerPipe)
  async submitAnswer(@CurrentUserId() userId: string, @Body() body: SubmitAnswerDto) {
    try {
      if (!body.questionId || !body.answer) {
        throw new HttpException('Question ID and answer are required', HttpStatus.BAD_REQUEST);
      }

      const result = await this.gameService.submitAnswer(
        body.questionId,
        body.answer,
        userId,
        body.timeSpent
      );

      logger.apiUpdate('game_answer_submit', {
        userId,
        questionId: body.questionId,
        timeSpent: body.timeSpent,
      });

      return result;
    } catch (error) {
      logger.gameError('Error submitting answer', {
        error: getErrorMessage(error),
        userId,
        questionId: body.questionId,
      });
      throw error;
    }
  }

  @Get('history')
  @Cache(CACHE_DURATION.LONG)
  async getGameHistory(@CurrentUserId() userId: string) {
    const startTime = Date.now();
    try {
      const result = await this.gameService.getUserGameHistory(userId);

      logger.apiRead('game_history', {
        userId,
        totalGames: result.totalGames,
        duration: Date.now() - startTime,
      });

      return result;
    } catch (error) {
      logger.gameError('Error getting game history', {
        error: getErrorMessage(error),
        userId,
      });
      throw error;
    }
  }
}
```

#### מבנה service מומלץ - Game Service
```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_TTL, SERVER_GAME_CONSTANTS, HTTP_TIMEOUTS } from '@shared/constants';
import { serverLogger as logger, PointCalculationService } from '@shared/services';
import { AnswerResult, TriviaQuestion, GameDifficulty } from '@shared/types';
import { GameHistoryEntity, TriviaEntity, UserEntity } from '@internal/entities';
import { CacheService } from '@internal/modules';

@Injectable()
export class GameService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(GameHistoryEntity)
    private readonly gameHistoryRepository: Repository<GameHistoryEntity>,
    @InjectRepository(TriviaEntity)
    private readonly triviaRepository: Repository<TriviaEntity>,
    private readonly cacheService: CacheService,
    private readonly pointCalculationService: PointCalculationService
  ) {}

  async getTriviaQuestion(
    topic: string,
    difficulty: GameDifficulty,
    questionCount: number = 1,
    userId?: string
  ) {
    const maxQuestions = SERVER_GAME_CONSTANTS.MAX_QUESTIONS_PER_REQUEST;
    const actualQuestionCount = Math.min(questionCount, maxQuestions);

    try {
      const cacheKey = `trivia:${topic}:${difficulty}:${actualQuestionCount}`;

      const cachedResult = await this.cacheService.get<TriviaQuestion[]>(cacheKey);
      const fromCache = cachedResult.success && cachedResult.data !== null;

      const questions = fromCache
        ? cachedResult.data!
        : await this.generateQuestions(topic, difficulty, actualQuestionCount);

      if (!fromCache && questions) {
        await this.cacheService.set(cacheKey, questions, CACHE_TTL.TRIVIA_QUESTIONS);
      }

      return {
        questions: questions || [],
        fromCache,
      };
    } catch (error) {
      logger.gameError('Failed to generate trivia questions', {
        error: getErrorMessage(error),
        topic,
        difficulty,
        requestedCount: actualQuestionCount,
      });
      throw error;
    }
  }

  async submitAnswer(
    questionId: string,
    answer: string,
    userId: string,
    timeSpent: number
  ): Promise<AnswerResult> {
    // Implementation details
  }
}
```

## מערכת הטיפוסים

### מבנה הטיפוסים

#### Shared Types (`shared/types/`)
- `core/` - טיפוסי ליבה
- `domain/` - טיפוסי תחום
  - `game/` - טיפוסי משחק
  - `user/` - טיפוסי משתמש
  - `analytics/` - טיפוסי אנליטיקה
- `infrastructure/` - טיפוסי תשתית

#### Client-Specific Types (`client/src/types/`)
- `game/` - טיפוסי משחק
- `redux/` - טיפוסי Redux
- `ui/` - טיפוסי UI
- `api.types.ts` - טיפוסי API
- `user.types.ts` - טיפוסי משתמש

#### Server-Specific Types (`server/src/internal/types/`)
- `nest.types.ts` - טיפוסי NestJS

### הנחיות שימוש

#### ייבוא טיפוסים
```typescript
// ייבוא מ-shared
import { GameMode, User } from '@shared/types';

// ייבוא מ-types מקומיים
import { GameTimerProps } from '@types';
import { UserState } from '@redux/types';
```

## מערכת הקבועים

### מבנה הקבועים

#### קבועים משותפים (`shared/constants/`)
- `core/` - קבועי ליבה
- `domain/` - קבועי תחום
- `infrastructure/` - קבועי תשתית
- `business/` - קבועי עסק

#### קבועים ספציפיים ל-Client
- `constants/` - קבועי לקוח

#### קבועים ספציפיים ל-Server
- `internal/constants/` - קבועי שרת

### שימוש בקבועים

#### ייבוא קבועים משותפים
```typescript
// בצד הלקוח
import { VALIDATION_RULES, API_ENDPOINTS } from '@shared/constants';

// בצד השרת
import { VALIDATION_RULES, API_ENDPOINTS } from '@shared/constants';
```

## API Documentation

### נקודות קצה עיקריות

#### אימות (Auth)
```http
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
GET  /api/auth/profile
GET  /api/auth/google
GET  /api/auth/google/callback
```

#### משחק (Game)
```http
POST /api/game/trivia
POST /api/game/answer
GET  /api/game/history
```

#### משתמשים (Users)
```http
GET  /api/users/profile
PUT  /api/users/profile
GET  /api/users/stats
GET  /api/users/achievements
```

#### תשלומים (Payments)
```http
POST /api/payment/create-session
POST /api/payment/webhook
GET  /api/payment/history
```

#### מנויים (Subscriptions)
```http
GET  /api/subscription/current
POST /api/subscription/cancel
GET  /api/subscription/history
```

#### נקודות (Points)
```http
GET  /api/points/balance
GET  /api/points/history
POST /api/points/calculate
```

#### לוח תוצאות (Leaderboard)
```http
GET  /api/leaderboard/daily
GET  /api/leaderboard/weekly
GET  /api/leaderboard/monthly
GET  /api/leaderboard/all-time
```

## בדיקות

### Frontend Testing

#### בדיקות רכיבים עם React Testing Library
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '../redux/store';
import { GameComponent } from './GameComponent';

describe('GameComponent', () => {
  it('מציג שאלה כאשר המשחק פעיל', () => {
    render(
      <Provider store={store}>
        <GameComponent />
      </Provider>
    );

    expect(screen.getByText(/שאלה:/)).toBeInTheDocument();
  });
});
```

#### בדיקות Hooks
```typescript
import { renderHook, act } from '@testing-library/react';
import { useGameLogic } from '../hooks/useGameLogic';

describe('useGameLogic', () => {
  it('מתחיל משחק חדש', () => {
    const { result } = renderHook(() => useGameLogic());

    act(() => {
      result.current.startGame('היסטוריה', 'בינוני');
    });

    expect(result.current.isPlaying).toBe(true);
    expect(result.current.currentTopic).toBe('היסטוריה');
  });
});
```

### Backend Testing

#### בדיקות שירותים
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { GameService } from './game.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GameEntity } from '../internal/entities/game.entity';

describe('GameService', () => {
  let service: GameService;
  let mockRepository: any;

  beforeEach(async () => {
    mockRepository = {
      find: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameService,
        {
          provide: getRepositoryToken(GameEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<GameService>(GameService);
  });

  it('יוצר משחק חדש', async () => {
    const createGameDto = {
      topic: 'היסטוריה',
      difficulty: 'בינוני',
      language: 'he'
    };

    mockRepository.save.mockResolvedValue({
      id: '123',
      ...createGameDto
    });

    const result = await service.createGame(createGameDto);

    expect(result.id).toBe('123');
    expect(mockRepository.save).toHaveBeenCalled();
  });
});
```

## Debugging

### Frontend Debugging

#### React DevTools
- התקן את React Developer Tools
- השתמש ב-Profiler לבדיקת ביצועים
- בדוק את Redux DevTools לניהול מצב

#### Console Logging
```typescript
// שימוש ב-logger service
import { clientLogger as logger } from '@shared/services';

logger.info('משחק התחיל', { topic: 'היסטוריה', difficulty: 'בינוני' });
logger.error('שגיאה במשחק', error);
```

### Backend Debugging

#### NestJS Logging
```typescript
import { Logger } from '@nestjs/common';

export class GameService {
  private readonly logger = new Logger(GameService.name);

  async createGame(dto: CreateGameDto) {
    logger.log(`יוצרת משחק חדש: ${dto.topic}`);
    
    try {
      const game = await this.generateGame(dto);
      logger.log(`משחק נוצר בהצלחה: ${game.id}`);
      return game;
    } catch (error) {
      logger.error('שגיאה ביצירת משחק', error.stack);
      throw error;
    }
  }
}
```

## ביצועים ואופטימיזציה

### Frontend Optimization

#### Code Splitting
```typescript
// Lazy loading של רכיבים
const UserProfile = React.lazy(() => import('./views/user/UserProfile'));
const Leaderboard = React.lazy(() => import('./views/leaderboard/Leaderboard'));

// Suspense wrapper
<Suspense fallback={<LoadingSpinner />}>
  <UserProfile />
</Suspense>
```

#### Memoization
```typescript
// React.memo לביצועים
const ExpensiveComponent = React.memo(({ data }) => {
  return <div>{/* רכיב יקר */}</div>;
});

// useMemo לחישובים יקרים
const expensiveValue = useMemo(() => {
  return heavyCalculation(data);
}, [data]);
```

### Backend Optimization

#### Database Optimization
```typescript
// אינדקסים למסד נתונים
@Entity()
@Index(['topic', 'difficulty'])
@Index(['createdAt'])
export class GameEntity {
  // ...
}
```

#### Caching
```typescript
// Redis caching
@Injectable()
export class GameService {
  constructor(
    private readonly cacheService: CacheService,
    private readonly gameRepository: Repository<GameEntity>
  ) {}

  async getQuestion(topic: string, difficulty: string) {
    const cacheKey = `question:${topic}:${difficulty}`;
    
    let question = await this.cacheService.get(cacheKey);
    
    if (!question) {
      question = await this.gameRepository.findOne({
        where: { topic, difficulty }
      });
      
      await this.cacheService.set(cacheKey, question, 3600);
    }
    
    return question;
  }
}
```

## פתרון בעיות נפוצות

### Prettier לא עובד
```bash
# בדוק שהכלי מותקן
pnpm prettier --version

# התקן מחדש אם צריך
pnpm add prettier --save-dev

# בדוק הגדרות
pnpm prettier --config tools/.prettierrc --check "src/**/*.ts"
```

### ESLint מציג שגיאות רבות
```bash
# תיקון אוטומטי
pnpm run lint:fix

# התקנה מחדש של plugins
pnpm add @typescript-eslint/eslint-plugin @typescript-eslint/parser --save-dev
```

### TypeScript שגיאות
```bash
# בדיקת טיפוסים
pnpm tsc --noEmit

# ניקוי cache
rm -rf node_modules/.cache

# התקנה מחדש של dependencies
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### בעיות Docker

#### מסד נתונים לא מתחבר
```bash
# בדיקת סטטוס PostgreSQL
docker-compose ps postgres

# בדיקת לוגים
docker-compose logs postgres

# התחברות למסד נתונים
docker exec -it everytriv-postgres psql -U everytriv_user -d everytriv
```

#### Redis לא מתחבר
```bash
# בדיקת סטטוס Redis
docker-compose ps redis

# בדיקת לוגים
docker-compose logs redis

# התחברות ל-Redis
docker exec -it everytriv-redis redis-cli -a R3d!s_Pr0d_P@ssw0rd_2025_S3cur3!
```

#### שרת לא עולה
```bash
# בדיקת לוגים
docker-compose logs server

# בדיקת תלויות
docker-compose ps

# הפעלה מחדש
docker-compose restart server
```

## הפניות

- [ארכיטקטורה כללית](./ARCHITECTURE.md)
- [דיאגרמות](./DIAGRAMS.md)
- [מדריך פריסה](./DEPLOYMENT.md)
- [אסטרטגיית בדיקות](./TESTING.md)
