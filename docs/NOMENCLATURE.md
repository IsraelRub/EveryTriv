# מוסכמות שמות — EveryTriv

## TypeScript / React

- **קומפוננטות React:** PascalCase (`HomeView`, `GameSessionHud`).
- **קבצי View:** סיומת `*View.tsx` (למעט `AdminDashboard.tsx`).
- **Hooks מותאמים:** קידומת `use` + PascalCase (`useMultiplayer`, `useCurrentUser`).
- **קבצי שירות:** `something.service.ts`; מחלקות שירות בשרת: `*Service`.

## NestJS

- **מודולים:** `*Module` (`AuthModule`, `GameModule`).
- **בקרים:** `*Controller`.
- **DTOs:** `*Dto` או שם תיאורי עם סיומת `.dto.ts`.

## שכבות

- **`shared/`:** טיפוסים וקבועים משותפים לקוח/שרת — מקור אמת לחוזים.
- **`client/src/types`:** טיפוסים ספציפיים ללקוח בלבד.
- **`server/src/internal`:** ישויות, מטמון, Redis, לוגים שרתיים.

## קישורים

- [README — סקירת המונורפו](../README.md)
- [ארכיטקטורת Hooks (Frontend)](./frontend/HOOKS_ARCHITECTURE.md)
