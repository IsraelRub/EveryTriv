# Routing (App Routes)

תיעוד סטטי לשכבת הניווט.

## עקרונות
- הפרדת הגדרת נתיבים בקובץ יחיד (AppRoutes.tsx).
- שימוש ב-Lazy Load למסכים כבדים.
- שמירה על שמות קבועים ב-ROUTES constants (shared/navigation אם רלוונטי).

## טבלת נתיבים
| נתיב | רכיב | מאובטח | תיאור |
|------|------|--------|--------|
| / | HomeView | לא | דף פתיחה |
| /game | GameView | כן | ממשק משחק |
| /leaderboard | LeaderboardView | לא | דירוגים |
| /profile | ProfileView | כן | פרופיל משתמש |
| /login | LoginView | לא | התחברות |

## דוגמת הגדרה
```typescript
const GameView = lazy(() => import('./views/game/GameView'));

export const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<HomeView/>} />
    <Route path="/game" element={<Protected><GameView/></Protected>} />
  </Routes>
);
```

## Protected Wrapper (עקרון)
```typescript
export function Protected({ children }: {children: React.ReactNode}) {
  const { profile } = useUserProfile();
  if (!profile) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
```

## ניהול מטא דאטה
- Title ו-Description מעודכנים ב-useEffect בכל View.

## שגיאות ניווט
- נתיב לא קיים → מסך 404 פשוט.

---
 
