# ארכיטקטורת Hooks - EveryTriv

## סקירה כללית

ארכיטקטורת Hooks ב-EveryTriv מבוססת על עקרון השכבות (Layered Architecture) המאפשר הפרדה ברורה של אחריות, קוד נקי ונוח לתחזוקה. המערכת מאורגנת בשכבות לוגיות המטפלות בהיבטים שונים של האפליקציה.

## מבנה השכבות

```
client/src/hooks/
├── api/                    # שכבת API
│   ├── useAuth.ts         # אימות משתמשים
│   ├── useTrivia.ts       # שאלות טריוויה
│   ├── usePoints.ts       # מערכת נקודות
│   ├── useUser.ts         # ניהול משתמשים
│   ├── useAnalyticsDashboard.ts # דשבורד אנליטיקס
│   ├── useLeaderboardFeatures.ts # תכונות לוח מובילים
│   ├── useSubscriptionManagement.ts # ניהול מנויים
│   ├── useUserPreferences.ts # העדפות משתמש
│   ├── useAccountManagement.ts # ניהול חשבון
│   └── useLanguageValidation.ts # אימות שפה
└── layers/                # שכבות לוגיות
    ├── ui/                # שכבת UI
    │   └── useCustomAnimations.ts
    └── utils/             # שכבת כלים
        ├── useDebounce.ts
        ├── usePrevious.ts
        └── useRedux.ts
```

## Context Hooks

Context hooks ממוקמים ב-`App.tsx` ו-`HomeView.tsx`:

```
client/src/
├── App.tsx                # AudioContext
└── views/home/HomeView.tsx # GameContext
```

## שכבת API

### useAuth Hooks (useLogin, useRegister, useCurrentUser)
```typescript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { setAuthenticated, setUser } from '../../redux/slices/userSlice';
import { authService } from '../../services';
import type { UserLoginRequest, UserRegisterRequest } from '../../types';
import { useAppDispatch } from '../layers/utils';

// Query keys
export const authKeys = {
  all: ['auth'] as const,
  currentUser: () => [...authKeys.all, 'current-user'] as const,
};

// Hooks
export const useCurrentUser = () => {
  const { isAuthenticated } = useSelector((state: RootState) => state.user);

  return useQuery({
    queryKey: authKeys.currentUser(),
    queryFn: () => authService.getCurrentUser(),
    staleTime: 5 * 60 * 1000, // Consider stale after 5 minutes
    enabled: isAuthenticated, // Only run if authenticated
  });
};

// Mutations
export const useLogin = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: (credentials: UserLoginRequest) =>
      authService.login({
        username: credentials.email, // Use email as username
        email: credentials.email,
        password: credentials.password,
      }),
    onSuccess: data => {
      // Update Redux state for HOCs consistency
      dispatch(setAuthenticated(true));
      // Create full User object from partial data with dynamic defaults
      const fullUser: User = {
        ...data.user,
        role: data.user.role as UserRole,
        ...USER_DEFAULT_VALUES,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      dispatch(setUser(fullUser));

      // Invalidate auth-related queries
      queryClient.invalidateQueries({ queryKey: authKeys.all });
      // Clear any cached data that might be user-specific
      queryClient.clear();
    },
  });
};

export const useRegister = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: (credentials: UserRegisterRequest) => authService.register(credentials),
    onSuccess: data => {
      // Update Redux state for HOCs consistency
      dispatch(setAuthenticated(true));
      // Create full User object from partial data with dynamic defaults
      const fullUser: User = {
        ...data.user,
        role: data.user.role as UserRole,
        ...USER_DEFAULT_VALUES,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      dispatch(setUser(fullUser));

      // Invalidate auth-related queries
      queryClient.invalidateQueries({ queryKey: authKeys.all });
      // Clear any cached data that might be user-specific
      queryClient.clear();
    },
  });
};
```

