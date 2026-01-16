# ארכיטקטורת Hooks - EveryTriv

## סקירה כללית

ארכיטקטורת Hooks ב-EveryTriv מבוססת על React Query לניהול מצב שרת ו-Redux Toolkit לניהול מצב מקומי (UI state בלבד).

**שינוי ארכיטקטוני חשוב:** כל מצב שמגיע מהשרת (server state) מנוהל על ידי React Query בלבד. Redux משמש רק למצב UI מקומי (game session state, modals, temporary preferences). אין עוד synchronization בין Redux ל-React Query - React Query הוא ה-Source of Truth היחיד למצב שרת.

המערכת מאורגנת לפי תחומי אחריות, כאשר כל hook מטפל בהיבט ספציפי של האפליקציה.

## מבנה תיקיית Hooks

```
client/src/hooks/
├── useAuth.ts                      # אימות משתמשים
├── useTrivia.ts                    # שאלות טריוויה והיסטוריית משחקים
├── usePoints.ts                    # מערכת נקודות
├── useUser.ts                      # ניהול משתמשים
├── useUserStats.ts                 # סטטיסטיקות משתמש
├── useLeaderboardFeatures.ts       # תכונות לוח מובילים
├── useAccountManagement.ts         # ניהול חשבון
├── useUserPreferences.ts           # עדכון העדפות משתמש
├── useAnalyticsDashboard.ts        # דשבורד אנליטיקס
├── useAdminAnalytics.ts            # אנליטיקה של אדמין
├── useValidation.ts                # ולידציה
├── useGameTimer.ts                 # טיימר משחק
├── useDebounce.ts                  # Debounce פונקציות וערכים
├── usePrevious.ts                  # מעקב אחר ערכים קודמים
├── useRedux.ts                     # Redux hooks מותאמים
├── useAudio.tsx                    # Audio context hook
├── useNavigationController.ts      # בקרת ניווט
├── useMultiplayer.ts               # מרובה משתתפים - WebSocket connection
├── useMultiplayerRoom.ts           # מרובה משתתפים - ניהול חדר
└── index.ts                        # ייצוא מאוחד
```

