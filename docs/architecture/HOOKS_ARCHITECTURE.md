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
│   └── useUser.ts         # ניהול משתמשים
├── contexts/              # שכבת Context
│   ├── AudioContext.tsx   # ניהול אודיו
│   └── PerformanceContext.tsx # ניהול ביצועים
└── layers/                # שכבות לוגיות
    ├── audio/             # שכבת אודיו
    │   ├── useScoreAchievementSounds.ts
    │   └── useUISounds.ts
    ├── business/          # שכבת עסקים
    │   ├── useGameLogic.ts
    │   ├── usePoints.ts
    │   └── useTriviaValidation.ts
    ├── ui/                # שכבת UI
    │   └── useOptimizedAnimations.ts
    └── utils/             # שכבת כלים
        ├── useAsync.ts
        ├── useDebounce.ts
        ├── useLocalStorage.ts
        ├── usePrevious.ts
        ├── useTimeout.ts
        └── useWindowSize.ts
```

## שכבת API

### useAuth Hook
```typescript
import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { authService } from '../services/auth.service';
import { setUser, clearUser } from '../redux/features/authSlice';

export const useAuth = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const dispatch = useDispatch();

  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await authService.login(credentials);
      dispatch(setUser(response.user));
      
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בהתחברות');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      dispatch(clearUser());
    } catch (err) {
      console.error('שגיאה בהתנתקות:', err);
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await authService.register(userData);
      dispatch(setUser(response.user));
      
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה ברישום');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // בדיקת אימות ראשונית
    const checkAuth = async () => {
      try {
        const user = await authService.getCurrentUser();
        if (user) {
          dispatch(setUser(user));
        }
      } catch (err) {
        console.error('שגיאה בבדיקת אימות:', err);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [dispatch]);

  return {
    login,
    logout,
    register,
    isLoading,
    error,
  };
};
```

### useTrivia Hook
```typescript
import { useState, useCallback } from 'react';
import { triviaService } from '../services/trivia.service';
import { Question, CreateQuestionParams } from '../types/game.types';

export const useTrivia = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createQuestion = useCallback(async (params: CreateQuestionParams): Promise<Question> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const question = await triviaService.createQuestion(params);
      return question;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'שגיאה ביצירת שאלה';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const submitAnswer = useCallback(async (questionId: string, answer: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await triviaService.submitAnswer(questionId, answer);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'שגיאה בשליחת תשובה';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getHistory = useCallback(async (filters?: HistoryFilters) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const history = await triviaService.getHistory(filters);
      return history;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'שגיאה בטעינת היסטוריה';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    createQuestion,
    submitAnswer,
    getHistory,
    isLoading,
    error,
  };
};
```

## שכבת Context

### AudioContext
```typescript
import React, { createContext, useContext, useState, useEffect } from 'react';

interface AudioContextType {
  isEnabled: boolean;
  volume: number;
  toggleAudio: () => void;
  setVolume: (volume: number) => void;
  playSound: (soundType: SoundType) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isEnabled, setIsEnabled] = useState(true);
  const [volume, setVolumeState] = useState(0.7);
  const [audioElements, setAudioElements] = useState<Map<SoundType, HTMLAudioElement>>(new Map());

  useEffect(() => {
    // טעינת אלמנטי אודיו
    const sounds: Record<SoundType, string> = {
      correct: '/sounds/correct.mp3',
      incorrect: '/sounds/incorrect.mp3',
      click: '/sounds/click.mp3',
      achievement: '/sounds/achievement.mp3',
    };

    const elements = new Map<SoundType, HTMLAudioElement>();
    
    Object.entries(sounds).forEach(([type, src]) => {
      const audio = new Audio(src);
      audio.preload = 'auto';
      elements.set(type as SoundType, audio);
    });

    setAudioElements(elements);
  }, []);

  const toggleAudio = () => {
    setIsEnabled(prev => !prev);
  };

  const setVolume = (newVolume: number) => {
    setVolumeState(newVolume);
    audioElements.forEach(audio => {
      audio.volume = newVolume;
    });
  };

  const playSound = (soundType: SoundType) => {
    if (!isEnabled) return;

    const audio = audioElements.get(soundType);
    if (audio) {
      audio.currentTime = 0;
      audio.volume = volume;
      audio.play().catch(err => {
        console.error('שגיאה בהשמעת אודיו:', err);
      });
    }
  };

  return (
    <AudioContext.Provider value={{
      isEnabled,
      volume,
      toggleAudio,
      setVolume,
      playSound,
    }}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};
```

### PerformanceContext
```typescript
import React, { createContext, useContext, useState, useCallback } from 'react';

interface PerformanceContextType {
  isLowPerformance: boolean;
  setPerformanceMode: (mode: 'low' | 'normal') => void;
  shouldReduceAnimations: boolean;
  shouldReduceParticles: boolean;
}

const PerformanceContext = createContext<PerformanceContextType | undefined>(undefined);

export const PerformanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLowPerformance, setIsLowPerformance] = useState(false);

  const setPerformanceMode = useCallback((mode: 'low' | 'normal') => {
    setIsLowPerformance(mode === 'low');
  }, []);

  const shouldReduceAnimations = isLowPerformance;
  const shouldReduceParticles = isLowPerformance;

  return (
    <PerformanceContext.Provider value={{
      isLowPerformance,
      setPerformanceMode,
      shouldReduceAnimations,
      shouldReduceParticles,
    }}>
      {children}
    </PerformanceContext.Provider>
  );
};

export const usePerformance = () => {
  const context = useContext(PerformanceContext);
  if (context === undefined) {
    throw new Error('usePerformance must be used within a PerformanceProvider');
  }
  return context;
};
```

## שכבת עסקים

### useGameLogic Hook
```typescript
import { useState, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTrivia } from '../api/useTrivia';
import { useAudio } from '../contexts/AudioContext';
import { 
  setQuestion, 
  updateScore, 
  setGameState,
  addToHistory 
} from '../redux/features/gameSlice';
import { RootState } from '../redux/store';
import { GameState, Question, GameResult } from '../types/game.types';

export const useGameLogic = () => {
  const dispatch = useDispatch();
  const { createQuestion, submitAnswer } = useTrivia();
  const { playSound } = useAudio();
  
  const gameState = useSelector((state: RootState) => state.game);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const startGame = useCallback(async (topic: string, difficulty: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      dispatch(setGameState({ isPlaying: true, topic, difficulty }));
      startTimeRef.current = Date.now();
      
      const question = await createQuestion({ topic, difficulty });
      dispatch(setQuestion(question));
      
      // התחלת טיימר
      if (gameState.gameMode.timeLimit) {
        timerRef.current = setTimeout(() => {
          endGame();
        }, gameState.gameMode.timeLimit * 1000);
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בהתחלת משחק');
    } finally {
      setIsLoading(false);
    }
  }, [createQuestion, dispatch, gameState.gameMode.timeLimit]);

  const submitAnswer = useCallback(async (answer: string) => {
    if (!gameState.currentQuestion) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const result = await submitAnswer(gameState.currentQuestion.id, answer);
      
      if (result.isCorrect) {
        playSound('correct');
        dispatch(updateScore(result.points));
      } else {
        playSound('incorrect');
      }
      
      // שמירת תוצאה
      const gameResult: GameResult = {
        questionId: gameState.currentQuestion.id,
        userAnswer: answer,
        isCorrect: result.isCorrect,
        points: result.points,
        timeSpent: startTimeRef.current ? Date.now() - startTimeRef.current : 0,
      };
      
      dispatch(addToHistory(gameResult));
      
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בשליחת תשובה');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [gameState.currentQuestion, submitAnswer, playSound, dispatch]);

  const endGame = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    
    dispatch(setGameState({ isPlaying: false }));
    startTimeRef.current = null;
  }, [dispatch]);

  const resetGame = useCallback(() => {
    endGame();
    dispatch(setQuestion(null));
    dispatch(updateScore(0));
  }, [endGame, dispatch]);

  return {
    startGame,
    submitAnswer,
    endGame,
    resetGame,
    isLoading,
    error,
    gameState,
  };
};
```

### usePoints Hook
```typescript
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateUserPoints, addPointsTransaction } from '../redux/features/userSlice';
import { RootState } from '../redux/store';
import { PointsTransaction } from '../types/user.types';

