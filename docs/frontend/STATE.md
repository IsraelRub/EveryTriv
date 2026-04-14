# ניהול מצב בלקוח

## עקרון

| שכבה | טכנולוגיה | מתי |
|------|-----------|-----|
| מצב שרת (נתוני API) | TanStack React Query | רשימות, פרופיל, אנליטיקה, משחק |
| מצב גלובלי / UI / סשן | Redux Toolkit (+ persist לפי צורך) | משתמש מחובר, הגדרות, מרובה משתתפים |
| מצב UI מקומי | `useState` / context | מודלים, טפסים, אנימציית רענון |

## Redux

מבנה slices ו־selectors: `client/src/redux/` (ספריות `features/`, `selectors.ts`, `store.ts`).

## React Query

- מפתחות שאילתות מרוכזים בקבועים (`QUERY_KEYS` וכו').
- Invalidation מרוכז דרך `client/src/services/infrastructure/queryInvalidation.service.ts`.

## קישורים

- [HOOKS_ARCHITECTURE.md](./HOOKS_ARCHITECTURE.md)
- [README — סקירת המונורפו](../../README.md)
