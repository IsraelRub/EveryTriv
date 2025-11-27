# Routing (App Routes) - EveryTriv

## סקירה כללית

שכבת הניווט באפליקציה מבוססת על React Router ומאורגנת בקובץ יחיד (`AppRoutes.tsx`) המכיל את כל הנתיבים, הגנות, ומעקב ניווט.

לקשר לדיאגרמות: 
- [דיאגרמת Routes/Navigation](../DIAGRAMS.md#דיאגרמת-routesnavigation)
- [דיאגרמת Views מלאה](../DIAGRAMS.md#דיאגרמת-views-מלאה)

## מבנה הנתיבים

### נתיבים ציבוריים (Public Routes)

```typescript
<Route path='/' element={<HomeView />} />
<Route path='/game' element={<HomeView />} />
<Route path='/play' element={<HomeView />} />
<Route path='/start' element={<HomeView />} />
<Route path='/leaderboard' element={<LeaderboardView />} />
```

### נתיבי משחק (Game Routes)

```typescript
<Route path='/game/play' element={<GameSessionView />} />
<Route path='/game/summary' element={<GameSummaryView />} />
<Route path='/game/custom' element={<CustomDifficultyView />} />
```

### נתיבים מוגנים (Protected Routes)

נתיבים אלו דורשים אימות ומוגנים על ידי `ProtectedRoute`:

```typescript
<Route
  path='/profile'
  element={
    <ProtectedRoute>
      <UserProfile />
    </ProtectedRoute>
  }
/>
<Route
  path='/history'
  element={
    <ProtectedRoute>
      <GameHistory />
    </ProtectedRoute>
  }
/>
<Route
  path='/payment'
  element={
    <ProtectedRoute>
      <PaymentView />
    </ProtectedRoute>
  }
/>
<Route
  path='/credits'
  element={
    <ProtectedRoute>
      <PointsView />
    </ProtectedRoute>
  }
/>
<Route
  path='/complete-profile'
  element={
    <ProtectedRoute>
      <CompleteProfile />
    </ProtectedRoute>
  }
/>
<Route
  path='/analytics'
  element={
    <ProtectedRoute>
      <AnalyticsView />
    </ProtectedRoute>
  }
/>
<Route
  path='/settings'
  element={
    <ProtectedRoute>
      <SettingsView />
    </ProtectedRoute>
  }
/>
```

### נתיבי מנהל מערכת (Admin Routes)

```typescript
<Route
  path='/admin'
  element={
    <ProtectedRoute requiredRole={UserRole.ADMIN}>
      <AdminDashboard />
    </ProtectedRoute>
  }
/>
```

### נתיבים ציבוריים עם הפניה (Public Routes with Redirect)

נתיבים אלו מפנים למשתמשים מאומתים:

```typescript
<Route
  path='/login'
  element={
    <PublicRoute>
      <LoginView />
    </PublicRoute>
  }
/>
<Route
  path='/register'
  element={
    <PublicRoute>
      <RegistrationView />
    </PublicRoute>
  }
/>
```

### נתיבי OAuth

```typescript
<Route path='/auth/callback' element={<OAuthCallback />} />
```

### נתיבי שגיאה

```typescript
<Route path='/forgot-password' element={<NotFound />} />
<Route path='/unauthorized' element={<UnauthorizedView />} />
<Route path='*' element={<NotFound />} />
```

## טבלת נתיבים מלאה

| נתיב | רכיב | מאובטח | תפקיד נדרש | תיאור |
|------|------|--------|------------|--------|
| / | HomeView | לא | - | דף בית |
| /game | HomeView | לא | - | דף משחק (alias) |
| /play | HomeView | לא | - | דף משחק (alias) |
| /start | HomeView | לא | - | דף משחק (alias) |
| /leaderboard | LeaderboardView | לא | - | לוח מובילים |
| /game/play | GameSessionView | לא | - | מסך משחק פעיל |
| /game/summary | GameSummaryView | לא | - | סיכום משחק |
| /game/custom | CustomDifficultyView | לא | - | קושי מותאם |
| /profile | UserProfile | כן | - | פרופיל משתמש |
| /history | GameHistory | כן | - | היסטוריית משחקים |
| /payment | PaymentView | כן | - | תשלומים |
| /credits | CreditsView | כן | - | קרדיטים |
| /complete-profile | CompleteProfile | כן | - | השלמת פרופיל |
| /analytics | AnalyticsView | כן | - | אנליטיקה |
| /settings | SettingsView | כן | - | הגדרות |
| /admin | AdminDashboard | כן | ADMIN | לוח בקרה למנהל |
| /login | LoginView | לא | - | התחברות |
| /register | RegistrationView | לא | - | הרשמה |
| /auth/callback | OAuthCallback | לא | - | קריאת שוב OAuth |
| /forgot-password | NotFound | לא | - | שכחת סיסמה (placeholder) |
| /unauthorized | UnauthorizedView | לא | - | גישה לא מורשית |
| * | NotFound | לא | - | 404 |

## הגדרת Routes

### AppRoutes.tsx

```typescript
import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { UserRole } from '@shared/constants';
import { clientLogger as logger } from '@shared/services';
import { getErrorMessage, mergeUserPreferences } from '@shared/utils';
import {
  CompleteProfile,
  Footer,
  Navigation,
  NotFound,
  OAuthCallback,
  ProtectedRoute,
  PublicRoute,
} from './components';
import { useAppDispatch } from './hooks';
import { fetchUserData, setAuthenticated, setUser } from './redux/slices';
import { audioService, authService, prefetchAuthenticatedQueries } from './services';
import AdminDashboard from './views/admin/AdminDashboard';
import { AnalyticsView } from './views/analytics/AnalyticsView';
import CustomDifficultyView from './views/game/CustomDifficultyView';
import GameSessionView from './views/game/GameSessionView';
import GameSummaryView from './views/game/GameSummaryView';
import GameHistory from './views/gameHistory/GameHistory';
import HomeView from './views/home/HomeView';
import { LeaderboardView } from './views/leaderboard';
import LoginView from './views/login/LoginView';
import PaymentView from './views/payment';
import CreditsView from './views/credits/CreditsView';
import { RegistrationView } from './views/registration';
import SettingsView from './views/settings/SettingsView';
import UnauthorizedView from './views/unauthorized/UnauthorizedView';
import UserProfile from './views/user';

export default function AppRoutes() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const initAuth = async () => {
      if (await authService.isAuthenticated()) {
        try {
          const result = await dispatch(fetchUserData());
          if (fetchUserData.fulfilled.match(result)) {
            const user = result.payload;
            dispatch(setUser(user));
            dispatch(setAuthenticated(true));

            if ('preferences' in user && user.preferences) {
              const mergedPreferences = mergeUserPreferences(null, user.preferences);
              audioService.setUserPreferences(mergedPreferences);
            }

            try {
              await prefetchAuthenticatedQueries();
            } catch (error) {
              logger.apiError('Failed to prefetch authenticated queries', { error: getErrorMessage(error) });
            }
          }
        } catch (error) {
          logger.authError('Authentication initialization failed', {
            error: getErrorMessage(error),
          });
          authService.logout();
        }
      }
    };

    initAuth();
  }, [dispatch]);

  return (
    <div className='app-shell'>
      <NavigationTracker />
      <a
        href='#main-content'
        className='sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-slate-900 focus:text-white focus:rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:block'
      >
        Skip to main content
      </a>
      <Navigation />
      <main id='main-content' className='app-main' tabIndex={-1}>
        <Routes>
          {/* Routes definitions */}
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
```

## מעקב ניווט (Navigation Tracking)

### NavigationTracker Component

```typescript
function NavigationTracker() {
  const location = useLocation();

  useEffect(() => {
    logger.navigationPage(location.pathname, {
      search: location.search,
      timestamp: new Date().toISOString(),
      type: 'spa_navigation',
    });

    if (location.pathname === '/auth/google') {
      logger.navigationOAuth('Google', {
        path: location.pathname,
        timestamp: new Date().toISOString(),
      });
    }

    const validRoutes = [
      '/',
      '/game',
      '/game/play',
      '/game/summary',
      '/game/custom',
      '/play',
      '/start',
      '/profile',
      '/history',
      '/leaderboard',
      '/payment',
      '/credits',
      '/settings',
      '/register',
      '/login',
      '/admin',
      '/auth/callback',
      '/complete-profile',
      '/analytics',
    ];
    if (!validRoutes.includes(location.pathname) && !location.pathname.startsWith('/auth/')) {
      logger.navigationUnknownRoute(location.pathname, {
        referrer: document.referrer,
        timestamp: new Date().toISOString(),
        type: 'unknown_route',
      });
    }
  }, [location]);

  return null;
}
```

## Protected Route Component

### ProtectedRoute.tsx

```typescript
import { Navigate } from 'react-router-dom';
import { UserRole } from '@shared/constants';
import { useAppSelector } from '../hooks';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, currentUser } = useAppSelector(state => state.user);

  if (!isAuthenticated) {
    return <Navigate to='/login' replace />;
  }

  if (requiredRole && currentUser?.role !== requiredRole) {
    return <Navigate to='/unauthorized' replace />;
  }

  return <>{children}</>;
}
```

## Public Route Component

### PublicRoute.tsx

```typescript
import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../hooks';

interface PublicRouteProps {
  children: React.ReactNode;
}

export function PublicRoute({ children }: PublicRouteProps) {
  const { isAuthenticated } = useAppSelector(state => state.user);

  if (isAuthenticated) {
    return <Navigate to='/' replace />;
  }

  return <>{children}</>;
}
```

## אתחול אימות (Authentication Initialization)

האפליקציה מאתחלת אימות בעת טעינה:

```typescript
useEffect(() => {
  const initAuth = async () => {
    if (await authService.isAuthenticated()) {
      try {
        const result = await dispatch(fetchUserData());
        if (fetchUserData.fulfilled.match(result)) {
          const user = result.payload;
          dispatch(setUser(user));
          dispatch(setAuthenticated(true));

          if ('preferences' in user && user.preferences) {
            const mergedPreferences = mergeUserPreferences(null, user.preferences);
            audioService.setUserPreferences(mergedPreferences);
          }

          await prefetchAuthenticatedQueries();
        }
      } catch (error) {
        logger.authError('Authentication initialization failed', {
          error: getErrorMessage(error),
        });
        authService.logout();
      }
    }
  };

  initAuth();
}, [dispatch]);
```

## עקרונות עיצוב

### 1. הפרדת הגדרת נתיבים
- כל הנתיבים מוגדרים בקובץ יחיד (`AppRoutes.tsx`)
- קל למצוא ולעדכן נתיבים

### 2. שמירה על שמות קבועים
- נתיבים מוגדרים כקבועים בעת הצורך
- אין magic strings בקבצים אחרים

### 3. Lazy Loading
- רכיבים כבדים נטענים באופן עצלני בעת הצורך
- שימוש ב-React.lazy() ו-Suspense

### 4. ניהול מטא דאטה
- Title ו-Description מעודכנים ב-useEffect בכל View
- ניהול SEO בסיסי

## שגיאות ניווט

### נתיב לא קיים → מסך 404

```typescript
<Route path='*' element={<NotFound />} />
```

### גישה לא מורשית → מסך Unauthorized

```typescript
<Route path='/unauthorized' element={<UnauthorizedView />} />
```

## קישורים רלוונטיים

- מבנה Views: `./VIEWS.md`
- ניהול State: `./REDUX.md`
- Hooks: `./HOOKS.md`
- דיאגרמות: 
  - [דיאגרמת Routes/Navigation](../DIAGRAMS.md#דיאגרמת-routesnavigation)
  - [דיאגרמת Views מלאה](../DIAGRAMS.md#דיאגרמת-views-מלאה)
