# Refresh & Invalidation

This document describes when and how data is refreshed (refetch) or invalidated across the client, and where manual Refresh UI exists.

## Manual Refresh (buttons)

| Location | What it refreshes |
|----------|-------------------|
| **Admin Dashboard** — header "Refresh" | `invalidateAdminDashboardQueries` + `useRealTimeAnalytics` refetch. |
| **Admin Dashboard** — Games tab `GameStatisticsCard` | Game statistics (`useGameStatistics`). |
| **StatisticsView** — header "Refresh" | `invalidateGameQueries` (analytics, leaderboard, game history, etc.). |
| **ConsistencyManagementSection** | Refetch runs **after** "Fix" (per-user / all-users consistency). Not a dedicated "Refresh" button. |

## Automatic refresh

- **QueryClient defaults** (`queryClient.service.ts`): `refetchOnMount: true`, `refetchOnReconnect: true`, `refetchOnWindowFocus: false`.
- **Polling (`refetchInterval`)**:
  - `useRealTimeAnalytics`: 30s
  - `useAdminAnalytics` (selected queries): 5 min
  - `useAdminGame` (e.g. allTriviaQuestions): 30s
- **Invalidation after mutations**: auth (login/logout/OAuth/CompleteProfile), game completion (`useGameFinalization` → `invalidateAfterGameComplete`), credits (deduct/purchase), user updates, admin actions (recalculate analytics, fix consistency).

## Invalidation — `queryInvalidationService`

Domain-level invalidation goes through `queryInvalidationService`:

- `invalidateAuthQueries(queryClient)`
- `invalidateUserQueries(queryClient, userId?)`
- `invalidateCreditsQueries(queryClient, userId?)`
- `invalidateGameQueries(queryClient, userId?)`
- `invalidateAfterGameComplete(queryClient, userId)`
- `invalidateLeaderboardQueries(queryClient)`
- `invalidateAnalyticsQueries(queryClient, userId?)`

Direct `queryClient.invalidateQueries` remains only for ad-hoc or legacy cases (e.g. some admin hooks); those should be migrated when touching that code.

## Game completion → Statistics

Invalidation after a finished game is handled only in `useGameFinalization` → `invalidateAfterGameComplete`. **StatisticsView** does not perform any view-level invalidation on mount or navigation.

## refetchOnMount

- Use `refetchOnMount: false` when data is loaded "on the side" (e.g. `GameSettingsForm` analytics) or when polling / invalidation is enough.
- Use `refetchOnMount: true` or `'always'` when the primary view depends on the data and should stay fresh on mount (e.g. Statistics tabs, unified analytics).

## Refresh icon vs loading (Spinner)

- **Refresh buttons**: Use the shared `RefreshButton` component (see `components/ui/button.tsx`). It always shows a `RefreshCw` icon and spins it when `isLoading`. Used in `AdminDashboard`, `StatisticsView` (via `DashboardWithTabsLayout`), and `GameStatisticsCard`. For custom refresh UIs (e.g. `ConsistencyManagementSection` Fix), use `RefreshCw` — static when idle, `animate-spin` when loading.
- **Initial load, form submit, Processing**: Use `Spinner` (`Loader2`).