export const usePoints = () => {
  const dispatch = useDispatch();
  const userPoints = useSelector((state: RootState) => state.user.points);

  const calculatePoints = useCallback((difficulty: string, timeSpent: number, isCorrect: boolean) => {
    if (!isCorrect) return 0;

    const basePoints = {
      easy: 10,
      medium: 20,
      hard: 30,
    }[difficulty] || 10;

    // בונוס זמן - ככל שעונים מהר יותר, מקבלים יותר נקודות
    const timeBonus = Math.max(0, 30 - timeSpent) * 0.5;
    
    return Math.round(basePoints + timeBonus);
  }, []);

  const addPoints = useCallback((points: number, reason: string) => {
    dispatch(updateUserPoints(points));
    
    const transaction: PointsTransaction = {
      id: Date.now().toString(),
      amount: points,
      reason,
      timestamp: new Date().toISOString(),
    };
    
    dispatch(addPointsTransaction(transaction));
  }, [dispatch]);

  const getPointsHistory = useCallback(() => {
    // לוגיקה לקבלת היסטוריית נקודות
  }, []);

  return {
    userPoints,
    calculatePoints,
    addPoints,
    getPointsHistory,
  };
};
```

## שכבת UI

### useOptimizedAnimations Hook
```typescript
import { useState, useEffect, useCallback } from 'react';
import { usePerformance } from '../contexts/PerformanceContext';

