# ניהול מצב בלקוח

## עקרון

| שכבה | טכנולוגיה | מתי |
|------|-----------|-----|
| מצב שרת (נתוני API) | TanStack React Query | רשימות, פרופיל, אנליטיקה, משחק |
| מצב גלובלי / UI / סשן | Redux Toolkit (+ persist לפי צורך) | משתמש מחובר, הגדרות, מרובה משתתפים |
| מצב UI מקומי | `useState` / context | מודלים, טפסים, אנימציית רענון |

## Redux

פירוט מבנה slices ו-selectors: [REDUX.md](./REDUX.md).

## React Query

- מפתחות שאילתות מרוכזים בקבועים (`QUERY_KEYS` וכו').
- Invalidation מרוכז דרך `queryInvalidationService` — ראו [REFRESH_INVALIDATION.md](./REFRESH_INVALIDATION.md).

## קישורים

- [HOOKS_ARCHITECTURE.md](./HOOKS_ARCHITECTURE.md)
- [../ARCHITECTURE.md](../ARCHITECTURE.md)