### useTrivia Hooks (useTriviaQuestion, useGameHistory, useLeaderboard)
```typescript
import type { CreateGameHistoryDto, GameHistoryEntry, TriviaRequest } from '@shared';
import { clientLogger as logger, getErrorMessage } from '@shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { selectLeaderboard } from '../../redux/selectors';
import { apiService, gameHistoryService, storageService } from '../../services';
import { useAppSelector } from '../layers/utils';

// Query keys
export const triviaKeys = {
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

// Custom difficulty hooks
export const useCustomDifficulties = () => {
  const getRecentDifficulties = () => storageService.getRecentCustomDifficulties();

  return useQuery({
    queryKey: ['custom-difficulties'],
    queryFn: getRecentDifficulties,
    staleTime: 0, // Always fetch from localStorage
  });
};

// Game History hooks
export const useGameHistory = (limit: number = 20, offset: number = 0) => {
  return useQuery({
    queryKey: ['game-history', limit, offset],
    queryFn: () => gameHistoryService.getUserGameHistory(limit, offset),
    staleTime: 5 * 60 * 1000, // Consider stale after 5 minutes
  });
};

export const useLeaderboard = () => {
  const leaderboard = useAppSelector(selectLeaderboard);

  return {
    data: leaderboard,
    isLoading: false,
    error: null,
    refetch: () => {}, // No need to refetch from API
  };
};

// Hooks
export const useTriviaQuestion = (request: TriviaRequest) => {
  return useQuery({
    queryKey: triviaKeys.question(request),
    queryFn: () => apiService.getTrivia(request),
    staleTime: 0, // Always fetch fresh questions
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    retry: false, // Don't retry trivia questions
  });
};

// Specialized hook for game scenarios that returns a function to fetch trivia
export const useTriviaQuestionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: TriviaRequest) => apiService.getTrivia(request),
    onSuccess: (data, request) => {
      // Cache the result for potential reuse
      queryClient.setQueryData(triviaKeys.question(request), data);
    },
  });
};

export const useUserScore = (userId: string) => {
  return useQuery({
    queryKey: triviaKeys.score(userId),
    queryFn: () => apiService.getUserScore(),
    staleTime: 30 * 1000, // Consider stale after 30 seconds
    enabled: !!userId,
  });
};

// Validation hook
export const useValidateCustomDifficulty = () => {
  return (customText: string) => apiService.validateCustomDifficulty(customText);
};
```

## שכבת Context

### AudioContext (ב-App.tsx)
```typescript
import { createContext, useContext } from 'react';
import { audioService } from './services';

const AudioContext = createContext(audioService);

export const useAudio = () => useContext(AudioContext);

// שימוש ב-App.tsx:
<AudioContext.Provider value={audioService}>
  <AnimatedBackground>
    <AppRoutes />
  </AnimatedBackground>
    </AudioContext.Provider>
```

### GameContext (ב-HomeView.tsx)
```typescript
import { createContext, useContext } from 'react';
import { GameState } from '../../types';

const GameContext = createContext<{
  gameState: GameState;
  updateGameState: (updates: Partial<GameState> | ((prev: GameState) => GameState)) => void;
  handleAnswer: (i: number) => Promise<void>;
  loadNextQuestion: () => Promise<void>;
  handleGameEnd: () => void;
} | null>(null);

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

// שימוש ב-HomeView.tsx:
<GameContext.Provider value={gameContextValue}>
  {/* Game components */}
</GameContext.Provider>
```

## שכבת עסקים

הלוגיקה העסקית ממוקמת ב-`HomeView.tsx` באמצעות `GameContext` ולא ב-hooks נפרדים.

### Game Logic (ב-HomeView.tsx)
```typescript
// הלוגיקה העסקית ממוקמת ב-HomeView.tsx
const handleAnswer = async (i: number) => {
  // לוגיקת מענה על שאלה
};

const loadNextQuestion = async () => {
  // לוגיקת טעינת שאלה הבאה
};

const handleGameEnd = () => {
  // לוגיקת סיום משחק
};
```

## שכבת UI

