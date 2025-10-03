# Frontend Components Documentation

תיעוד כל רכיבי ה-UI של האפליקציה, כולל props, state, ושימוש.

> **מערכות נוספות**: למידע על [מערכת האנימציות](./ANIMATION_SYSTEM.md) ו-[מערכת האודיו](./AUDIO_SYSTEM.md) ראו את המסמכים המתאימים.

## סקירה כללית

האפליקציה משתמשת ב-React עם TypeScript ו-Tailwind CSS. הרכיבים מאורגנים בהיררכיה ברורה:

- **UI Components**: רכיבי UI בסיסיים
- **Feature Components**: רכיבים ספציפיים לתכונות
- **Layout Components**: רכיבי פריסה
- **Views**: דפי האפליקציה

## UI Components

### Button

רכיב כפתור מתקדם עם אנימציות וצלילים.

```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isGlassy?: boolean;
  withGlow?: boolean;
  withAnimation?: boolean;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  children: React.ReactNode;
  className?: string;
}
```

**דוגמת שימוש:**
```tsx
<Button 
  variant="primary" 
  size="md" 
  isGlassy={true}
  withGlow={true}
  withAnimation={true}
  onClick={handleClick}
>
  שמור
</Button>
```

### Card

רכיב כרטיס מתקדם עם אפקטי זכוכית.

```typescript
interface CardProps {
  isGlassy?: boolean;
  withGlow?: boolean;
  children: React.ReactNode;
  className?: string;
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}
```

**דוגמת שימוש:**
```tsx
<Card isGlassy={true} withGlow={true}>
  <CardHeader>
    <CardTitle>סטטיסטיקות</CardTitle>
  </CardHeader>
  <CardContent>
    <div>תוכן הכרטיס</div>
  </CardContent>
</Card>
```

### Modal

רכיב חלון קופץ מתקדם עם אפקטי זכוכית.

```typescript
interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  isGlassy?: boolean;
  disableEscapeKeyDown?: boolean;
  disableBackdropClick?: boolean;
  className?: string;
}
```

**דוגמת שימוש:**
```tsx
<Modal 
  open={isModalOpen} 
  onClose={() => setIsModalOpen(false)}
  size="md"
  isGlassy={true}
>
  <div className="p-6">
    <h2 className="text-xl font-bold mb-4">אישור פעולה</h2>
    <p>האם אתה בטוח?</p>
  </div>
</Modal>
```

### Input

רכיב שדה קלט מתקדם עם אנימציות ואפקטי זכוכית.

```typescript
interface UIInputProps {
  type?: 'text' | 'email' | 'password' | 'number';
  placeholder?: string;
  value?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  size?: 'sm' | 'md' | 'lg';
  isGlassy?: boolean;
  withAnimation?: boolean;
  className?: string;
}
```

**דוגמת שימוש:**
```tsx
<Input
  type="email"
  placeholder="כתובת אימייל"
  value={email}
  onChange={handleEmailChange}
  error={emailError}
  size="md"
  isGlassy={true}
  withAnimation={true}
  required
/>
```

### Select

רכיב בחירה מרשימה מתקדם עם אפקטי זכוכית.

```typescript
interface SelectOption {
  value: string;
  label: string;
}

interface UISelectProps {
  options: SelectOption[];
  value?: string;
  onChange?: (e: ChangeEvent<HTMLSelectElement>) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  isGlassy?: boolean;
  className?: string;
}
```

**דוגמת שימוש:**
```tsx
<Select
  options={[
    { value: 'easy', label: 'קל' },
    { value: 'medium', label: 'בינוני' },
    { value: 'hard', label: 'קשה' }
  ]}
  value={difficulty}
  onChange={handleDifficultyChange}
  size="md"
  isGlassy={true}
  placeholder="בחר קושי"
/>
```

### Avatar

רכיב תמונת פרופיל מתקדם עם מערכת fallback ו-retry.

```typescript
interface AvatarProps {
  src?: string;
  username?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  customSize?: number;
  className?: string;
  alt?: string;
  showLoading?: boolean;
  lazy?: boolean;
  onClick?: () => void;
  clickable?: boolean;
}
```

**דוגמת שימוש:**
```tsx
<Avatar 
  src={user.avatar} 
  username={user.username}
  fullName={user.fullName}
  size="md"
  showLoading={true}
  lazy={true}
  clickable={true}
  onClick={handleAvatarClick}
/>
```

## Feature Components

### Game Components

#### Game

רכיב משחק ראשי.

```typescript
interface GameProps {
  gameId: string;
  onGameComplete: (result: GameResult) => void;
  onGameAbandon: () => void;
}
```

**דוגמת שימוש:**
```tsx
<Game 
  gameId={currentGame.id}
  onGameComplete={handleGameComplete}
  onGameAbandon={handleGameAbandon}
/>
```

#### GameTimer

רכיב טיימר למשחק.

```typescript
interface GameTimerProps {
  timeLimit: number;
  onTimeUp: () => void;
  isRunning: boolean;
  onPause?: () => void;
  onResume?: () => void;
}
```

