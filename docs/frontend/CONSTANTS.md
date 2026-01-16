# Constants - Frontend

תיעוד כל הקבועים (Constants) ב-Frontend, מאורגנים לפי תחומי אחריות.

לקשר לדיאגרמות:
- [דיאגרמת מבנה Frontend](../DIAGRAMS.md#דיאגרמת-מבנה-frontend)

## מבנה תיקיית Constants

```
client/src/constants/
├── audio.constants.ts              # קבועי אודיו
├── game/                           # קבועי משחק
│   ├── game-client.constants.ts    # קבועי משחק לקוח
│   ├── game-mode.constants.ts      # קבועי מצב משחק
│   ├── game-state.constants.ts     # קבועי מצב משחק
│   ├── mode.constants.ts           # קבועי מצבי משחק (GAME_MODES)
│   └── index.ts                    # ייצוא מאוחד
├── services/                       # קבועי Services
│   └── logger.constants.ts         # קבועי Logger Service (TOAST_ENABLED_METHODS)
├── storage.constants.ts            # קבועי אחסון
├── ui/                             # קבועי UI
│   ├── animation.constants.ts      # קבועי אנימציה
│   ├── auth.constants.ts           # קבועי אימות
│   ├── avatar.constants.ts         # קבועי אווטר
│   ├── footer.constants.ts         # קבועי footer
│   ├── form.constants.ts           # קבועי טופס
│   ├── navigation.constants.ts     # קבועי ניווט
│   ├── payment-ui.constants.ts    # קבועי תשלום UI
│   ├── size.constants.ts           # קבועי גדלים
│   ├── toast.constants.ts          # קבועי Toast (TOAST_LIMIT, TOAST_REMOVE_DELAY, etc.)
│   ├── variant.constants.ts        # קבועי וריאנטים
│   └── index.ts                    # ייצוא מאוחד
├── user-defaults.constants.ts      # ערכי ברירת מחדל למשתמש
└── index.ts                        # ייצוא מאוחד
```

## Audio Constants

### audio.constants.ts

קבועי אודיו למערכת השמע:

**AudioCategory Enum:**
```typescript
export enum AudioCategory {
  UI = 'UI',
  GAME = 'GAME',
  MUSIC = 'MUSIC',
  EFFECTS = 'EFFECTS',
  GAMEPLAY = 'GAMEPLAY',
  ACHIEVEMENT = 'ACHIEVEMENT',
}
```

**AudioKey Enum:**
- UI Sounds: `BUTTON_CLICK`, `HOVER`, `SUCCESS`, `ERROR`, `WARNING`, `NOTIFICATION`, `CLICK`, `SWIPE`, `POP`, `INPUT`, `PAGE_CHANGE`, `MENU_OPEN`, `MENU_CLOSE`
- Game Sounds: `CORRECT_ANSWER`, `WRONG_ANSWER`, `GAME_START`, `GAME_END`, `TIME_WARNING`, `COUNTDOWN`, `BEEP`, `ACHIEVEMENT`, `NEW_ACHIEVEMENT`, `LEVEL_UP`, `SCORE_STREAK`, `SCORE_EARNED`
- Background Music: `BACKGROUND_MUSIC`, `MENU_MUSIC`, `GAME_MUSIC`

**Constants:**
- `DEFAULT_CATEGORY_VOLUMES` - עוצמות ברירת מחדל לפי קטגוריה
- `AUDIO_CATEGORIES` - מיפוי AudioKey ל-AudioCategory
- `AUDIO_PATHS` - מיפוי AudioKey לנתיב קובץ
- `AUDIO_CONFIG` - הגדרות אודיו (volume, loop) לכל key

**Usage:**
```typescript
import { AudioKey, AUDIO_PATHS, AUDIO_CONFIG } from '@constants';

const audioPath = AUDIO_PATHS[AudioKey.CLICK];
const config = AUDIO_CONFIG[AudioKey.CLICK];
```

## Game Constants

### game/game-client.constants.ts

קבועי משחק ספציפיים ללקוח:

**SCORING_DEFAULTS:**
```typescript
export const SCORING_DEFAULTS = {
  BASE_POINTS: 100,
  STREAK: 0,
  DIFFICULTY: 'easy' as const,
  ANSWER_COUNT: 4,
  MAX_STREAK_BONUS: 10,
  STREAK_MULTIPLIER: 0.1,
  TIME_BONUS_MULTIPLIER: 0.5,
} as const;
```

### game/game-mode.constants.ts

קבועי מצב משחק:

**Constants:**
- `DEFAULT_QUESTION_LIMIT` - מגבלת שאלות ברירת מחדל (10)
- `UNLIMITED_QUESTIONS` - אינדיקטור שאלות ללא הגבלה (-1)
- `DEFAULT_TIME_LIMIT` - מגבלת זמן ברירת מחדל (60 שניות)
- `DEFAULT_GAME_MODE` - מצב משחק ברירת מחדל (`GameMode.QUESTION_LIMITED`)

**GAME_MODE_DEFAULTS:**
```typescript
export const GAME_MODE_DEFAULTS = {
  [GameMode.QUESTION_LIMITED]: {
    timeLimit: 0,
    questionLimit: DEFAULT_QUESTION_LIMIT,
  },
  [GameMode.TIME_LIMITED]: {
    timeLimit: DEFAULT_TIME_LIMIT,
    questionLimit: UNLIMITED_QUESTIONS,
  },
  [GameMode.UNLIMITED]: {
    timeLimit: 0,
    questionLimit: UNLIMITED_QUESTIONS,
  },
} as const;
```

### game/game-state.constants.ts

קבועי מצב משחק:

**DEFAULT_GAME_STATE:**
```typescript
export const DEFAULT_GAME_STATE: ClientGameState = {
  status: 'idle',
  isPlaying: false,
  currentQuestion: 0,
  totalQuestions: 0,
  questions: [],
  answers: [],
  loading: false,
  error: undefined,
  trivia: undefined,
  selected: null,
  streak: 0,
  favorites: [],
  gameMode: {
    mode: GameMode.UNLIMITED,
    timeLimit: undefined,
    questionLimit: undefined,
    isGameOver: false,
    timer: {
      isRunning: false,
      startTime: null,
      timeElapsed: 0,
    },
  },
  stats: {
    currentScore: 0,
    maxScore: 0,
    successRate: 0,
    averageTimePerQuestion: 0,
    correctStreak: 0,
    maxStreak: 0,
    topicsPlayed: {},
    successRateByDifficulty: {},
    questionsAnswered: 0,
    correctAnswers: 0,
    totalGames: 0,
  },
} as const;
```

**GAME_STATE_UPDATES:**
- `ANIMATION_DELAYS` - עיכובי אנימציה
- `PARTICLE_EFFECTS` - הגדרות אפקטי חלקיקים
- `VALIDATION` - הגדרות ולידציה

### game/mode.constants.ts

קבועי מצבי משחק:

**GameModeOption:**
```typescript
export interface GameModeOption {
  id: GameMode | 'multiplayer';
  name: string;
  description: string;
  icon: LucideIcon;
  showQuestionLimit: boolean;
  showTimeLimit: boolean;
}
```

**GAME_MODES:**
```typescript
export const GAME_MODES: GameModeOption[] = [
  {
    id: GameMode.QUESTION_LIMITED,
    name: 'Question Mode',
    description: 'Answer a set number of questions',
    icon: Target,
    showQuestionLimit: true,
    showTimeLimit: false,
  },
  {
    id: GameMode.TIME_LIMITED,
    name: 'Time Attack',
    description: 'Answer as many as you can in time',
    icon: Clock,
    showQuestionLimit: false,
    showTimeLimit: true,
  },
  {
    id: GameMode.UNLIMITED,
    name: 'Unlimited',
    description: 'Play as long as you want',
    icon: Infinity,
    showQuestionLimit: false,
    showTimeLimit: false,
  },
  {
    id: 'multiplayer',
    name: 'Multiplayer',
    description: 'Compete with friends',
    icon: Users,
    showQuestionLimit: false,
    showTimeLimit: false,
  },
];
```

**SINGLE_PLAYER_MODES:**
אותו כמו `GAME_MODES` אבל ללא מצב multiplayer.

**BASIC_TOPICS:**
```typescript
export const BASIC_TOPICS = [
  'General Knowledge',
  'Science',
  'History',
  'Geography',
] as const;
```

רשימת נושאים בסיסיים שתמיד זמינים לבחירה, ללא תלות בנתוני אנליטיקה. נושאים אלה מוצגים תמיד בדיאלוג בחירת הנושא.

## Services Constants

### services/logger.constants.ts

קבועי Logger Service:

**TOAST_ENABLED_METHODS:**
```typescript
export const TOAST_ENABLED_METHODS: ToastEnabledMethods = {
  // User-facing errors - always show toast
  userError: true,
  authError: true,
  systemError: true,
  apiError: true,
  gameError: true,
  paymentFailed: true,

  // User-facing warnings - show toast
  userWarn: true,
  securityWarn: true,

  // User-facing success messages - show toast
  authLogin: true,
  authRegister: true,
  authProfileUpdate: true,
  payment: true,
  providerSuccess: true,
};
```

מגדיר אילו מתודות של הלוגר צריכות להציג התראות toast למשתמש.

## Storage Constants

### storage.constants.ts

קבועי מפתחות אחסון:

**STORAGE_KEYS:**
```typescript
export const STORAGE_KEYS = {
  // Authentication (localStorage - persistent)
  AUTH_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  AUTH_USER: 'auth_user',

  // User data (localStorage - persistent)
  USER_ID: 'everytriv_user_id',
  GAME_PREFERENCES: 'everytriv_game_preferences',

  // Game data (localStorage - persistent)
  GAME_STATE: 'game_state',
  GAME_HISTORY: 'game_history',
  USER_PREFERENCES: 'user_preferences',
  CUSTOM_DIFFICULTIES: 'custom_difficulties',
  CUSTOM_DIFFICULTY_HISTORY: 'custom_difficulty_history',

  // UI state (localStorage - persistent)
  AUDIO_SETTINGS: 'audio_settings',
  AUDIO_VOLUME: 'audioVolume',
  SCORE_HISTORY: 'score_history',

  // Temporary data (sessionStorage - session only)
  REDIRECT_AFTER_LOGIN: 'redirectAfterLogin',
  ERROR_LOG: 'error-log',
  ACTIVE_GAME_SESSION: 'active_game_session',
} as const;
```

**STORAGE_KEYS:**
מפתחות אחסון מרכזיים

**Usage:**
```typescript
import { STORAGE_KEYS } from '@/constants/infrastructure/storage.constants';

const token = await storageService.getString(STORAGE_KEYS.AUTH_TOKEN);
```

## UI Constants

### ui/animation.constants.ts

קבועי אנימציה:

**ANIMATION_CONFIG:**
```typescript
export const ANIMATION_CONFIG = {
  DURATION: {
    NORMAL: 0.6,
    SLOW: 1.0,
  },
  EASING: {
    EASE_OUT: [0.4, 0, 0.2, 1],
  },
} as const;
```

**ACCESSIBILITY_CONFIG:**
```typescript
export const ACCESSIBILITY_CONFIG = {
  REDUCED_MOTION: {
    ENABLED: true,
    SCALE_FACTOR: 0.01,
  },
} as const;
```

### ui/auth.constants.ts

קבועי אימות:

**AUTH_VIEW_CLASSNAMES:**
Object עם class names לכל רכיבי מסך האימות (container, card, formColumn, וכו')

**LOGIN_FEATURE_HIGHLIGHTS:**
Array של `FeatureHighlightItem` עם תכונות התחברות

### ui/avatar.constants.ts

קבועי אווטר:

**AVATAR_SIZES:**
```typescript
export const AVATAR_SIZES: Record<ComponentSize, {
  classes: string;
  pixels: number;
}> = {
  [ComponentSize.XS]: { classes: 'w-6 h-6 text-xs', pixels: 24 },
  // ... עוד גדלים
};
```

**AVATAR_BACKGROUND_COLORS:**
Array של צבעי רקע לאווטרים עם initials

**AVATAR_CONFIG:**
- `MAX_RETRIES` - מספר ניסיונות מקסימלי
- `GRAVATAR_BASE_URL` - URL בסיס ל-Gravatar
- `GRAVATAR_DEFAULT` - ברירת מחדל ל-Gravatar

### ui/footer.constants.ts

קבועי footer:

**FOOTER_CLASSNAMES:**
Object עם class names לכל רכיבי ה-footer

**FOOTER_GRADIENTS:**
Object עם הגדרות גרדיאנטים

**FOOTER_LINK_GROUPS:**
- `quick` - קישורים מהירים (מ-NAVIGATION_LINKS.footer.quick)
- `meta` - קישורי מטא (Privacy Policy, Terms of Service)

**FOOTER_CONTACT:**
מ-`CONTACT_INFO` מ-shared constants

**FOOTER_SOCIAL_LINKS:**
מ-`SOCIAL_LINKS` מ-shared constants

### ui/form.constants.ts

קבועי טופס:

**REGISTRATION_FIELDS:**
Array של `FormField` עם הגדרות שדות טופס הרשמה:
- `username` - שם משתמש
- `email` - אימייל
- `password` - סיסמה
- `confirmPassword` - אימות סיסמה

**REGISTRATION_DEFAULT_VALUES:**
```typescript
export const REGISTRATION_DEFAULT_VALUES = {
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  difficulty: DifficultyLevel.MEDIUM,
  favoriteTopics: [],
  agreeToTerms: false,
} as const;
```

### ui/toast.constants.ts

קבועי Toast:

**TOAST_LIMIT:**
```typescript
export const TOAST_LIMIT = 3;
```

מספר מקסימלי של התראות toast להצגה בו-זמנית.

**TOAST_REMOVE_DELAY:**
```typescript
export const TOAST_REMOVE_DELAY = 300;
```

עיכוב לאחר אנימציית dismiss לפני הסרת toast מה-DOM (במילישניות).

**DEFAULT_TOAST_DURATION:**
```typescript
export const DEFAULT_TOAST_DURATION = 5000;
```

משך זמן ברירת מחדל להתראות toast עם auto-dismiss (במילישניות).

**TOAST_ACTION_TYPES:**
```typescript
export const TOAST_ACTION_TYPES = {
  ADD_TOAST: 'ADD_TOAST',
  UPDATE_TOAST: 'UPDATE_TOAST',
  DISMISS_TOAST: 'DISMISS_TOAST',
  REMOVE_TOAST: 'REMOVE_TOAST',
} as const;
```

סוגי פעולות ל-toast reducer.

### ui/navigation.constants.ts

קבועי ניווט:

**NAVIGATION_LINKS:**
```typescript
export const NAVIGATION_LINKS = {
  main: [
    { label: 'Start Game', path: '/' },
    { label: 'Leaderboard', path: '/leaderboard' },
  ],
  authenticated: [
    { label: 'Game History', path: '/history' },
    { label: 'Analytics', path: '/analytics' },
  ],
  admin: [{ label: 'Admin Dashboard', path: '/admin' }],
  footer: {
    quick: [
      { label: 'Start Game', path: '/' },
      { label: 'Game History', path: '/history' },
      { label: 'Leaderboard', path: '/leaderboard' },
      { label: 'Analytics', path: '/analytics' },
    ],
  },
} as const satisfies NavigationLinks;
```

**ROUTE_PATHS:**
```typescript
export const ROUTE_PATHS = {
  HOME: '/',
  GAME: '/game',
  LEADERBOARD: '/leaderboard',
  PAYMENT: '/payment',
  HISTORY: '/history',
  ANALYTICS: '/analytics',
  LOGIN: '/login',
  REGISTER: '/register',
  SETTINGS: '/settings',
} as const;
```

**NAVIGATION_CONFIG:**
```typescript
export const NAVIGATION_CONFIG = {
  ANIMATION_DURATION: 300,
  TRANSITION_TYPE: 'slide',
  ENABLE_BREADCRUMBS: true,
  SHOW_PROGRESS_INDICATOR: true,
} as const;
```

**NAVIGATION_CLASSNAMES:**
Object עם class names לכל רכיבי הניווט

**NAVIGATION_LINK_CLASSNAMES:**
Object עם class names לקישורי ניווט (base, active, inactive)

**NAVIGATION_BUTTON_CLASSNAMES:**
Object עם class names לכפתורי ניווט (ghost, primary, logout)

**NAVIGATION_AUDIO_CONTAINER_CLASSNAME:**
String עם class name לקונטיינר אודיו

**NAVIGATION_BRAND_CLASSNAMES:**
Object עם class names למותג/לוגו (link, logoWrapper, title, homeTitle, homeWrapper)

### ui/payment-ui.constants.ts

קבועי תשלום UI:

**PAYMENT_FEATURES:**
Object עם תכונות תשלום:
- `UNLIMITED_QUESTIONS` - שאלות ללא הגבלה
- `CUSTOM_DIFFICULTIES` - קשיים מותאמים
- `DAILY_FREE_QUESTIONS` - שאלות חינמיות יומיות
- `SUPPORT` - תמיכה 24/7

**PAYMENT_CONTENT:**
Object עם תוכן טקסט לדפי תשלום (HEADER, PACKAGES, PAYMENT, FEATURES, SUCCESS, LOADING, VALIDATION)

### ui/size.constants.ts

קבועי גדלים:

**BaseSize Enum:**
```typescript
export enum BaseSize {
  NONE = 'none',
  XS = 'xs',
  SM = 'sm',
  MD = 'md',
  LG = 'lg',
  XL = 'xl',
  XXL = 'xxl',
}
```

**ComponentSize Enum:**
מורש מ-BaseSize (XS, SM, MD, LG, XL, XXL)

**Spacing Enum:**
מורש מ-BaseSize (NONE, SM, MD, LG, XL, XXL)

**ModalSize Enum:**
SM, MD, LG, XL, FULL

**ContainerSize Enum:**
SM, MD, LG, XL, XXL, FULL

**InteractiveSize Type:**
`ComponentSize.SM | ComponentSize.MD | ComponentSize.LG`

### ui/variant.constants.ts

קבועי וריאנטים:

**ButtonVariant Enum:**
```typescript
export enum ButtonVariant {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  GHOST = 'ghost',
  DANGER = 'danger',
  ACCENT = 'accent',
}
```

**CardVariant Enum:**
GLASS, WHITE, TRANSPARENT, GRAY, SOLID, GRADIENT

**AlertVariant Enum:**
SUCCESS, ERROR, INFO, WARNING

**ErrorBoundaryVariant Enum:**
FULL, INLINE

## User Defaults

### user-defaults.constants.ts

ערכי ברירת מחדל למשתמש:

**USER_DEFAULT_VALUES:**
```typescript
export const USER_DEFAULT_VALUES = {
  status: UserStatus.ACTIVE,
  emailVerified: false,
  authProvider: 'local' as const,
  credits: 0,
  purchasedCredits: 0,
  totalCredits: 0,
  score: 0,
} as const;
```

**CREDIT_BALANCE_DEFAULT_VALUES:**
```typescript
export const CREDIT_BALANCE_DEFAULT_VALUES = {
  totalCredits: 0,
  freeQuestions: 0,
  purchasedCredits: 0,
  dailyLimit: 20,
  canPlayFree: false,
  nextResetTime: null,
} as const;
```

## Index

### index.ts

Barrel exports לכל ה-constants:

```typescript
export * from './ui';
export * from './audio.constants';
export * from './game';
export * from './services';
export * from './user-defaults.constants';
export * from './storage.constants';
```

**Usage:**
```typescript
import { 
  STORAGE_KEYS,
  AudioKey, 
  ButtonVariant,
  ComponentSize,
  NAVIGATION_LINKS,
  ROUTE_PATHS
} from '@constants';
```

## עקרונות עיצוב

### 1. ארגון לפי תחום
- כל קבוע מאורגן לפי תחום אחריות
- תיקיות משנה רק אם יש מספר קבצים

### 2. Type Safety
- שימוש ב-`as const` לברירת מחדל
- Enums עבור ערכים מוגבלים
- Types עבור ערכים מורכבים

### 3. Consistency
- שמות עקביים בכל הקבועים
- מבנה אחיד לכל הקבצים
- Barrel exports ב-index.ts

### 4. Re-exports
- כל ה-constants נגישים דרך `@constants`

## קישורים רלוונטיים

- [Types - Frontend](./TYPES.md)
- [Services - Frontend](./services/SERVICES.md)
- [Components - Frontend](./COMPONENTS.md)
- [דיאגרמות](../DIAGRAMS.md#דיאגרמת-מבנה-frontend)