לקשר לדיאגרמות: 
- [דיאגרמת Hooks מלאה](../DIAGRAMS.md#דיאגרמת-hooks-מלאה)
- [דיאגרמת React Query Cache](../DIAGRAMS.md#דיאגרמת-react-query-cache)
- [דיאגרמת Redux State](../DIAGRAMS.md#דיאגרמת-redux-state)
- [דיאגרמת מבנה Frontend](../DIAGRAMS.md#דיאגרמת-מבנה-frontend)

## React Query

### Query Keys

המערכת משתמשת במבנה query keys היררכי:

```typescript
// Trivia Query Keys
const triviaKeys = {
  all: ['trivia'] as const,
  lists: () => [...triviaKeys.all, 'list'] as const,
  list: (filters: string) => [...triviaKeys.lists(), { filters }] as const,
  details: () => [...triviaKeys.all, 'detail'] as const,
  detail: (id: number) => [...triviaKeys.details(), id] as const,
  history: () => [...triviaKeys.all, 'history'] as const,
  question: (request: TriviaRequest) => [...triviaKeys.all, 'question', request] as const,
  score: (userId: string) => [...triviaKeys.all, 'score', userId] as const,
  leaderboard: (limit: number) => [...triviaKeys.all, 'leaderboard', limit] as const,
  difficultyStats: (userId?: string) => [...triviaKeys.all, 'difficulty-stats', userId] as const,
};

// Auth Query Keys
const authKeys = {
  all: ['auth'] as const,
  currentUser: () => [...authKeys.all, 'current-user'] as const,
};

// Note: useCurrentUser hook returns full React Query result (data, isError, isSuccess, etc.)
// For simple data access, use useCurrentUserData() hook instead

// User Query Keys
const userKeys = {
  all: ['user'] as const,
  profile: () => [...userKeys.all, 'profile'] as const,
  credits: () => [...userKeys.all, 'credits'] as const,
};

// Points Query Keys
const creditsKeys = {
  all: ['credits'] as const,
  balance: () => [...creditsKeys.all, 'balance'] as const,
  packages: () => [...creditsKeys.all, 'packages'] as const,
  canPlay: (totalQuestions: number) => [...creditsKeys.all, 'can-play', totalQuestions] as const,
  history: (limit: number) => [...creditsKeys.all, 'history', limit] as const,
};

// Game History Query Keys
const gameHistoryKeys = {
  all: ['game-history'] as const,
  list: (limit: number, offset: number) => ['game-history', limit, offset],
};
```

### React Query Hooks

#### Trivia Hooks

##### useTriviaQuestionMutation
יצירת שאלת טריוויה:
```typescript
import { useTriviaQuestionMutation } from '@hooks';

const { mutate, mutateAsync, isLoading, error, isError } = useTriviaQuestionMutation();

// שימוש
mutate({
  topic: 'history',
  difficulty: 'medium',
  requestedQuestions: 1
});

// או עם async/await
try {
  const result = await mutateAsync({
    topic: 'history',
    difficulty: 'medium',
    requestedQuestions: 1
  });
  console.log(result.questions, result.fromCache);
} catch (error) {
  console.error('Failed to get trivia', error);
}
```

##### useGameHistory
קבלת היסטוריית משחקים:
```typescript
import { useGameHistory } from '@hooks';

const { data, isLoading, error, refetch } = useGameHistory(20, 0);

// data מכיל:
// {
//   games: GameHistoryEntry[],
//   totalGames: number
// }
```

##### useDeleteGameHistory
מחיקת משחק מההיסטוריה:
```typescript
import { useDeleteGameHistory } from '@hooks';

const { mutate, isLoading } = useDeleteGameHistory();

mutate('game-id');
```

##### useClearGameHistory
ניקוי כל ההיסטוריה:
```typescript
import { useClearGameHistory } from '@hooks';

const { mutate, isLoading } = useClearGameHistory();

mutate();
```

##### useValidateCustomDifficulty
ולידציה של קושי מותאם:
```typescript
import { useValidateCustomDifficulty } from '@hooks';

const validate = useValidateCustomDifficulty();

const isValid = await validate('קשה מאוד');
```

#### Auth Hooks

##### useCurrentUser
קבלת משתמש נוכחי:
```typescript
import { useCurrentUser } from '@hooks';
import { useSelector } from 'react-redux';

const { isAuthenticated } = useSelector((state: RootState) => state.user);
const { data: currentUser, isLoading, error } = useCurrentUser();

// enabled רק אם המשתמש מאומת
```

##### useLogin
התחברות משתמש:
```typescript
import { useLogin } from '@hooks';

const { mutate, mutateAsync, isLoading, error } = useLogin();

mutate({
  email: 'user@example.com',
  password: 'password123'
});

// מעדכן אוטומטית את Redux state
```

##### useRegister
רישום משתמש חדש:
```typescript
import { useRegister } from '@hooks';

const { mutate, isLoading } = useRegister();

mutate({
  username: 'username',
  email: 'user@example.com',
  password: 'password123',
  firstName: 'John',
  lastName: 'Doe'
});

// מעדכן אוטומטית את Redux state
```

#### User Hooks

##### useUserProfile
קבלת פרופיל משתמש:
```typescript
import { useUserProfile } from '@hooks';

const { data: profile, isLoading, error } = useUserProfile();

// data מכיל:
// {
//   profile: UserProfile,
//   stats: UserStatsData
// }
```

##### useUpdateUserProfile
עדכון פרופיל משתמש:
```typescript
import { useUpdateUserProfile } from '@hooks';

const { mutate, isLoading } = useUpdateUserProfile();

mutate({
  firstName: 'John',
  lastName: 'Doe',
  preferences: {
    emailNotifications: true,
    pushNotifications: false
  }
});
```

#### Points Hooks

##### useCreditBalance
קבלת מאזן קרדיטים:
```typescript
import { useCreditBalance } from '@hooks';

const { data: creditBalance, isLoading } = useCreditBalance();

// data מכיל CreditBalance:
// {
//   totalCredits: number,
//   freeQuestions: number,
//   purchasedCredits: number,
//   dailyLimit: number,
//   canPlayFree: boolean,
//   nextResetTime: string | null
// }
```

##### useCanPlayCredits
בדיקה אם המשתמש יכול לשחק:
```typescript
import { useCanPlayCredits } from '@hooks';

const { data: canPlay, isLoading } = useCanPlayCredits(5); // 5 שאלות

// data הוא boolean
```

##### useCreditPackages
קבלת חבילות קרדיטים:
```typescript
import { useCreditPackages } from '@hooks';

const { data: packages, isLoading } = useCreditPackages();

// data מכיל CreditPurchaseOption[]
```

##### usePurchaseCredits
רכישת קרדיטים:
```typescript
import { usePurchaseCredits } from '@hooks';

const { mutate, isLoading } = usePurchaseCredits();

mutate({
  packageId: 'package-1',
  paymentMethod: PaymentMethod.STRIPE
});
```

##### useDeductCredits
ניכוי קרדיטים:
```typescript
import { useDeductCredits } from '@hooks';
import { GameMode } from '@shared/constants';

const { mutate, isLoading } = useDeductCredits();

mutate({
  totalQuestions: 5,
  gameMode: GameMode.QUESTION_LIMITED
});

// מעדכן אוטומטית את Redux state
```

##### useTransactionHistory
היסטוריית עסקות נקודות:
```typescript
import { useTransactionHistory } from '@hooks';

const { data: transactions, isLoading } = useTransactionHistory(50);

// data מכיל CreditTransaction[]
```

#### Stats Hooks

##### useUserStats
קבלת סטטיסטיקות משתמש:
```typescript
import { useUserStats } from '@hooks';

const { data: stats, isLoading, error } = useUserStats();

// data מכיל:
// {
//   gamesPlayed: number,
//   correctAnswers: number,
//   averageScore: number,
//   ...
// }
```

## Hooks לאימות (Authentication)

### useAuth.ts

```typescript
import { useSelector } from 'react-redux';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { setAuthenticated, setUser } from '../redux/slices';
import { authService } from '../services';
import type { UserLoginRequest, UserRegisterRequest } from '../types';
import { useAppDispatch } from './useRedux';

// Query keys
export const authKeys = {
  all: ['auth'] as const,
  currentUser: () => [...authKeys.all, 'current-user'] as const,
};

// Hook לבדיקת משתמש נוכחי
export const useCurrentUser = () => {
  const { isAuthenticated } = useSelector((state: RootState) => state.user);

  return useQuery({
    queryKey: authKeys.currentUser(),
    queryFn: () => authService.getCurrentUser(),
    staleTime: 5 * 60 * 1000, // Consider stale after 5 minutes
    enabled: isAuthenticated, // Only run if authenticated
  });
};

// Hook להתחברות
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
    onSuccess: data => {
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

// Hook להרשמה
export const useRegister = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: (credentials: UserRegisterRequest) => authService.register(credentials),
    onSuccess: data => {
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

## Hooks לטריוויה (Trivia)

### useTrivia.ts

```typescript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { clientLogger as logger } from '@shared/services';
import type { GameData, GameHistoryEntry, TriviaRequest } from '@shared/types';
import { getErrorMessage } from '@shared/utils';
import { apiService, gameHistoryService } from '../services';

// Query keys
const triviaKeys = {
  all: ['trivia'] as const,
  lists: () => [...triviaKeys.all, 'list'] as const,
  list: (filters: string) => [...triviaKeys.lists(), { filters }] as const,
  details: () => [...triviaKeys.all, 'detail'] as const,
  detail: (id: number) => [...triviaKeys.details(), id] as const,
  history: () => [...triviaKeys.all, 'history'] as const,
  question: (request: TriviaRequest) => [...triviaKeys.all, 'question', request] as const,
  score: (userId: string) => [...triviaKeys.all, 'score', userId] as const,
  leaderboard: (limit: number) => [...triviaKeys.all, 'leaderboard', limit] as const,
  difficultyStats: (userId?: string) => [...triviaKeys.all, 'difficulty-stats', userId] as const,
} as const;

// Hook לקבלת היסטוריית משחקים
export const useGameHistory = (limit: number = 20, offset: number = 0) => {
  return useQuery({
    queryKey: ['game-history', limit, offset],
    queryFn: () => gameHistoryService.getUserGameHistory(limit, offset),
    staleTime: 5 * 60 * 1000, // Consider stale after 5 minutes
  });
};

// Hook לקבלת שאלת טריוויה
export const useTriviaQuestionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: TriviaRequest) => apiService.getTrivia(request),
    onSuccess: (data, request) => {
      queryClient.setQueryData(triviaKeys.question(request), data);
    },
  });
};

