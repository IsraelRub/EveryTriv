# Types - Frontend

תיעוד כל הטיפוסים (Types) ב-Frontend, מאורגנים לפי תחומי אחריות.

לקשר לדיאגרמות:
- [דיאגרמת מבנה Frontend](../DIAGRAMS.md#דיאגרמת-מבנה-frontend)

## מבנה תיקיית Types

```
client/src/types/
├── api.types.ts                    # טיפוסי API
├── game/                           # טיפוסי משחק
│   ├── components.types.ts        # טיפוסי רכיבי משחק
│   ├── config.types.ts            # טיפוסי הגדרות משחק
│   └── index.ts                   # ייצוא מאוחד
├── hooks/                          # טיפוסי Hooks
│   └── toast.types.ts             # טיפוסי Toast Hook
├── interceptors.types.ts          # טיפוסי Interceptors
├── redux/                         # טיפוסי Redux
│   ├── actions.types.ts           # טיפוסי Actions
│   ├── async.types.ts             # טיפוסי Async
│   ├── state.types.ts             # טיפוסי State
│   └── index.ts                   # ייצוא מאוחד
├── route.types.ts                 # טיפוסי Routes
├── services/                      # טיפוסי Services
│   ├── logger.types.ts            # טיפוסי Logger Service
│   └── storage.types.ts           # טיפוסי Storage Service
├── ui/                            # טיפוסי UI
│   ├── analytics.types.ts         # טיפוסי Analytics UI
│   ├── audio.types.ts             # טיפוסי Audio UI
│   ├── base.types.ts              # טיפוסי בסיס UI
│   ├── error.types.ts             # טיפוסי Error UI
│   ├── featureHighlight.types.ts # טיפוסי Feature Highlight
│   ├── forms.types.ts             # טיפוסי Forms
│   ├── icon.types.ts              # טיפוסי Icon
│   ├── leaderboard.types.ts       # טיפוסי Leaderboard UI
│   ├── navigation.types.ts        # טיפוסי Navigation
│   ├── social.types.ts            # טיפוסי Social
│   ├── stats.types.ts             # טיפוסי Stats UI
│   ├── toast.types.ts             # טיפוסי Toast Component
│   └── index.ts                   # ייצוא מאוחד
├── user/                          # טיפוסי User
│   └── components.types.ts        # טיפוסי רכיבי User
├── user.types.ts                  # טיפוסי User
├── validation.types.ts            # טיפוסי Validation
└── index.ts                       # ייצוא מאוחד
```

## API Types

### api.types.ts

טיפוסי API service ו-responses:

**ManualPaymentPayload:**
```typescript
export interface ManualPaymentPayload {
  cardNumber: string;
  expiryMonth: number;
  expiryYear: number;
  cvv: string;
  cardHolderName: string;
  postalCode?: string;
  expiryDate?: string;
}
```

**PointsPurchaseRequest:**
```typescript
export interface PointsPurchaseRequest {
  packageId: string;
  paymentMethod: PaymentMethod;
  paypalOrderId?: string;
  paypalPaymentId?: string;
  manualPayment?: ManualPaymentPayload;
}
```

**PointsPurchaseResponse:**
```typescript
export interface PointsPurchaseResponse extends PaymentResult {
  balance?: CreditBalance;
}
```

**ClientApiService:**
Interface מלא עם כל ה-methods של API service:
- HTTP methods: `get`, `post`, `put`, `delete`
- Auth methods: `login`, `register`, `logout`, `refreshToken`
- User methods: `getCurrentUser`, `getUserProfile`, `updateUserProfile`, `deductCredits`, `searchUsers`
- Game history methods: `saveGameHistory`, `getUserGameHistory`, `deleteGameHistory`, `clearGameHistory`
- Leaderboard methods: `getLeaderboardEntries`, `getUserRank`, `getUserStats`, `updateUserRanking`, `getLeaderboardByPeriod`
- Credits methods: `getCreditBalance`, `getCreditPackages`, `canPlayCredits`, `deductCredits`, `getCreditHistory`, `confirmCreditPurchase`, `purchaseCredits`
- Trivia methods: `getTrivia`, `getTriviaQuestionById`, `getGameById`, `validateCustomDifficulty`
- Game session methods: `startGameSession`, `submitAnswerToSession`, `finalizeGameSession`
- Analytics methods: `getUserAnalytics`, `getPopularTopics`, `getDifficultyStats`, `trackAnalyticsEvent`, `getUserStatisticsById`, `getUserPerformanceById`, `getUserProgressById`, `getUserActivityById`, `getUserInsightsById`, `getUserRecommendationsById`, `getUserAchievementsById`, `getUserTrendsById`, `compareUserPerformanceById`, `getUserSummaryById`
- User preferences methods: `updateUserPreferences`
- Account management methods: `deleteUserAccount`, `updateUserField`, `updateSinglePreference`, `getUserById`, `updateUserCredits`, `deleteUser`, `updateUserStatus`
- Payment methods: `createPayment`, `getPaymentHistory`

## Game Types

### game/components.types.ts

טיפוסי רכיבי משחק:

**CurrentQuestionMetadata:**
```typescript
export interface CurrentQuestionMetadata {
  customDifficultyMultiplier?: number;
  actualDifficulty?: string;
  totalQuestions?: number;
}
```

**GameProps:**
```typescript
export interface GameProps {
  state: ClientGameState;
  onStateChange: (newState: ClientGameState) => void;
  trivia?: TriviaQuestion;
  selected?: number | null;
  gameMode?: GameModeConfig;
  onNewQuestion?: () => Promise<void>;
  onGameEnd?: () => void;
}
```

**TriviaGameProps:**
```typescript
export interface TriviaGameProps {
  question: TriviaQuestion;
  onComplete: (isCorrect: boolean, scoreEarned?: number) => void;
  timeLimit?: number;
}
```

**GameTimerProps:**
```typescript
export interface GameTimerProps {
  timer: GameTimerState;
  gameMode?: GameModeConfig;
  className?: string;
}
```

**TriviaFormProps:**
```typescript
export interface TriviaFormProps {
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  loading?: boolean;
  topic?: string;
  difficulty?: string;
  answerCount?: number;
  // ... עוד props
}
```

**ScoringSystemProps:**
```typescript
export interface ScoringSystemProps {
  currentStreak: number;
  score?: number;
  total?: number;
  topicsPlayed?: string[];
  difficultyStats?: DifficultyBreakdown;
  currentQuestionMetadata?: CurrentQuestionMetadata;
}
```

**LeaderboardProps:**
```typescript
export interface LeaderboardProps {
  entries?: {
    rank: number;
    email: string;
    score: number;
    avatar?: string;
  }[];
  onEntryClick?: (entry: { id: string; email: string; score: number; rank: number }) => void;
  className?: string;
  userId?: string;
}
```

### game/config.types.ts

טיפוסי הגדרות משחק:

**GameUISettings:**
```typescript
export interface GameUISettings {
  showTimer?: boolean;
  showProgress?: boolean;
  allowBackNavigation?: boolean;
}
```

**GameConfig:**
```typescript
export interface GameConfig extends Pick<GameModeConfig, 'mode' | 'timeLimit' | 'questionLimit'> {
  topic: string;
  difficulty: GameDifficulty;
  settings?: GameUISettings;
}
```

**ClientGameState:**
```typescript
export interface ClientGameState {
  status: 'idle' | 'loading' | 'playing' | 'paused' | 'completed' | 'error';
  isPlaying?: boolean;
  currentQuestion?: number;
  totalQuestions?: number;
  questions?: TriviaQuestion[];
  answers?: number[];
  data?: GameData;
  config?: GameConfig;
  stats?: GameSessionStats;
  error?: string;
  trivia?: TriviaQuestion;
  selected?: number | null;
  loading?: boolean;
  favorites?: FavoriteTopic[];
  gameMode?: GameModeConfig;
  streak?: number;
}
```

**GameModeState:**
```typescript
export interface GameModeState {
  currentMode: GameMode;
  currentTopic: string;
  currentDifficulty: DifficultyLevel;
  currentSettings: GameConfig;
  isLoading: boolean;
  error?: string;
}
```

**GameSessionStats:**
```typescript
export interface GameSessionStats {
  currentScore: number;
  maxScore: number;
  successRate: number;
  averageTimePerQuestion: number;
  correctStreak: number;
  maxStreak: number;
  topicsPlayed?: CountRecord;
  successRateByDifficulty?: DifficultyBreakdown;
  questionsAnswered: number;
  correctAnswers: number;
  totalGames: number;
  timeElapsed?: number;
}
```

## Interceptor Types

### interceptors.types.ts

טיפוסי Interceptors:

**EnhancedRequestConfig:**
```typescript
export interface EnhancedRequestConfig extends RequestInit {
  baseURL?: string;
  timeout?: number;
  signal?: AbortSignal;
  skipAuth?: boolean;
  skipRetry?: boolean;
  skipDeduplication?: boolean;
  requestId?: string;
}
```

**RequestInterceptor:**
```typescript
export type RequestInterceptor = (
  config: EnhancedRequestConfig
) => EnhancedRequestConfig | Promise<EnhancedRequestConfig>;
```

**ResponseInterceptor:**
```typescript
export type ResponseInterceptor = <T>(
  response: ApiResponse<T>
) => ApiResponse<T> | Promise<ApiResponse<T>>;
```

**ErrorInterceptor:**
```typescript
export type ErrorInterceptor = (error: ApiError) => ApiError | Promise<ApiError>;
```

**InterceptorOptions:**
```typescript
export interface InterceptorOptions {
  priority?: number;
  enabled?: boolean;
}
```

**RegisteredInterceptor:**
```typescript
export interface RegisteredInterceptor<T> {
  interceptor: T;
  options: InterceptorOptions;
  id: string;
}
```

## Redux Types

### redux/state.types.ts

טיפוסי Redux State:

**ClientValidationType:**
```typescript
export type ClientValidationType = 'password' | 'email' | 'topic' | 'customDifficulty' | 'language';
```
```

**RootState:**
```typescript
export interface RootState {
  gameMode: GameModeState;
}
```

**הערה:** יש 5 slices:
- `gameModeSlice` - מצב משחק והגדרות (persisted)
- `gameSessionSlice` - סשן משחק פעיל (לא persisted)
- `multiplayerSlice` - משחק מרובה משתתפים (לא persisted)
- `audioSettingsSlice` - הגדרות אודיו (persisted)
- `uiPreferencesSlice` - העדפות UI (persisted ב-sessionStorage)

מצב משתמש/סטטיסטיקות מנוהלים ב-React Query.
```

### redux/actions.types.ts

טיפוסי Redux Actions:

**FavoritePayload:**
```typescript
export interface FavoritePayload {
  type: 'topic' | 'difficulty' | 'game';
  value: string;
  action: 'add' | 'remove' | 'toggle';
  topic?: string;
  difficulty?: string;
}
```

**CreditBalancePayload:**
```typescript
export interface CreditBalancePayload {
  balance: number;
  purchasedCredits: number;
  freeCredits: number;
  lastUpdated: Date;
  dailyLimit?: number;
  nextResetTime?: string | null;
  points?: number;
}
```

**ScoreUpdatePayload:**
```typescript
export interface ScoreUpdatePayload {
  score: number;
  timeSpent: number;
  isCorrect: boolean;
  responseTime: number;
  correct?: boolean;
  totalTime?: number;
}
```

### redux/async.types.ts

טיפוסי Async Operations:

**הערה:** `BaseReduxState` הוסר - לא היה בשימוש.

**LoadingPayload:**
```typescript
export interface LoadingPayload {
  isLoading: boolean;
}
```

**ErrorPayload:**
```typescript
export interface ErrorPayload {
  error: string;
}
```

## Route Types

### route.types.ts

טיפוסי Routes:

**ProtectedRouteProps:**
```typescript
export interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole;
  redirectTo?: string;
}
```

**PublicRouteProps:**
```typescript
export interface PublicRouteProps {
  children: ReactNode;
  redirectTo?: string;
}
```

## Hooks Types

### hooks/toast.types.ts

טיפוסי Toast Hook:

**ToasterToast:**
```typescript
export type ToasterToast = ToastProps & {
  id: string;
  title?: ReactNode;
  description?: ReactNode;
  action?: ToastActionElement;
};
```

**ActionType:**
```typescript
export type ActionType = typeof TOAST_ACTION_TYPES;
```

**Action:**
```typescript
export type Action =
  | { type: ActionType['ADD_TOAST']; toast: ToasterToast; }
  | { type: ActionType['UPDATE_TOAST']; toast: Partial<ToasterToast>; }
  | { type: ActionType['DISMISS_TOAST']; toastId?: ToasterToast['id']; }
  | { type: ActionType['REMOVE_TOAST']; toastId?: ToasterToast['id']; };
```

**State:**
```typescript
export interface State {
  toasts: ToasterToast[];
}
```

**Toast:**
```typescript
export type Toast = Omit<ToasterToast, 'id'> & {
  duration?: number;
};
```

## Services Types

### services/logger.types.ts

טיפוסי Logger Service:

**ToastEnabledMethods:**
```typescript
export type ToastEnabledMethods = {
  readonly [key: string]: boolean | undefined;
};
```

מגדיר אילו מתודות של הלוגר צריכות להציג התראות toast.

### services/storage.types.ts

טיפוסי Storage Service:

**TypeGuard:**
```typescript
export type TypeGuard<T> = (value: unknown) => value is T;
```

Type guard גנרי לבדיקת טיפוסים ב-runtime.

## User Component Types

### user/components.types.ts

טיפוסי רכיבי User:

**CallbackStatus:**
```typescript
export type CallbackStatus = 'processing' | 'success' | 'error';
```

סטטוס של עיבוד OAuth callback.

**CompleteProfileProps:**
```typescript
export interface CompleteProfileProps {
  onComplete?: (data: { username: string; bio: string }) => void;
}
```

Props לרכיב השלמת פרופיל.

## UI Types

### ui/base.types.ts

טיפוסי בסיס UI:

**BaseComponentProps:**
```typescript
export interface BaseComponentProps {
  className?: string;
  id?: string;
  disabled?: boolean;
  children?: ReactNode;
}
```

**ButtonProps:**
```typescript
export interface ButtonProps extends BaseComponentProps {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: InteractiveSize;
  type?: 'button' | 'submit' | 'reset';
  loading?: boolean;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  isGlassy?: boolean;
  withGlow?: boolean;
  withAnimation?: boolean;
  title?: string;
}
```

**CardProps:**
```typescript
export interface CardProps extends BaseComponentProps, HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: Spacing;
  isGlassy?: boolean;
  withGlow?: boolean;
  onClick?: (event: MouseEvent<HTMLDivElement>) => void;
}
```

**ModalProps:**
```typescript
export interface ModalProps extends BaseComponentProps {
  open: boolean;
  onClose: () => void;
  size?: ModalSize;
  isGlassy?: boolean;
  disableEscapeKeyDown?: boolean;
  disableBackdropClick?: boolean;
}
```

**AlertModalProps:**
```typescript
export interface AlertModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  message: string;
  variant?: AlertVariant;
  buttonText?: string;
}
```

**ConfirmModalProps:**
```typescript
export interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: AlertVariant;
  isLoading?: boolean;
}
```

**AvatarProps:**
```typescript
export interface AvatarProps {
  src?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  size?: ComponentSize;
  customSize?: number;
  className?: string;
  alt?: string;
  showLoading?: boolean;
  lazy?: boolean;
  onClick?: () => void;
  clickable?: boolean;
}
```

**FeatureHighlightItem:**
```typescript
export interface FeatureHighlightItem {
  id: string;
  icon: string;
  label: string;
  description?: string;
  accent?: FeatureHighlightAccent;
}
```

### ui/forms.types.ts

טיפוסי Forms:

**FormField:**
```typescript
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'textarea' | 'select';
  validationType: ValidationType;
  required?: boolean;
  placeholder?: string;
  options?: SelectOption[];
  validationOptions?: ValidationHookOptions;
}
```

**ValidatedFormProps:**
```typescript
export interface ValidatedFormProps<T extends Record<string, string>> {
  fields: FormField[];
  initialValues?: T;
  title?: string;
  description?: string;
  submitText?: string;
  loading?: boolean;
  validationOptions?: ValidationHookOptions;
  onSubmit: (values: T, isValid: boolean) => void | Promise<void>;
  onCancel?: () => void;
  className?: string;
  isGlassy?: boolean;
  showValidationSummary?: boolean;
}
```

**ValidatedInputProps:**
```typescript
export interface ValidatedInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'size'> {
  validationType: ClientValidationType;
  initialValue?: string;
  validationOptions?: ValidationHookOptions | Pick<LanguageValidationOptions, 'enableSpellCheck' | 'enableGrammarCheck'>;
  onChange?: (value: string, isValid: boolean) => void;
  showValidationIcon?: boolean;
  showErrors?: boolean;
  renderError?: (error: string) => ReactNode;
  isGlassy?: boolean;
  size?: InteractiveSize;
  className?: string;
}
```

### ui/toast.types.ts

טיפוסי Toast Component:

**ToastProps:**
```typescript
export type ToastProps = {
  // Re-exported from @/components/ui/toast
};
```

**ToastActionElement:**
```typescript
export type ToastActionElement = {
  // Re-exported from @/components/ui/toast
};
```

טיפוסים אלה הם re-exports מהקומפוננטה `Toast` עצמה.

### ui/navigation.types.ts

טיפוסי Navigation:

**NavigationLink:**
```typescript
export interface NavigationLink {
  readonly label: string;
  readonly path: string;
}
```

**NavigationLinks:**
```typescript
export interface NavigationLinks {
  readonly main: ReadonlyArray<NavigationLink>;
  readonly authenticated: ReadonlyArray<NavigationLink>;
  readonly admin: ReadonlyArray<NavigationLink>;
  readonly footer: {
    readonly quick: ReadonlyArray<NavigationLink>;
  };
}
```

**NavigationMenuProps:**
```typescript
export interface NavigationMenuProps {
  links: ReadonlyArray<NavigationMenuLink>;
  audioControls: ReactNode;
  isAuthenticated: boolean;
  pointsDisplay?: string;
  totalCredits?: number;
  freeQuestions?: number;
  nextResetTime?: string | null;
  userDisplay?: NavigationUserDisplay;
  onLogout: () => void;
  onSignUp: () => void;
  onGoogleLogin: () => void;
  onGetMorePoints: () => void;
}
```

### ui/error.types.ts

טיפוסי Error:

**ErrorBoundaryProps:**
```typescript
export interface ErrorBoundaryProps {
  children: ReactNode;
  variant?: ErrorBoundaryVariant;
  featureName?: string;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}
```

### ui/icon.types.ts

טיפוסי Icon:

**IconProps:**
```typescript
export interface IconProps extends BaseComponentProps {
  name: string;
  size?: ComponentSize;
  color?: IconColor;
  animation?: IconAnimation;
  onClick?: (event: MouseEvent<SVGSVGElement>) => void;
  style?: CSSProperties;
}
```

**IconColor:**
```typescript
export type IconColor =
  | 'inherit'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'muted'
  | 'white'
  | 'black'
  | 'accent';
```

### ui/audio.types.ts

טיפוסי Audio:

**AudioServiceInterface:**
```typescript
export interface AudioServiceInterface {
  readonly isEnabled: boolean;
  readonly volume: number;
  setUserPreferences: (preferences: UserPreferences | null) => void;
  play: (key: AudioKey) => void;
  stop: (key: AudioKey) => void;
  // ... עוד methods
}
```

### ui/leaderboard.types.ts

טיפוסי Leaderboard:

**CardMetricProps:**
```typescript
export interface CardMetricProps {
  title: string;
  value: string;
  subtitle: string;
  icon: ReactNode | string;
  color: 'yellow' | 'blue' | 'green' | 'purple' | 'red';
  trend?: 'up' | 'down' | 'neutral';
}
```

### ui/analytics.types.ts

טיפוסי Analytics:

**ComparisonCardProps:**
```typescript
export interface ComparisonCardProps {
  title: string;
  userValue: number;
  averageValue: number;
  unit: string;
  higherIsBetter: boolean;
}
```

## User Types

### user.types.ts

טיפוסי User:

**UserLoginRequest:**
```typescript
export interface UserLoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}
```

**UserRegisterRequest:**
```typescript
export interface UserRegisterRequest extends AuthCredentials {
  confirmPassword: string;
  firstName?: string;
  lastName?: string;
  favoriteTopics?: string[];
  agreeToTerms: boolean;
}
```

## Validation Types

### validation.types.ts

טיפוסי Validation:

**ValidationHookOptions:**
```typescript
export interface ValidationHookOptions {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  customValidator?: (value: string) => boolean;
  errorMessage?: string;
}
```

**ClientValidationType:**
```typescript
export type ClientValidationType = 'password' | 'email' | 'topic' | 'customDifficulty' | 'language';
```

**ValidatorsMap:**
```typescript
export type ValidatorsMap = Record<ClientValidationType, UnifiedValidator>;
```

## Index

### index.ts

Barrel exports לכל ה-types:

```typescript
export * from './game';
export * from './ui';
export * from './redux';
export * from './hooks';
export * from './services';
export * from './user';
export * from './api.types';
export * from './interceptors.types';
export * from './user.types';
export * from './route.types';
export * from './validation.types';
```

**Usage:**
```typescript
import { 
  GameProps, 
  ClientGameState,
  ButtonProps,
  NavigationLink,
  RootState,
  UserLoginRequest
} from '@types';
```

## עקרונות עיצוב

### 1. ארגון לפי תחום
- כל type מאורגן לפי תחום אחריות
- תיקיות משנה רק אם יש מספר קבצים

### 2. Type Safety
- שימוש ב-interfaces עבור objects
- שימוש ב-types עבור unions ו-aliases
- שימוש ב-generics כאשר צריך

### 3. Consistency
- שמות עקביים בכל הטיפוסים
- מבנה אחיד לכל הקבצים
- Barrel exports ב-index.ts

## קישורים רלוונטיים

- [Constants - Frontend](./CONSTANTS.md)
- [Services - Frontend](./services/SERVICES.md)
- [Redux - Frontend](./REDUX.md)
- [Components - Frontend](./COMPONENTS.md)
- [דיאגרמות](../DIAGRAMS.md#דיאגרמת-מבנה-frontend)