**דוגמת שימוש:**
```tsx
<GameTimer
  timeLimit={30}
  onTimeUp={handleTimeUp}
  isRunning={isGameActive}
  onPause={handlePause}
  onResume={handleResume}
/>
```

#### TriviaForm

טופס יצירת משחק טריוויה.

```typescript
interface TriviaFormProps {
  onSubmit: (data: CreateGameData) => void;
  loading?: boolean;
  defaultValues?: Partial<CreateGameData>;
}
```

**דוגמת שימוש:**
```tsx
<TriviaForm
  onSubmit={handleCreateGame}
  loading={isCreatingGame}
  defaultValues={{
    difficulty: 'medium',
    topics: ['science']
  }}
/>
```

#### TriviaGame

רכיב משחק טריוויה.

```typescript
interface TriviaGameProps {
  questions: Question[];
  onAnswer: (answer: AnswerData) => void;
  onComplete: (result: GameResult) => void;
  timeLimit?: number;
}
```

**דוגמת שימוש:**
```tsx
<TriviaGame
  questions={game.questions}
  onAnswer={handleAnswer}
  onComplete={handleComplete}
  timeLimit={30}
/>
```

### Auth Components

#### ProtectedRoute

רכיב הגנה על נתיבים.

```typescript
interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireSubscription?: boolean;
  fallback?: React.ReactNode;
}
```

**דוגמת שימוש:**
```tsx
<ProtectedRoute requireAuth requireSubscription>
  <PremiumContent />
</ProtectedRoute>
```

#### OAuthCallback

רכיב טיפול ב-OAuth callback.

```typescript
interface OAuthCallbackProps {
  onSuccess: (user: User) => void;
  onError: (error: string) => void;
}
```

**דוגמת שימוש:**
```tsx
<OAuthCallback
  onSuccess={handleAuthSuccess}
  onError={handleAuthError}
/>
```

#### CompleteProfile

טופס השלמת פרופיל.

```typescript
interface CompleteProfileProps {
  user: Partial<User>;
  onSubmit: (data: UserProfileData) => void;
  loading?: boolean;
}
```

**דוגמת שימוש:**
```tsx
<CompleteProfile
  user={user}
  onSubmit={handleCompleteProfile}
  loading={isUpdating}
/>
```

### User Components

#### UserProfile

רכיב פרופיל משתמש.

```typescript
interface UserProfileProps {
  user: User;
  onEdit?: () => void;
  showStats?: boolean;
  showAchievements?: boolean;
}
```

**דוגמת שימוש:**
```tsx
<UserProfile
  user={currentUser}
  onEdit={handleEditProfile}
  showStats
  showAchievements
/>
```

#### FavoriteTopics

רכיב ניהול נושאים מועדפים.

```typescript
interface FavoriteTopicsProps {
  topics: string[];
  onToggle: (topic: string) => void;
  availableTopics: string[];
}
```

**דוגמת שימוש:**
```tsx
<FavoriteTopics
  topics={user.preferences.topics}
  onToggle={handleToggleTopic}
  availableTopics={allTopics}
/>
```

#### UserStatsCard

כרטיס סטטיסטיקות משתמש.

```typescript
interface UserStatsCardProps {
  stats: UserStats;
  showDetails?: boolean;
  onViewDetails?: () => void;
}
```

**דוגמת שימוש:**
```tsx
<UserStatsCard
  stats={userStats}
  showDetails
  onViewDetails={handleViewDetails}
/>
```

## Layout Components

### Navigation

רכיב ניווט ראשי.

```typescript
interface NavigationProps {
  user?: User;
  onLogin: () => void;
  onLogout: () => void;
  onProfile: () => void;
}
```

**דוגמת שימוש:**
```tsx
<Navigation
  user={currentUser}
  onLogin={handleLogin}
  onLogout={handleLogout}
  onProfile={handleProfile}
/>
```

### Footer

רכיב כותרת תחתונה.

```typescript
interface FooterProps {
  showSocialLinks?: boolean;
  showLegalLinks?: boolean;
}
```

**דוגמת שימוש:**
```tsx
<Footer
  showSocialLinks
  showLegalLinks
/>
```

### GridLayout

רכיב פריסת רשת.

```typescript
interface GridLayoutProps {
  columns?: number;
  gap?: number;
  children: React.ReactNode;
  className?: string;
}
```

**דוגמת שימוש:**
```tsx
<GridLayout columns={3} gap={4}>
  <Card>תוכן 1</Card>
  <Card>תוכן 2</Card>
  <Card>תוכן 3</Card>
</GridLayout>
```

## Page Components (Views)

### HomeView

דף הבית.

```typescript
interface HomeViewProps {
  featuredGames?: Game[];
  userStats?: UserStats;
  onStartGame: () => void;
}
```

### UserView

דף משתמש.

```typescript
interface UserViewProps {
  userId?: string;
  onEditProfile: () => void;
  onViewStats: () => void;
}
```

### GameView

דף משחק.