// Hook למחיקת היסטוריית משחק
export const useDeleteGameHistory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (gameId: string) => gameHistoryService.deleteGameHistory(gameId),
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ['game-history'] });
      queryClient.invalidateQueries({ queryKey: ['global-leaderboard'] });
      logger.userInfo('Game history deleted successfully', { message: data.message });
    },
    onError: error => {
      logger.userError('Failed to delete game history', { error: getErrorMessage(error) });
    },
  });
};

// Hook למחיקת כל ההיסטוריה
export const useClearGameHistory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => gameHistoryService.clearGameHistory(),
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ['game-history'] });
      queryClient.invalidateQueries({ queryKey: ['global-leaderboard'] });
      logger.userInfo('All game history cleared successfully', {
        deletedCount: data.deletedCount,
      });
    },
    onError: error => {
      logger.userError('Failed to clear game history', { error: getErrorMessage(error) });
    },
  });
};

// Hook לאימות קושי מותאם
export const useValidateCustomDifficulty = () => {
  return (customText: string) => apiService.validateCustomDifficulty(customText);
};
```

## Hooks לנקודות (Points)

### usePoints.ts

```typescript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { GameMode } from '@shared/constants';
import { clientLogger as logger } from '@shared/services';
import type { PointBalance } from '@shared/types';
import { getErrorMessage } from '@shared/utils';
import { selectCanPlayFree, selectUserPointBalance } from '../redux/selectors';
import { deductPoints } from '../redux/slices';
import { creditsService } from '../services';
import type { PointsPurchaseRequest } from '../types';
import { useAppDispatch, useAppSelector } from './useRedux';

// Query keys
const creditsKeys = {
  all: ['credits'] as const,
  balance: () => [...creditsKeys.all, 'balance'] as const,
  packages: () => [...creditsKeys.all, 'packages'] as const,
  canPlay: (totalQuestions: number) => [...creditsKeys.all, 'can-play', totalQuestions] as const,
  history: (limit: number) => [...creditsKeys.all, 'history', limit] as const,
};

// Hook לבדיקת יכולת משחק
export const useCanPlayCredits = (totalQuestions: number = 1) => {
  const creditBalance = useAppSelector(selectUserCreditBalance);
  const canPlayFree = useAppSelector(selectCanPlayFree);
  const canPlay = (creditBalance?.totalCredits ?? 0) >= totalQuestions || canPlayFree;

  return {
    data: canPlay,
    isLoading: false,
    error: null,
    refetch: () => {},
  };
};

// Hook לניכוי נקודות
export const useDeductCredits = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: ({ totalQuestions, gameMode }: { totalQuestions: number; gameMode?: GameMode }) =>
      creditsService.deductCredits(totalQuestions, gameMode ?? GameMode.QUESTION_LIMITED),
    onMutate: async ({ totalQuestions }) => {
      await queryClient.cancelQueries({ queryKey: pointsKeys.balance() });
      const previousBalance = queryClient.getQueryData(pointsKeys.balance());
      queryClient.setQueryData(creditsKeys.balance(), (old: CreditBalance | undefined) => {
        if (!old) {
          return {
            totalCredits: 0,
            freeQuestions: 0,
            purchasedCredits: 0,
            dailyLimit: 0,
            canPlayFree: false,
            nextResetTime: new Date().toISOString(),
          };
        }
        return {
          ...old,
          totalCredits: Math.max(0, old.totalCredits - totalQuestions),
        };
      });
      return { previousBalance };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousBalance) {
        queryClient.setQueryData(creditsKeys.balance(), context.previousBalance);
      }
    },
    onSettled: (_, __, { totalQuestions }) => {
      dispatch(deductCredits(totalQuestions));
      queryClient.invalidateQueries({ queryKey: creditsKeys.all });
    },
  });
};

// Hook לקבלת יתרת קרדיטים
export const useCreditBalance = () => {
  const creditBalance = useAppSelector(selectUserCreditBalance);

  return {
    data: creditBalance,
    isLoading: false,
    error: null,
    refetch: () => {},
  };
};

// Hook לקבלת חבילות קרדיטים
export const useCreditPackages = () => {
  return useQuery({
    queryKey: creditsKeys.packages(),
    queryFn: () => creditsService.getCreditPackages(),
    staleTime: 10 * 60 * 1000, // Consider stale after 10 minutes
  });
};

// Hook לרכישת קרדיטים
export const usePurchaseCredits = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreditsPurchaseRequest) => creditsService.purchaseCredits(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: creditsKeys.balance() });
    },
  });
};

// Hook לקבלת היסטוריית עסקאות
export const useTransactionHistory = (limit: number = 50) => {
  return useQuery({
    queryKey: creditsKeys.history(limit),
    queryFn: () => creditsService.getCreditTransactionHistory(limit),
    staleTime: 60 * 1000, // Consider stale after 1 minute
  });
};
```

## Hooks למשתמש (User)

### useUser.ts

```typescript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { BasicUser, UpdateUserProfileData } from '@shared/types';
import { updateUserProfile } from '../redux/slices';
import { userService } from '../services';
import { useAppDispatch } from './useRedux';

// Query keys
const userKeys = {
  all: ['user'] as const,
  profile: () => [...userKeys.all, 'profile'] as const,
  credits: () => [...userKeys.all, 'credits'] as const,
};

// Hook לעדכון פרופיל משתמש
export const useUpdateUserProfile = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: (data: UpdateUserProfileData) => userService.updateUserProfile(data),
    onSuccess: profileResponse => {
      const profile = profileResponse.profile;
      const userData: Partial<BasicUser> = {
        id: profile.id,
        username: profile.username,
        email: profile.email,
        role: profile.role,
      };
      dispatch(updateUserProfile(userData));
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
};

