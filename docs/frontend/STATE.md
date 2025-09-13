# Frontend State Management (Redux Toolkit)

תיעוד סטטי לשכבת ניהול המצב.

## מטרות
- מקור אמת יחיד (Single Source of Truth) עבור נתוני משחק/משתמש.
- הימנעות מהעברת Props עמוקה.
- גשר טיפוסים עם שכבת Shared.

## עקרונות
- כל Slice אחראי לתחום ברור.
- Reducers טהורים בלבד.
- Thunks/Async Logic מינימליים – העדפה ל-Hooks (business layer) מעל service.

## מבנה טיפוסי
```typescript
// store.ts
export const store = configureStore({
  reducer: {
    user: userSlice.reducer,
    game: gameSlice.reducer,
    points: pointsSlice.reducer,
    leaderboard: leaderboardSlice.reducer,
  },
  middleware: (gDM) => gDM({ serializableCheck: false })
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

## Slice דוגמה
```typescript
interface UserState { profile?: UserProfile; status: 'idle'|'loading'|'error'; }
const initial: UserState = { status: 'idle' };

const userSlice = createSlice({
  name: 'user',
  initialState: initial,
  reducers: {
    setProfile(s, a: PayloadAction<UserProfile|undefined>) { s.profile = a.payload; },
    setStatus(s, a: PayloadAction<UserState['status']>) { s.status = a.payload; },
    reset: () => initial,
  }
});
```

## בחירת גודל Slice
| קריטריון | החלטה |
|----------|--------|
| שיתוף נתון רחב | Slice ייעודי |
| מצב רגעי UI | useState מקומי |
| נתונים נגזרים | Selectors (memo) |

## Selectors
```typescript
export const selectUser = (s: RootState) => s.user.profile;
export const selectScore = (s: RootState) => s.game.score;
```

## Immutable Updates
RTK משתמש ב-Immer → כתיבה "מוטציה" ← תוצאה אימיוטבילית.

## טעינה אסינכרונית
Hook עסקי:
```typescript
export function useUserProfile() {
  const dispatch = useDispatch<AppDispatch>();
  const profile = useSelector(selectUser);
  const status = useSelector((s: RootState) => s.user.status);

  const load = useCallback(async () => {
    if (status === 'loading') return;
    dispatch(userSlice.actions.setStatus('loading'));
    try {
      const data = await userService.getProfile();
      dispatch(userSlice.actions.setProfile(data));
      dispatch(userSlice.actions.setStatus('idle'));
    } catch {
      dispatch(userSlice.actions.setStatus('error'));
    }
  }, [dispatch, status]);

  return { profile, status, load };
}
```

## אחידות טיפוסים
- שימוש ב-`shared` לישויות (UserProfile, TriviaQuestion).
- Slice לא יוצר טיפוסים חדשים אם קיימים Shared Types.

## כלי פיתוח
- DevTools Redux רק בסביבת פיתוח.
- Middleware מותאם נדרש? מוגדר מקומי ולא גלובלי.

---
 
