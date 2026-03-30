# ארכיטקטורת Hooks

## ארגון תיקיות

| תיקייה | תפקיד |
|--------|--------|
| `hooks/` (שורש) | אימות (`useAuth.ts`), קרדיטים (`useCredits.ts`), משתמש (`useUser.ts`), מרובה משתתפים (`useMultiplayer.ts`), אתחול (`useAppInitialization.ts`), אנליטיקה (`useAnalyticsDashboard.ts`) |
| `hooks/game/` | סשן משחק, טריוויה, סיכום |
| `hooks/admin/` | ניהול — תיקיית admin (מספר hooks לסטטיסטיקות ומשחק) |
| `hooks/audio/` | הגדרות ומצב אודיו |
| `hooks/ui/` | Toast, מודל, ניווט, טבלאות |

## Hooks מיוצאים מ־`hooks/index.ts` (דוגמאות)

אימות: `useLogin`, `useRegister`, `useCurrentUser`, `useHasToken`, `useIsAuthenticated`, `useUserRole`, `useCurrentUserData`, `useAuthLogoutHandler`, `useChangePassword`

קרדיטים: `useCanPlay`, `useCreditBalance`, `useCreditPackages`, `useDeductCredits`, `usePaymentHistory`, `usePurchaseCredits`

משחק: `useGameHistory`, `useGameSettingsForm`, `useTriviaQuestionMutation`, `useClearGameHistory`, `useDeleteGameHistory`, `useGameFinalization`, `useSingleSession`

משתמש: `useSetAvatar`, `useUploadAvatar`, `useUpdateUserProfile`, `useUserProfile`, `useUpdateUserPreferences`

אנליטיקה: `useGlobalDifficultyStats`, `useGlobalStats`, `useGlobalTrends`, `useGlobalLeaderboard`, `useLeaderboardByPeriod`, `useLeaderboardStats`, `usePopularTopics`, `useTrackAnalyticsEvent`, `useUnifiedUserAnalytics`, `useUserAnalytics`

אדמין (מ־`./admin`): `useAdminPricing`, `useBusinessMetrics`, `useClearAllLeaderboard`, `useUpdateAdminPricing`, `useClearAllUserStats`, `useSystemInsights`, `useSystemPerformanceMetrics`, `useSystemRecommendations`, `useSystemSecurityMetrics`, `useUserInsightsById`, `useUserPerformanceById`, `useUserRecommendationsById`, `useUserStatisticsById`, `useUserSummaryById`, `useAllTriviaQuestions`, `useClearAllGameHistory`, `useClearAllTrivia`, `useGameStatistics`, `useAllUsers`, `useUserSearch`, `useAiProviderStats`, `useAiProviderHealth`, `useCheckAllUsersConsistency`, `useCheckUserStatsConsistency`, `useFixUserStatsConsistency`

Redux: `useAppDispatch`, `useAppSelector`

אודיו: `useAudioSettings`, `useRouteBasedMusic`

מרובה משתתפים: `useMultiplayer`

UI: `useToast`, `useModalRoute`, `useNavigationAnalytics`, `useNavigationClose`, `useCountUp`, `usePagination`, `useClientTableState`

אתחול: `useAppInitialization`

## Hooks נוספים בקבצים (לא בהכרח ב-barrel)

ב־`useTrivia.ts`: `useStartGameSession`, `useSubmitAnswerToSession`, `useFinalizeGameSession` — לייבא מקובץ המקור כשצריך.

## שכבת React / ספריות

React (`useState`, `useEffect`, …), React Query (`useQuery`, `useMutation`), Redux (`useSelector`, `useDispatch`) משמשים בתוך ה-hooks למעלה.

## קישורים

- [STATE.md](./STATE.md)
- [SERVICES.md](./SERVICES.md)