// Hook לקבלת פרופיל משתמש
export const useUserProfile = () => {
  return useQuery({
    queryKey: userKeys.profile(),
    queryFn: () => userService.getUserProfile(),
    staleTime: 5 * 60 * 1000, // Consider stale after 5 minutes
  });
};
```

## Hooks ללוח מובילים (Leaderboard)

### useLeaderboardFeatures.ts

```typescript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { clientLogger as logger } from '@shared/services';
import { getErrorMessage } from '@shared/utils';
import { selectLeaderboard } from '../redux/selectors';
import { apiService, gameHistoryService } from '../services';
import { useAppSelector } from './useRedux';

// Hook לקבלת דירוג משתמש
export const useUserRanking = () => {
  return useQuery({
    queryKey: ['userRanking'],
    queryFn: async () => {
      logger.userInfo('Fetching user ranking');
      const result = await gameHistoryService.getUserRank();
      logger.userInfo('User ranking fetched successfully', {
        rank: result?.rank,
        score: result?.score,
      });
      return result;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook לעדכון דירוג משתמש
export const useUpdateUserRanking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      logger.userInfo('Updating user ranking');
      return apiService.updateUserRanking();
    },
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ['userRanking'] });
      queryClient.invalidateQueries({ queryKey: ['globalLeaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboardByPeriod'] });
      logger.userInfo('User ranking updated successfully', { rank: data?.rank, score: data?.score });
    },
    onError: error => {
      logger.userError('Failed to update user ranking', { error: getErrorMessage(error) });
    },
  });
};

// Hook לקבלת לוח מובילים גלובלי
export const useGlobalLeaderboard = () => {
  const leaderboard = useAppSelector(selectLeaderboard);

  return {
    data: leaderboard,
    isLoading: false,
    error: null,
    refetch: () => {},
  };
};