export const useOptimizedAnimations = () => {
  const { shouldReduceAnimations } = usePerformance();
  const [isAnimating, setIsAnimating] = useState(false);

  const animateWithReducedMotion = useCallback((animationFn: () => void) => {
    if (shouldReduceAnimations) {
      // הפעלת אנימציה פשוטה יותר
      animationFn();
    } else {
      // הפעלת אנימציה מלאה
      setIsAnimating(true);
      animationFn();
      setTimeout(() => setIsAnimating(false), 1000);
    }
  }, [shouldReduceAnimations]);

  const shouldShowParticles = useCallback(() => {
    return !shouldReduceAnimations;
  }, [shouldReduceAnimations]);

  const getAnimationDuration = useCallback(() => {
    return shouldReduceAnimations ? 300 : 1000;
  }, [shouldReduceAnimations]);

  return {
    isAnimating,
    animateWithReducedMotion,
    shouldShowParticles,
    getAnimationDuration,
    shouldReduceAnimations,
  };
};
```

## שכבת כלים

### useAsync Hook
```typescript
import { useState, useCallback } from 'react';

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export const useAsync = <T>() => {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(async (asyncFunction: () => Promise<T>) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const result = await asyncFunction();
      setState({ data: result, loading: false, error: null });
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'שגיאה לא ידועה';
      setState({ data: null, loading: false, error: errorMessage });
      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
};
```

### useDebounce Hook
```typescript
import { useState, useEffect } from 'react';

export const useDebounce = <T>(value: T, delay: number): T => {
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
};
```

### useLocalStorage Hook
```typescript
import { useState, useEffect } from 'react';

export const useLocalStorage = <T>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('שגיאה בקריאה מ-localStorage:', error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error('שגיאה בכתיבה ל-localStorage:', error);
    }
  };

  return [storedValue, setValue] as const;
};
```

## שימוש משולב

### דוגמה לשימוש בשכבות
```typescript
import React from 'react';
import { useGameLogic } from '../hooks/layers/business/useGameLogic';
import { useAudio } from '../hooks/contexts/AudioContext';
import { useOptimizedAnimations } from '../hooks/layers/ui/useOptimizedAnimations';

export const GameComponent: React.FC = () => {
  const { startGame, submitAnswer, gameState, isLoading } = useGameLogic();
  const { playSound } = useAudio();
  const { animateWithReducedMotion } = useOptimizedAnimations();

  const handleStartGame = async () => {
    await startGame('היסטוריה', 'בינוני');
    playSound('click');
    animateWithReducedMotion(() => {
      // אנימציית התחלת משחק
    });
  };

  const handleAnswer = async (answer: string) => {
    const result = await submitAnswer(answer);
    
    if (result.isCorrect) {
      playSound('correct');
    } else {
      playSound('incorrect');
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
# ארכיטקטורת Hooks - EveryTriv

מסמך מצומצם: עקרונות מתקדמים בלבד. פירוט שכבות ודוגמאות בסיס מפורטים כבר ב-`../frontend/STATE.md` ו-`../frontend/STRUCTURE.md`.

## מטרות
- הפרדת אחריות (API / Business / UI / Utils / Context).
- הפחתת חזרות בלוגיקה עסקית בתוך רכיבים.
- קלות בדיקה (Unit + Integration) דרך פונקציות טהורות והחזרי מצב מפורשים.

## דפוסים מתקדמים
| דפוס | תיאור | שימוש |
|------|-------|-------|
| useComposableResource | Wrapper גנרי לטעינה / cache / שגיאה | איחוד קריאות ל-API דומות |
| useLayeredAsync | Pipeline של steps ממומשים כ-hooks פנימיים | Game Flow מורכב |
| useStabilizedCallback | מונע שינוי reference ע"י hash תלויים | אופטימיזציית rerender |
| useEventChannel | EventEmitter קל משקל בחזית | סינכרון בין רכיבי Game |

### דוגמה תמציתית: useComposableResource
```typescript
export function useComposableResource<T>(key: string, loader: () => Promise<T>) {
  const [state, set] = useState<{data?:T; error?:string; loading:boolean}>({loading:true});
  useEffect(() => {
    let active = true;
    loader()
      .then(data => active && set({ loading:false, data }))
      .catch(e => active && set({ loading:false, error: e.message }));
    return () => { active = false; };
  }, [key]);
  return state;
}
```

## הנחיות
- שמות hooks: `useDomainAction` (לוגיקה עסקית), `useUiSomething` (UI), `useApiX` (קריאות שרת).
- החזרת אובייקט מפורש ולא מערך (Self-documenting).
- הימנעות מאחסון refs לעומק אם ניתן לגזור ערך.
- Hooks Business לא קוראים DOM.

## בדיקות
- בדיקת Hooks טהורים עם React Testing Library + act.
- מדידת stable references (expect(fn1).toBe(fn2)).

## הפניות
- מבנה שכבות מלא: `../frontend/STRUCTURE.md`
- ניהול State: `../frontend/STATE.md`

---
 