### useCustomAnimations Hook
```typescript
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ACCESSIBILITY_CONFIG,
  ANIMATION_CONFIG,
  PERFORMANCE_CONFIG,
} from '../../../constants/ui/animation.constants';

export function useCustomAnimations() {
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef<number>();
  const lastUpdateRef = useRef<number>(0);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setIsReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Optimized animation loop
  const createAnimationLoop = useCallback(
    (
      callback: (timestamp: number) => void,
      options: {
        fps?: number;
        enabled?: boolean;
      } = {}
    ) => {
      const { fps = PERFORMANCE_CONFIG.FPS.TARGET, enabled = true } = options;
      const interval = 1000 / fps;

      if (!enabled || isReducedMotion) {
        return () => {
          // No-op function when animations are disabled
        };
      }

      const animate = (timestamp: number) => {
        if (timestamp - lastUpdateRef.current >= interval) {
          callback(timestamp);
          lastUpdateRef.current = timestamp;
        }
        animationRef.current = requestAnimationFrame(animate);
      };

      animationRef.current = requestAnimationFrame(animate);

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    },
    [isReducedMotion]
  );

  // Stagger animation utility
  const createStaggerAnimation = useCallback(
    (
      items: unknown[],
      baseDelay: number = ANIMATION_CONFIG.STAGGER.NORMAL,
      options: {
        direction?: 'forward' | 'reverse' | 'center';
        easing?: string;
      } = {}
    ) => {
      const { direction = 'forward', easing = 'ease-out' } = options;

      return items.map((_, index) => {
        let delay: number;

        switch (direction) {
          case 'reverse':
            delay = (items.length - 1 - index) * baseDelay;
            break;
          case 'center':
            const centerIndex = Math.floor(items.length / 2);
            delay = Math.abs(index - centerIndex) * baseDelay;
            break;
          default:
            delay = index * baseDelay;
        }

  return {
          delay,
          easing,
          index,
        };
      });
    },
    []
  );

  // Parallax effect utility
  const createParallaxEffect = useCallback(
    (
      speed: number = 0.5,
      options: {
        enabled?: boolean;
        threshold?: number;
      } = {}
    ) => {
      const { enabled = true } = options;

      if (!enabled || isReducedMotion) {
        return { x: 0, y: 0 };
      }

      const [offset, setOffset] = useState({ x: 0, y: 0 });

      useEffect(() => {
        const handleScroll = () => {
          const scrolled = window.pageYOffset;
          const rate = scrolled * speed;
          setOffset({ x: rate * 0.5, y: rate });
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
      }, [speed]);

      return offset;
    },
    [isReducedMotion]
  );

  // Intersection Observer utility for scroll-triggered animations
  const useIntersectionAnimation = useCallback(
    (
      options: {
        threshold?: number;
        rootMargin?: string;
        triggerOnce?: boolean;
      } = {}
    ) => {
      const { threshold = 0.1, rootMargin = '0px', triggerOnce = true } = options;
      const [isVisible, setIsVisible] = useState(false);
      const [hasTriggered, setHasTriggered] = useState(false);
      const elementRef = useRef<HTMLElement>(null);

      useEffect(() => {
        const observer = new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting && (!triggerOnce || !hasTriggered)) {
              setIsVisible(true);
              if (triggerOnce) setHasTriggered(true);
            } else if (!triggerOnce) {
              setIsVisible(false);
            }
          },
          { threshold, rootMargin }
        );

        if (elementRef.current) {
          observer.observe(elementRef.current);
        }

        return () => observer.disconnect();
      }, [threshold, rootMargin, triggerOnce, hasTriggered]);

      return { elementRef, isVisible };
    },
    []
  );

  // Cleanup function
  const cleanup = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    setIsAnimating(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // Memoized return values
  const returnValue = useMemo(
    () => ({
      // State
      isReducedMotion,
      isAnimating,

      // Utilities
      createAnimationLoop,
      createStaggerAnimation,
      createParallaxEffect,
      useIntersectionAnimation,

      // Cleanup
      cleanup,

      // Configuration
      config: {
        performance: PERFORMANCE_CONFIG,
        animation: ANIMATION_CONFIG,
        accessibility: ACCESSIBILITY_CONFIG,
      },
    }),
    [
      isReducedMotion,
      isAnimating,
      createAnimationLoop,
      createStaggerAnimation,
      createParallaxEffect,
      useIntersectionAnimation,
      cleanup,
    ]
  );

  return returnValue;
}
```

## שכבת כלים

### useDebounce Hook
```typescript
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Hook to debounce a value
 * @param value The value to debounce
 * @param delay The delay in milliseconds
 * @returns The debounced value
 */
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

/**
 * Hook to debounce a function with enhanced functionality
 * @param func The function to debounce
 * @param delay The delay in milliseconds
 * @param options Additional options for debouncing
 * @returns Object with debounced function and control methods
 */
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

      // Leading edge execution
      if (leading && !timeoutRef.current) {
        lastCallTimeRef.current = now;
        setIsPending(true);
        func(...args);
        return;
      }

      // Cancel existing timeout
      cancel();

      // Check if maxWait has been exceeded
      if (maxWait && timeSinceLastCall >= maxWait) {
        lastCallTimeRef.current = now;
        setIsPending(true);
        func(...args);
        return;
      }

      // Set new timeout for trailing execution
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

### usePrevious Hook
```typescript
import { useCallback, useEffect, useRef } from 'react';

/**
 * Hook to track the previous value of a state or prop
 * @param value The current value to track
 * @returns The previous value
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

/**
 * Hook to track multiple previous values with enhanced functionality
 * @param value The current value to track
 * @param count Number of previous values to keep
 * @returns Object with values array and utility functions
 */
