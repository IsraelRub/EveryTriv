# ארכיטקטורת Hooks

## ארגון תיקיות

| תיקייה | תפקיד |
|--------|--------|
| `hooks/` (שורש) | אימות, קרדיטים, משתמש, מרובה משתתפים, אנליטיקה — קבצי `use*.ts` לפי תחום |
| `hooks/game/` | סשן משחק, הגדרות משחק, סיכום, היסטוריה |
| `hooks/admin/` | ניהול (סטטיסטיקות משחק, שאלות טריוויה) |
| `hooks/audio/` | הגדרות ומצב אודיו |
| `hooks/ui/` | Toast, מודל, ניווט, טבלאות |

## ייבוא מרוכז — `client/src/hooks/index.ts`

רשימת הייצוא הציבורית (לעדכן לפי הקובץ במונורפו):

**אימות** (`./useAuth`): `useLogin`, `useRegister`, `useCurrentUser`, `useHasToken`, `useIsAuthenticated`, `useUserRole`, `useCurrentUserData`, `useChangePassword`

**קרדיטים** (`./useCredits`): `useCanPlay`, `useCreditBalance`, `useCreditPackages`, `useDeductCredits`, `usePaymentHistory`, `usePurchaseCredits`

**משחק** (`./game`): `useGameHistory`, `useGameSettingsForm`, `useGameFinalization`, `useSingleSession`

**משתמש** (`./useUser`): `useSetAvatar`, `useUploadAvatar`, `useUpdateUserProfile`, `useUserProfile`, `useUpdateUserPreferences`

**אנליטיקה** (`./useAnalyticsDashboard`): `useGlobalDifficultyStats`, `useGlobalStats`, `useGlobalTrends`, `useGlobalLeaderboard`, `useLeaderboardByPeriod`, `useLeaderboardStats`, `usePopularTopics`, `useTrackAnalyticsEvent`, `useUserAnalytics`

**אדמין** (`./admin`): `useAllTriviaQuestions`, `useGameStatistics`

**Redux** (`./useRedux`): `useAppDispatch`, `useAppSelector`

**אודיו** (`./audio`): `useAudioSettings`, `useRouteBasedMusic`

**מרובה משתתפים** (`./useMultiplayer`): `useMultiplayer`

**UI** (`./ui`): `useToast`, `toast`, `useModalRoute`, `useNavigationAnalytics`, `useNavigationClose`, `useCountUp`, `useClientTableState`, `usePagination`

## Hooks פנימיים / לא ב־barrel

לוגיקת משחק (טריוויה, סשן, שליחת תשובות) ממומשת בשירותים (`client/src/services/domain/game.service.ts` וכו') וב־views; hooks נוספים לפי צורך בקבצים תחת `hooks/` — לייבא מהמודול המקורי ולא להניח שם מ־barrel אם אין ייצוא.

## שכבת React / ספריות

React (מצב מקומי), TanStack React Query (`useQuery`, `useMutation`), Redux (`useSelector`, `useDispatch` דרך `useAppSelector` / `useAppDispatch`) משמשים בתוך ה-hooks.

## קישורים

- [STATE.md](./STATE.md)
- [רכיבי UI](./COMPONENTS.md)
