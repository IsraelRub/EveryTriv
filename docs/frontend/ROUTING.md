# ניתוב

## מיקום

- הגדרות מסלולים: `client/src/AppRoutes.tsx` (או שם קובץ מקביל בפרויקט)
- קבועי נתיבים: `client/src/constants/core/ui/navigation.constants.ts` — אובייקט `ROUTES`

## רכיבים

- `PublicRoute` — דפים ציבוריים; הפניה אם כבר מחובר (לפי לוגיקה)
- `ProtectedRoute` — דורש אימות
- `ModalRouteWrapper` — מסלולים במודל
- `NotFound` — 404

## קישורים

- [VIEWS.md](./VIEWS.md)
