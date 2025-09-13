# Frontend Structure (React)

תיעוד סטטי למבנה צד הלקוח.

## היררכיה כללית
```
client/src/
  components/      # רכיבי UI ותצוגה מורכבת
  views/           # דפי אפליקציה (Route Level)
  hooks/           # Hooks (שכבות: api / layers / contexts / utils)
  services/        # שירותי API / לוגיקה ממוקדת קריאות
  redux/           # Store + Slices (Features)
  constants/       # קבועים (UI / Navigation / Domain)
  types/           # טיפוסים ספציפיים ל-Frontend
  utils/           # פונקציות עזר ל-UI / פורמט
  styles/          # קבצי סגנון (Tailwind / Theme)
```

## Flow בסיסי
View → Hooks (Business/API) → Service → HTTP Client → Backend

## Services Pattern
```typescript
// api/http-client.ts
export const http = createHttpClient({ baseURL: '/api' });

// game/game.service.ts
export const gameService = {
  start(dto: StartGameDto) { return http.post('/game/start', dto); },
  answer(dto: SubmitAnswerDto) { return http.post('/game/answer', dto); },
};
```

## Hooks שכבתיים
| שכבה | דוגמה | אחריות |
|------|-------|---------|
| api | useGameApi | עטיפת קריאות שירות + ניהול טעינה/שגיאה |
| business | useGameLogic | אורקסטרציית מצב משחק + תזמון |
| ui | useOptimizedAnimations | אנימציות והתאמות ביצועים |
| utils | useDebounce | כלים טכניים קטנים |

## Redux (Minimal Slice Example)
```typescript
interface GameSliceState { current?: Question; score: number; }
const initial: GameSliceState = { score: 0 };

const gameSlice = createSlice({
  name: 'game',
  initialState: initial,
  reducers: {
    setQuestion(s, a: PayloadAction<Question|undefined>) { s.current = a.payload; },
    addScore(s, a: PayloadAction<number>) { s.score += a.payload; },
    reset: () => initial,
  }
});
```

## רכיבים
| סוג | תיקייה | דוגמאות |
|-----|--------|----------|
| בסיסיים | components/ui | Button / Card / Modal |
| משחק | components/game | GameBoard / Timer |
| ניווט | components/layout | Navbar / Sidebar |
| אנימציה | components/animation | AnimatedBackground |

## נגישות
- שימוש עקבי ב-aria-label
- Focus Trap במודאלים
- התאמות Reduced Motion (מדיניות גלובלית)

## קונסיסטנטיות טיפוסים
- שימוש ב-`shared` לטיפוסים משותפים.
- טיפוסים ייעודיים ל-UI נשמרים ב-`types/`.

## טעינת קוד
- Code Splitting באמצעות React.lazy ל-Views גדולים.
- Prefetch אסינכרוני לנתונים קריטיים.

---
 