```typescript
interface GameViewProps {
  gameId?: string;
  onGameComplete: (result: GameResult) => void;
  onGameAbandon: () => void;
}
```

### LeaderboardView

דף לוח תוצאות.

```typescript
interface LeaderboardViewProps {
  type?: 'global' | 'friends';
  onUserClick: (userId: string) => void;
}
```

### AnalyticsView

דף אנליטיקה.

```typescript
interface AnalyticsViewProps {
  userId?: string;
  timeRange?: 'week' | 'month' | 'year';
  onTimeRangeChange: (range: string) => void;
}
```

### PaymentView

דף תשלום.

```typescript
interface PaymentViewProps {
  subscriptionType?: 'monthly' | 'yearly';
  onPaymentSuccess: (subscription: Subscription) => void;
  onPaymentError: (error: string) => void;
}
```

## Hooks

### useGame

Hook לניהול משחק.

```typescript
function useGame(gameId?: string) {
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createGame = async (data: CreateGameData) => {
    // לוגיקת יצירת משחק
  };

  const submitAnswer = async (answer: AnswerData) => {
    // לוגיקת שליחת תשובה
  };

  const completeGame = async () => {
    // לוגיקת השלמת משחק
  };

  return {
    game,
    loading,
    error,
    createGame,
    submitAnswer,
    completeGame
  };
}
```

### useAuth

Hook לניהול אימות.

```typescript
function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const login = async (googleToken: string) => {
    // לוגיקת התחברות
  };

  const logout = async () => {
    // לוגיקת התנתקות
  };

  const updateProfile = async (data: UserProfileData) => {
    // לוגיקת עדכון פרופיל
  };

  return {
    user,
    loading,
    error,
    login,
    logout,
    updateProfile
  };
}
```

### useAnalytics

Hook לניהול אנליטיקה.

```typescript
function useAnalytics(userId?: string) {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async (timeRange: string) => {
    // לוגיקת אחזור סטטיסטיקות
  };

  const fetchLeaderboard = async (type: 'global' | 'friends') => {
    // לוגיקת אחזור לוח תוצאות
  };

  return {
    stats,
    loading,
    error,
    fetchStats,
    fetchLeaderboard
  };
}
```

## Styling

### Tailwind Classes

האפליקציה משתמשת ב-Tailwind CSS עם classes מותאמים אישית:

```css
/* Custom classes */
.btn-primary {
  @apply bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors;
}

.btn-secondary {
  @apply bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors;
}

.card {
  @apply bg-white rounded-lg shadow-md p-6 border border-gray-200;
}

.input {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500;
}
```

### Theme

האפליקציה משתמשת ב-theme מותאם:

```typescript
// theme.ts
export const theme = {
  colors: {
    primary: '#3B82F6',
    secondary: '#6B7280',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    background: '#F9FAFB',
    surface: '#FFFFFF',
    text: '#111827'
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem'
  },
  borderRadius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem'
  }
};
```

## Testing

### Component Tests

```typescript
// Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows loading state', () => {
    render(<Button loading>Click me</Button>);
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });
});
```

### Hook Tests

```typescript
// useGame.test.ts
import { renderHook, act } from '@testing-library/react';
import { useGame } from './useGame';

describe('useGame', () => {
  it('creates game successfully', async () => {
    const { result } = renderHook(() => useGame());

    await act(async () => {
      await result.current.createGame({
        difficulty: 'medium',
        topics: ['science'],
        questionCount: 10
      });
    });

    expect(result.current.game).toBeDefined();
    expect(result.current.loading).toBe(false);
  });
});
```

## Best Practices

### 1. Component Design
- השתמש ב-functional components
- השתמש ב-TypeScript עבור type safety
- הפרד בין logic ו-presentation
- השתמש ב-React.memo עבור optimization

### 2. Props Interface
- הגדר interfaces מפורשים
- השתמש ב-optional props כשצריך
- הוסף default values
- תיעד props עם JSDoc

### 3. State Management
- השתמש ב-Redux עבור global state
- השתמש ב-local state עבור UI state
- השתמש ב-custom hooks עבור shared logic
- הימנע מ-prop drilling

### 4. Styling
- השתמש ב-Tailwind CSS
- השתמש ב-custom classes עבור patterns חוזרים
- השתמש ב-CSS variables עבור theme
- הימנע מ-inline styles

### 5. Testing
- כתוב tests עבור כל component
- השתמש ב-React Testing Library
- Test user interactions
- Test error states

## Performance

### Optimization Techniques

1. **React.memo**: למניעת re-renders מיותרים
2. **useMemo**: לחישובים יקרים
3. **useCallback**: לפונקציות ב-props
4. **Lazy Loading**: לטעינת components על פי דרישה
5. **Code Splitting**: לחלוקת bundle

### Bundle Analysis

```bash
# ניתוח bundle size
npm run build
npm run analyze
```

### Performance Monitoring

```typescript
// Performance monitoring
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getFCP(console.log);
getLCP(console.log);
getTTFB(console.log);
```