// Hook לקבלת לוח מובילים לפי תקופה
export const useLeaderboardByPeriod = (period: 'weekly' | 'monthly', limit: number = 100, offset: number = 0) => {
  return useQuery({
    queryKey: ['leaderboardByPeriod', period, limit, offset],
    queryFn: async () => {
      logger.userInfo('Fetching leaderboard by period', { period, limit, offset });
      const result = await apiService.getLeaderboardByPeriod(period, limit, offset);
      logger.userInfo('Leaderboard fetched successfully', {
        period,
        count: result.length,
      });
      return result;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook לקבלת סטטיסטיקות לוח מובילים
export const useLeaderboardStats = (period: 'weekly' | 'monthly' | 'yearly' = 'weekly') => {
  return useQuery({
    queryKey: ['leaderboardStats', period],
    queryFn: async () => {
      logger.userInfo('Fetching leaderboard stats', { period });
      const result = await apiService.getLeaderboardStats(period);
      logger.userInfo('Leaderboard stats fetched successfully', {
        period,
        activeUsers: result.activeUsers,
      });
      return result;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};
```

## Hooks לסטטיסטיקות משתמש (User Stats)

### useUserStats.ts

```typescript
import { useQuery } from '@tanstack/react-query';
import { clientLogger as logger } from '@shared/services';
import { gameHistoryService } from '../services';

// Hook לקבלת סטטיסטיקות משתמש
export const useUserStats = () => {
  return useQuery({
    queryKey: ['userStats'],
    queryFn: async () => {
      logger.userInfo('Fetching user statistics');
      const result = await gameHistoryService.getUserStats();
      logger.userInfo('User statistics fetched successfully', {
        totalGames: result.gamesPlayed,
        totalScore: result.correctAnswers,
        averageScore: result.averageScore,
      });
      return result;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};
```

## Hooks לאנליטיקה של אדמין (Admin Analytics)

### useAdminAnalytics.ts

```typescript
import { useQuery } from '@tanstack/react-query';
import { TimePeriod } from '@shared/constants';
import { clientLogger as logger } from '@shared/services';
import type {
  Achievement,
  ActivityEntry,
  AnalyticsResponse,
  SystemRecommendation,
  UserAnalyticsRecord,
  UserComparisonResult,
  UserInsightsData,
  UserPerformanceMetrics,
  UserProgressAnalytics,
  UserSummaryData,
  UserTrendPoint,
} from '@shared/types';
import { apiService } from '../services';

type TrendQueryParams = {
  startDate?: string;
  endDate?: string;
  groupBy?: TimePeriod;
  limit?: number;
};

type ActivityQueryParams = {
  startDate?: string;
  endDate?: string;
  limit?: number;
};

type ComparisonQueryParams = {
  target?: 'global' | 'user';
  targetUserId?: string;
  startDate?: string;
  endDate?: string;
};

// Hook לקבלת סטטיסטיקות משתמש לפי ID (Admin בלבד)
export const useUserStatisticsById = (userId: string, enabled?: boolean) => {
  return useQuery<AnalyticsResponse<UserAnalyticsRecord>>({
    queryKey: ['adminUserStatistics', userId],
    queryFn: async () => {
      logger.userInfo('Fetching user statistics by ID', { userId });
      const result = await apiService.getUserStatisticsById(userId);
      logger.userInfo('User statistics fetched successfully', { userId });
      return result;
    },
    enabled: enabled !== undefined ? enabled : !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

// Hook לקבלת מדדי ביצועים של משתמש לפי ID (Admin בלבד)
export const useUserPerformanceById = (userId: string, enabled?: boolean) => {
  return useQuery<AnalyticsResponse<UserPerformanceMetrics>>({
    queryKey: ['adminUserPerformance', userId],
    queryFn: async () => {
      logger.userInfo('Fetching user performance by ID', { userId });
      const result = await apiService.getUserPerformanceById(userId);
      logger.userInfo('User performance fetched successfully', { userId });
      return result;
    },
    enabled: enabled !== undefined ? enabled : !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

// Hook לקבלת אנליטיקת התקדמות משתמש לפי ID (Admin בלבד)
export const useUserProgressById = (userId: string, params?: TrendQueryParams, enabled?: boolean) => {
  return useQuery<AnalyticsResponse<UserProgressAnalytics>>({
    queryKey: ['adminUserProgress', userId, params],
    queryFn: async () => {
      logger.userInfo('Fetching user progress by ID', { userId, params });
      const result = await apiService.getUserProgressById(userId, params);
      logger.userInfo('User progress fetched successfully', { userId });
      return result;
    },
    enabled: enabled !== undefined ? enabled : !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

// Hook לקבלת פעילות משתמש לפי ID (Admin בלבד)
export const useUserActivityById = (userId: string, params?: ActivityQueryParams, enabled?: boolean) => {
  return useQuery<AnalyticsResponse<ActivityEntry[]>>({
    queryKey: ['adminUserActivity', userId, params],
    queryFn: async () => {
      logger.userInfo('Fetching user activity by ID', { userId, params });
      const result = await apiService.getUserActivityById(userId, params);
      logger.userInfo('User activity fetched successfully', {
        userId,
        count: result.data?.length ?? 0,
      });
      return result;
    },
    enabled: enabled !== undefined ? enabled : !!userId,
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

// Hook לקבלת תובנות משתמש לפי ID (Admin בלבד)
export const useUserInsightsById = (userId: string, enabled?: boolean) => {
  return useQuery<AnalyticsResponse<UserInsightsData>>({
    queryKey: ['adminUserInsights', userId],
    queryFn: async () => {
      logger.userInfo('Fetching user insights by ID', { userId });
      const result = await apiService.getUserInsightsById(userId);
      logger.userInfo('User insights fetched successfully', { userId });
      return result;
    },
    enabled: enabled !== undefined ? enabled : !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

// Hook לקבלת המלצות משתמש לפי ID (Admin בלבד)
export const useUserRecommendationsById = (userId: string, enabled?: boolean) => {
  return useQuery<AnalyticsResponse<SystemRecommendation[]>>({
    queryKey: ['adminUserRecommendations', userId],
    queryFn: async () => {
      logger.userInfo('Fetching user recommendations by ID', { userId });
      const result = await apiService.getUserRecommendationsById(userId);
      logger.userInfo('User recommendations fetched successfully', {
        userId,
        recommendationsCount: result.data?.length ?? 0,
      });
      return result;
    },
    enabled: enabled !== undefined ? enabled : !!userId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

// Hook לקבלת הישגי משתמש לפי ID (Admin בלבד)
export const useUserAchievementsById = (userId: string, enabled?: boolean) => {
  return useQuery<AnalyticsResponse<Achievement[]>>({
    queryKey: ['adminUserAchievements', userId],
    queryFn: async () => {
      logger.userInfo('Fetching user achievements by ID', { userId });
      const result = await apiService.getUserAchievementsById(userId);
      logger.userInfo('User achievements fetched successfully', {
        userId,
        count: result.data?.length ?? 0,
      });
      return result;
    },
    enabled: enabled !== undefined ? enabled : !!userId,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};

// Hook לקבלת מגמות משתמש לפי ID (Admin בלבד)
export const useUserTrendsById = (userId: string, params?: TrendQueryParams, enabled?: boolean) => {
  return useQuery<AnalyticsResponse<UserTrendPoint[]>>({
    queryKey: ['adminUserTrends', userId, params],
    queryFn: async () => {
      logger.userInfo('Fetching user trends by ID', { userId, params });
      const result = await apiService.getUserTrendsById(userId, params);
      logger.userInfo('User trends fetched successfully', {
        userId,
        count: result.data?.length ?? 0,
      });
      return result;
    },
    enabled: enabled !== undefined ? enabled : !!userId,
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

// Hook להשוואת ביצועי משתמש (Admin בלבד)
export const useCompareUserPerformance = (userId: string, params?: ComparisonQueryParams, enabled?: boolean) => {
  return useQuery<AnalyticsResponse<UserComparisonResult>>({
    queryKey: ['adminUserComparison', userId, params],
    queryFn: async () => {
      logger.userInfo('Comparing user performance', { userId, params });
      const result = await apiService.compareUserPerformanceById(userId, params);
      logger.userInfo('User comparison completed successfully', { userId });
      return result;
    },
    enabled: enabled !== undefined ? enabled : !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

// Hook לקבלת סיכום משתמש לפי ID (Admin בלבד)
export const useUserSummaryById = (userId: string, includeActivity: boolean = false, enabled?: boolean) => {
  return useQuery<AnalyticsResponse<UserSummaryData>>({
    queryKey: ['adminUserSummary', userId, includeActivity],
    queryFn: async () => {
      logger.userInfo('Fetching user summary by ID', { userId });
      const result = await apiService.getUserSummaryById(userId, includeActivity);
      logger.userInfo('User summary fetched successfully', { userId });
      return result;
    },
    enabled: enabled !== undefined ? enabled : !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};
```

## Hooks להעדפות משתמש (User Preferences)

### useUserPreferences.ts

```typescript
import { useSelector } from 'react-redux';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { clientLogger as logger } from '@shared/services';
import type { UserPreferences } from '@shared/types';
import { getErrorMessage } from '@shared/utils';
import { setUser } from '../redux/slices';
import { userService } from '../services';
import type { RootState } from '../types';
import { authKeys } from './useAuth';
import { useAppDispatch } from './useRedux';

// Helper function to invalidate user-related queries consistently
const invalidateUserQueries = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: authKeys.currentUser() });
  queryClient.invalidateQueries({ queryKey: ['userProfile'] });
  queryClient.invalidateQueries({ queryKey: ['userPreferences'] });
};

// Hook לעדכון העדפות משתמש
export const useUpdateUserPreferences = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const { currentUser } = useSelector((state: RootState) => state.user);

  return useMutation({
    mutationFn: async (preferences: Partial<UserPreferences>) => {
      logger.userInfo('Updating user preferences');
      return userService.updateUserPreferences(preferences);
    },
    onSuccess: () => {
      if (currentUser) {
        dispatch(setUser({ ...currentUser }));
      }
      invalidateUserQueries(queryClient);
      logger.userInfo('User preferences updated successfully');
    },
    onError: error => {
      logger.userError('Failed to update user preferences', { error: getErrorMessage(error) });
    },
  });
};
```

## Hooks לניהול חשבון (Account Management)

### useAccountManagement.ts

```typescript
import { useSelector } from 'react-redux';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { clientLogger as logger } from '@shared/services';
import { BasicValue } from '@shared/types';
import { getErrorMessage } from '@shared/utils';
import { setAuthenticated, setUser } from '../redux/slices';
import { authService, userService } from '../services';
import type { RootState } from '../types';
import { authKeys } from './useAuth';
import { useAppDispatch } from './useRedux';

// Helper function to invalidate user-related queries consistently
const invalidateUserQueries = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: authKeys.currentUser() });
  queryClient.invalidateQueries({ queryKey: ['userProfile'] });
  queryClient.invalidateQueries({ queryKey: ['userPreferences'] });
};

// Hook למחיקת חשבון משתמש
export const useDeleteUserAccount = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: async () => {
      logger.userInfo('Deleting user account');
      return userService.deleteAccount();
    },
    onSuccess: data => {
      dispatch(setAuthenticated(false));
      dispatch(setUser(null));
      queryClient.clear();
      logger.userInfo('User account deleted successfully', {
        success: data.success,
      });
    },
    onError: error => {
      logger.userError('Failed to delete user account', { error: getErrorMessage(error) });
    },
  });
};

// Hook לשינוי סיסמה
export const useChangePassword = () => {
  return useMutation({
    mutationFn: async (passwordData: { currentPassword: string; newPassword: string }) => {
      logger.userInfo('Changing user password');
      return authService.changePassword(passwordData.currentPassword, passwordData.newPassword);
    },
    onSuccess: () => {
      logger.userInfo('Password changed successfully');
    },
    onError: error => {
      logger.userError('Failed to change password', {
        error: getErrorMessage(error),
      });
    },
  });
};

// Hook לעדכון שדה משתמש
export const useUpdateUserField = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const { currentUser } = useSelector((state: RootState) => state.user);

  return useMutation({
    mutationFn: async ({ field, value }: { field: string; value: BasicValue }) => {
      logger.userInfo('Updating user field', { field });
      return userService.updateUserField(field, value);
    },
    onSuccess: (data, { field, value }) => {
      if (data && 'user' in data && data.user && currentUser) {
        dispatch(setUser({ ...currentUser, [field]: value }));
      }
      invalidateUserQueries(queryClient);
      logger.userInfo('User field updated successfully', { field });
    },
    onError: (error, { field }) => {
      logger.userError('Failed to update user field', { error: getErrorMessage(error), field });
    },
  });
};

// Hook לעדכון העדפה בודדת
export const useUpdateSinglePreference = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ preference, value }: { preference: string; value: BasicValue }) => {
      logger.userInfo('Updating user preference', { preference });
      return userService.updateSinglePreference(preference, value);
    },
    onSuccess: (_data, { preference }) => {
      invalidateUserQueries(queryClient);
      logger.userInfo('User preference updated successfully', { preference });
    },
    onError: (error, { preference }) => {
      logger.userError('Failed to update user preference', { error: getErrorMessage(error), preference });
    },
  });
};

// Hook ל-Google OAuth
export const useGoogleOAuth = () => {
  return useMutation({
    mutationFn: async () => {
      logger.userInfo('Initiating Google OAuth login');
      return authService.initiateGoogleLogin();
    },
    onSuccess: () => {
      logger.userInfo('Google OAuth redirect initiated');
    },
    onError: error => {
      logger.userError('Failed to initiate Google OAuth', { error: getErrorMessage(error) });
    },
  });
};

// Hook לעדכון נקודות משתמש (Admin בלבד)
export const useUpdateUserCredits = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, amount, reason }: { userId: string; amount: number; reason: string }) => {
      logger.userInfo('Admin updating user credits', { userId, amount });
      return userService.updateCredits(userId, amount, reason);
    },
    onSuccess: (_data, { userId }) => {
      queryClient.invalidateQueries({ queryKey: authKeys.currentUser() });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
      logger.userInfo('User credits updated successfully', { userId });
    },
    onError: (error, { userId }) => {
      logger.userError('Failed to update user credits', { error: getErrorMessage(error), userId });
    },
  });
};

// Hook לעדכון סטטוס משתמש (Admin בלבד)
export const useUpdateUserStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: 'active' | 'suspended' | 'banned' }) => {
      logger.userInfo('Admin updating user status', { userId, status });
      return userService.updateStatus(userId, status);
    },
    onSuccess: (_data, { userId }) => {
      queryClient.invalidateQueries({ queryKey: authKeys.currentUser() });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
      logger.userInfo('User status updated successfully', { userId });
    },
    onError: (error, { userId }) => {
      logger.userError('Failed to update user status', { error: getErrorMessage(error), userId });
    },
  });
};

// Hook למחיקת משתמש (Admin בלבד)
export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const { currentUser } = useSelector((state: RootState) => state.user);

  return useMutation({
    mutationFn: async (userId: string) => {
      logger.userInfo('Admin deleting user', { userId });
      return userService.deleteUser(userId);
    },
    onSuccess: (_, userId) => {
      if (currentUser?.id === userId) {
        dispatch(setAuthenticated(false));
        dispatch(setUser(null));
      }
      queryClient.invalidateQueries({ queryKey: authKeys.all });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
      queryClient.invalidateQueries({ queryKey: ['global-leaderboard'] });
      logger.userInfo('User deleted successfully', { userId });
    },
    onError: (error, userId) => {
      logger.userError('Failed to delete user', { error: getErrorMessage(error), userId });
    },
  });
};

// Hook לקבלת משתמש לפי ID (Admin בלבד)
export const useGetUserById = () => {
  return useMutation({
    mutationFn: async (userId: string) => {
      logger.userInfo('Admin fetching user by ID', { userId });
      return userService.getUserById(userId);
    },
    onSuccess: (_, userId) => {
      logger.userInfo('User fetched successfully', { userId });
    },
    onError: (error, userId) => {
      logger.userError('Failed to fetch user', { error: getErrorMessage(error), userId });
    },
  });
};
```

## Hooks לשירותים (Utility Hooks)

### useGameTimer.ts

```typescript
import { useEffect, useRef } from 'react';
import { GameMode } from '@shared/constants';
import type { GameModeConfig } from '@shared/types';
import { AudioKey } from '../constants';
import { audioService } from '../services';
import type { ClientGameState } from '../types';

// Hook לניהול טיימר משחק
export function useGameTimer(
  currentGameMode: GameModeConfig | undefined,
  onStateChange: (newState: ClientGameState) => void,
  state: ClientGameState | undefined,
  onGameEnd?: () => void
): void {
  const lastWarningTimeRef = useRef<number | null>(null);

      useEffect(() => {
    if (!currentGameMode || currentGameMode.isGameOver) return;

    const checkGameOver = (): boolean => {
      if (!onStateChange || !state?.gameMode) return false;

      let shouldEndGame = false;
      let updatedGameMode = { ...currentGameMode };

      if (currentGameMode.mode === GameMode.TIME_LIMITED && currentGameMode.timer?.timeRemaining !== undefined) {
        if (currentGameMode.timer.timeRemaining <= 0) {
          shouldEndGame = true;
          updatedGameMode = {
            ...currentGameMode,
            isGameOver: true,
            timer: {
              ...currentGameMode.timer,
              timeRemaining: 0,
            },
          };
        }
      } else if (
        currentGameMode.mode === GameMode.QUESTION_LIMITED &&
        currentGameMode.questionLimit !== undefined &&
        currentGameMode.questionLimit <= 0
      ) {
        shouldEndGame = true;
        updatedGameMode = {
          ...currentGameMode,
          isGameOver: true,
        };
      }

      if (shouldEndGame) {
        onStateChange({
          ...state,
          gameMode: updatedGameMode,
        });
        onGameEnd?.();
        return true;
      }

      return false;
    };

    if (!currentGameMode.timer?.isRunning) {
      checkGameOver();
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const startTime = currentGameMode.timer?.startTime ?? now;
      const elapsed = now - startTime;

      if (onStateChange && state?.gameMode) {
        const updatedTimer = {
          ...currentGameMode.timer,
          timeElapsed: elapsed,
        };

        if (currentGameMode.mode === GameMode.TIME_LIMITED && currentGameMode.timeLimit) {
          const remaining = Math.max(0, currentGameMode.timeLimit - elapsed);
          updatedTimer.timeRemaining = remaining;

          if (remaining > 0) {
            const remainingSeconds = Math.floor(remaining / 1000);

            if (remainingSeconds <= 10 && remainingSeconds > 3 && lastWarningTimeRef.current !== remainingSeconds) {
              audioService.play(AudioKey.TIME_WARNING);
              lastWarningTimeRef.current = remainingSeconds;
            } else if (
              remainingSeconds <= 3 &&
              remainingSeconds > 0 &&
              lastWarningTimeRef.current !== remainingSeconds
            ) {
              audioService.play(AudioKey.COUNTDOWN);
              lastWarningTimeRef.current = remainingSeconds;
            } else if (
              remainingSeconds > 0 &&
              remainingSeconds % 30 === 0 &&
              lastWarningTimeRef.current !== remainingSeconds
            ) {
              audioService.play(AudioKey.BEEP);
              lastWarningTimeRef.current = remainingSeconds;
            }
          }
        }

        onStateChange({
          ...state,
          gameMode: {
            ...currentGameMode,
            timer: updatedTimer,
          },
        });

        checkGameOver();
        }
    }, 1000);

    return () => {
      clearInterval(interval);
      lastWarningTimeRef.current = null;
    };
  }, [
    currentGameMode?.timer?.isRunning,
    currentGameMode?.timer?.startTime,
    currentGameMode?.mode,
    currentGameMode?.timeLimit,
    currentGameMode?.questionLimit,
    currentGameMode?.isGameOver,
    onGameEnd,
    onStateChange,
    state,
  ]);
}
```

### useValidation.ts

```typescript
import { useCallback, useMemo } from 'react';
import {
  performLocalLanguageValidationAsync,
  validateEmail,
  validatePassword,
  validateTopicLength,
  validateUsername,
} from '@shared/utils';
import { validateCustomDifficultyText } from '@shared/validation';
import type { BasicValidationResult, ValidationHookOptions, ValidatorsMap } from '../types';

// Hook לוולידציה
export function useValidation() {
  const validators: ValidatorsMap = useMemo(
    () => ({
      username: async (value: string) => Promise.resolve(validateUsername(value)),
      password: async (value: string) => Promise.resolve(validatePassword(value)),
      email: async (value: string) => Promise.resolve(validateEmail(value)),
      topic: async (value: string) => Promise.resolve(validateTopicLength(value)),
      customDifficulty: async (value: string) => Promise.resolve(validateCustomDifficultyText(value)),
      language: async (
        value: string,
        options?: ValidationHookOptions | { enableSpellCheck?: boolean; enableGrammarCheck?: boolean }
      ) => {
        const languageOptions = options && 'enableSpellCheck' in options ? options : undefined;
        const result = await performLocalLanguageValidationAsync(value, {
          enableSpellCheck: languageOptions?.enableSpellCheck ?? true,
          enableGrammarCheck: languageOptions?.enableGrammarCheck ?? true,
        });
        return {
          isValid: result.isValid,
          errors: result.errors,
        };
      },
    }),
    []
  );

  type ValidatorKey = keyof ValidatorsMap;

  const validate = useCallback(
    async (
      type: ValidatorKey,
      value: string,
      options?: ValidationHookOptions | { enableSpellCheck?: boolean; enableGrammarCheck?: boolean }
    ): Promise<BasicValidationResult> => {
      const validator = validators[type];
      if (!validator) return Promise.resolve({ isValid: true, errors: [] });
      return validator(value, options);
    },
    [validators]
  );

  return { validate };
}
```

### useDebounce.ts

```typescript
import { useCallback, useEffect, useRef, useState } from 'react';

// Hook ל-debounce ערך
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Hook ל-debounce פונקציה
export function useDebouncedCallback<T extends (...args: never[]) => unknown>(
  func: T,
  delay: number,
  options: {
    leading?: boolean;
    trailing?: boolean;
    maxWait?: number;
  } = {}
): {
  debounced: T;
  cancel: () => void;
  flush: () => void;
  isPending: boolean;
} {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastCallTimeRef = useRef<number>(0);
  const [isPending, setIsPending] = useState(false);

  const { leading = false, trailing = true, maxWait } = options;

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsPending(false);
  }, []);

  const flush = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsPending(false);
    func();
  }, [func]);

  const debounced = useCallback(
    ((...args: never[]) => {
      const now = Date.now();
      const timeSinceLastCall = now - lastCallTimeRef.current;

      if (leading && !timeoutRef.current) {
        lastCallTimeRef.current = now;
        setIsPending(true);
        func(...args);
        return;
      }

      cancel();

      if (maxWait && timeSinceLastCall >= maxWait) {
        lastCallTimeRef.current = now;
        setIsPending(true);
        func(...args);
        return;
      }

      if (trailing) {
        setIsPending(true);
        timeoutRef.current = setTimeout(() => {
          lastCallTimeRef.current = Date.now();
          setIsPending(false);
          func(...args);
        }, delay);
      }
    }) as T,
    [func, delay, leading, trailing, maxWait, cancel]
  );

  return {
    debounced,
    cancel,
    flush,
    isPending,
  };
}
```

### usePrevious.ts

```typescript
import { useCallback, useEffect, useRef } from 'react';

// Hook למעקב אחר ערך קודם
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

// Hook למעקב אחר שינוי ערך
export function useValueChange<T>(value: T): {
  current: T;
  previous: T | undefined;
  hasChanged: boolean;
} {
  const previous = usePrevious(value);

  return {
    current: value,
    previous,
    hasChanged: previous !== undefined && previous !== value,
  };
}
```

### useRedux.ts

```typescript
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../redux/store';

// Redux hooks מותאמים עם types
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
```

## Hooks למרובה משתתפים (Multiplayer)

### useMultiplayer.ts

Hook ראשי לניהול חיבור WebSocket ומצב מרובה משתתפים.

**שימוש:**
```typescript
import { useMultiplayer } from '@hooks';

const {
  isConnected,
  room,
  gameState,
  leaderboard,
  error,
  connect,
  disconnect,
  createRoom,
  joinRoom,
  leaveRoom,
  startGame,
  submitAnswer,
} = useMultiplayer();
```

**State:**
- `isConnected` - סטטוס חיבור WebSocket
- `room` - מצב החדר הנוכחי (`MultiplayerRoom | null`)
- `gameState` - מצב המשחק (`GameState | null`)
- `leaderboard` - לוח תוצאות (`Player[]`)
- `error` - שגיאות (`string | null`)

**Methods:**
- `connect()` - התחברות לשרת WebSocket
- `disconnect()` - ניתוק מהשרת
- `createRoom(config)` - יצירת חדר חדש
- `joinRoom(roomId)` - הצטרפות לחדר קיים
- `leaveRoom(roomId)` - יציאה מחדר
- `startGame(roomId)` - התחלת משחק (host only)
- `submitAnswer(roomId, questionId, answer, timeSpent)` - שליחת תשובה

**Event Listeners:**
ההוק מגדיר event listeners אוטומטית עבור:
- `room-created`, `room-joined`, `room-left`
- `player-joined`, `player-left`
- `game-started`, `question-started`, `question-ended`, `game-ended`
- `answer-received`, `leaderboard-update`, `room-updated`
- `error`

**Auto-connect:**
ההוק מתחבר אוטומטית כאשר יש token זמין.

### useMultiplayerRoom.ts

Hook מיוחד לניהול חדר מרובה משתתפים.

**שימוש:**
```typescript
import { useMultiplayerRoom } from '@hooks';

const {
  room,
  isLoading,
  isConnected,
  error,
  isHost,
  currentPlayer,
  isReadyToStart,
  createRoom,
  joinRoom,
  leaveRoom,
  startGame,
} = useMultiplayerRoom(roomId?);
```

**Computed Values:**
- `isHost` - האם המשתמש הוא host של החדר
- `currentPlayer` - השחקן הנוכחי (`Player | undefined`)
- `isReadyToStart` - האם החדר מוכן להתחיל (לפחות 2 שחקנים)

**Auto-join:**
אם `roomId` מסופק, ההוק מצטרף אוטומטית לחדר.

**שימוש ב-Views:**
```typescript
// MultiplayerLobbyView
const { room, createRoom, joinRoom, isHost, isReadyToStart, startGame } = useMultiplayerRoom();

// MultiplayerGameView
const { room, gameState, submitAnswer } = useMultiplayer();
```

## Context Hooks

### useAudio.tsx

```typescript
import { createContext, useContext } from 'react';
import { audioService } from '../services';

const AudioContext = createContext(audioService);

export const AudioProvider = ({ children }: { children: React.ReactNode }) => {
  return <AudioContext.Provider value={audioService}>{children}</AudioContext.Provider>;
  };

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
    }
  return context;
};
```

## יתרונות הארכיטקטורה

### 1. הפרדת אחריות
- כל hook מטפל בהיבט ספציפי
- קל להבין ולשנות כל חלק בנפרד
- הפחתת תלויות בין רכיבים

### 2. נוח לתחזוקה
- קוד מאורגן ומובנה
- קל למצוא ולשנות פונקציונליות
- שימוש ב-React Query לניהול מצב שרת
- שימוש ב-Redux לניהול מצב מקומי

### 3. ביצועים
- Cache חכם עם React Query
- Optimistic updates
- Automatic refetching

## הנחיות שימוש

### שמות Hooks
- `useLogin`, `useRegister`, `useCurrentUser` - קריאות API לאימות
- `useTriviaQuestionMutation`, `useGameHistory` - קריאות API למשחק
- `useCreditBalance`, `useCanPlayCredits`, `usePurchaseCredits` - קריאות API לקרדיטים
- `useGameTimer` - UI hooks
- `useDebounce`, `usePrevious` - Utility hooks

### החזרת ערכים
- החזרת אובייקט מפורש ולא מערך
- שימוש ב-React Query לניהול מצב async
- שימוש ב-Redux לניהול מצב גלובלי

### TypeScript Best Practices
- שימוש ב-`null` במקום `undefined` עבור refs
- שימוש ב-`error?: string` עבור שדות אופציונליים ב-Redux state
- בדיקות מפורשות: `if (timeoutRef.current)` במקום `if (timeoutRef.current)`

## קישורים רלוונטיים

- מבנה שכבות מלא: `../ARCHITECTURE.md#ארכיטקטורת-frontend`
- [Redux - Frontend](./REDUX.md)
- API Reference: `../backend/API_REFERENCE.md`
- דיאגרמות: 
  - [דיאגרמת Hooks מלאה](../DIAGRAMS.md#דיאגרמת-hooks-מלאה)
  - [דיאגרמת React Query Cache](../DIAGRAMS.md#דיאגרמת-react-query-cache)
  - [דיאגרמת Redux State](../DIAGRAMS.md#דיאגרמת-redux-state)