export function usePreviousValues<T>(
  value: T,
  count: number = 5
): {
  values: T[];
  getPrevious: (index: number) => T | undefined;
  getAverage: () => number;
  hasChanged: boolean;
} {
  const ref = useRef<T[]>([]);
  const previousLength = ref.current.length;

  useEffect(() => {
    ref.current = [value, ...ref.current.slice(0, count - 1)];
  }, [value, count]);

  const getPrevious = useCallback((index: number) => {
    return ref.current[index] || undefined;
  }, []);

  const getAverage = useCallback(() => {
    if (ref.current.length === 0) return 0;
    const numericValues = ref.current.filter(v => typeof v === 'number') as number[];
    if (numericValues.length === 0) return 0;
    return numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length;
  }, []);

  return {
    values: ref.current,
    getPrevious,
    getAverage,
    hasChanged: ref.current.length !== previousLength,
  };
}

/**
 * Hook to track if a value has changed
 * @param value The value to track
 * @returns Object with current, previous, and hasChanged boolean
 */
export function useValueChange<T>(value: T): {
  current: T;
  previous: T | undefined;
  hasChanged: boolean;
} {
  const previous = usePrevious(value);

  return {
    current: value,
    previous,
    hasChanged: previous && previous !== value,
  };
}
```

### useRedux Hook
```typescript
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../../redux/store';

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
```

## שימוש משולב

### דוגמה לשימוש בשכבות
```typescript
import React from 'react';
import { useGame } from '../views/home/HomeView';
import { useAudio } from '../App';
import { useCustomAnimations } from '../hooks/layers/ui/useCustomAnimations';
import { useTriviaQuestionMutation } from '../hooks/api/useTrivia';

export const GameComponent: React.FC = () => {
  const { gameState, handleAnswer, loadNextQuestion } = useGame();
  const audioService = useAudio();
  const { createAnimationLoop } = useCustomAnimations();
  const triviaMutation = useTriviaQuestionMutation();

  const handleStartGame = async () => {
    audioService.play('click');
    createAnimationLoop((timestamp) => {
      // אנימציית התחלת משחק
    });
  };

  const handleAnswerSubmit = async (answer: string) => {
    await handleAnswer(parseInt(answer));
    
    if (gameState.isCorrect) {
      audioService.play('correct');
    } else {
      audioService.play('incorrect');
    }
  };

  return (
    <div>
      {/* תוכן המשחק */}
    </div>
  );
};
```

## יתרונות הארכיטקטורה

### 1. הפרדת אחריות
- כל שכבה מטפלת בהיבט ספציפי
- קל להבין ולשנות כל חלק בנפרד
- הפחתת תלויות בין רכיבים

### 2. נוח לתחזוקה
- קוד מאורגן ומובנה
- קל למצוא ולשנות פונקציונליות
- שימוש ב-React Query לניהול מצב שרת
- שימוש ב-Redux לניהול מצב מקומי

### 3. ביצועים
- אופטימיזציה של אנימציות
- ניהול זיכרון יעיל
- Cache חכם עם React Query

## הנחיות שימוש

### שמות Hooks
- `useLogin`, `useRegister`, `useCurrentUser` - קריאות API לאימות
- `useTriviaQuestion`, `useGameHistory`, `useLeaderboard` - קריאות API למשחק
- `usePointBalance`, `useCanPlay`, `usePurchasePoints` - קריאות API לנקודות
- `useCustomAnimations` - UI hooks
- `useDebounce`, `usePrevious` - Utility hooks

### החזרת ערכים
- החזרת אובייקט מפורש ולא מערך
- שימוש ב-React Query לניהול מצב async
- שימוש ב-Redux לניהול מצב גלובלי

### Context Usage
- AudioContext ב-App.tsx לניהול אודיו גלובלי
- GameContext ב-HomeView.tsx לניהול מצב משחק

### TypeScript Best Practices
- שימוש ב-`null` במקום `undefined` עבור refs (כמו `useRef<ReturnType<typeof setTimeout> | null>(null)`)
- שימוש ב-`error?: string` עבור שדות אופציונליים ב-Redux state
- בדיקות מפורשות: `if (timeoutRef.current)` במקום `if (timeoutRef.current)`

## בדיקות
- בדיקת Hooks טהורים עם React Testing Library
- בדיקת Context providers
- בדיקת אינטגרציה עם React Query

## הפניות
- מבנה שכבות מלא: `../ARCHITECTURE.md#ארכיטקטורת-frontend`
- ניהול State: `./STATE.md`
- API Reference: `../backend/API_REFERENCE.md`
 

