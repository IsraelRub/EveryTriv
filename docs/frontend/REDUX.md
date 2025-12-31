# Redux - Frontend

תיעוד מערכת Redux Toolkit לניהול מצב גלובלי ב-Frontend.

## סקירה כללית

המערכת משתמשת ב-**Redux Toolkit** לניהול מצב גלובלי עם persistence.

> **הערה:** תיעוד על React Query (ניהול מצב שרת) נמצא ב-[Hooks - Frontend](./HOOKS.md).

לדיאגרמות מפורטות, ראו: [דיאגרמות - Redux State](../DIAGRAMS.md#דיאגרמת-redux-state)

## Redux Store

### מבנה ה-Store

```typescript
{
  game: GameSliceState,
  user: UserState,
  stats: StatsState,
  favorites: FavoritesState,
  gameMode: GameModeState
}
```

### Slices

#### gameSlice
מצב המשחק הנוכחי:
- `state` - מצב המשחק (ClientGameState) עם:
  - `status` - סטטוס (idle, loading, playing, error)
  - `isPlaying` - האם המשחק פעיל
  - `currentQuestion` - אינדקס שאלה נוכחית
  - `totalQuestions` - מספר שאלות כולל
  - `questions` - רשימת שאלות (TriviaQuestion[])
  - `answers` - רשימת תשובות (number[])
  - `data` - נתוני משחק (GameData)
  - `stats` - סטטיסטיקות (GameSessionStats)
  - `loading` - מצב טעינה
- `gameHistory` - היסטוריית משחקים (GameHistoryEntry[])
- `leaderboard` - לוח תוצאות (LeaderboardEntry[])
- `isLoading` - מצב טעינה כללי
- `error` - שגיאות

#### userSlice
מצב המשתמש (persisted):
- `currentUser` - משתמש נוכחי (BasicUser | null)
- `avatar` - תמונת פרופיל
- `creditBalance` - מאזן קרדיטים (CreditBalance | null) עם:
  - `totalCredits` - קרדיטים כולל
  - `freeQuestions` - שאלות חינמיות
  - `purchasedCredits` - קרדיטים שנרכשו
  - `dailyLimit` - מגבלה יומית
  - `canPlayFree` - האם יכול לשחק חינם
  - `nextResetTime` - זמן איפוס הבא
- `isAuthenticated` - מצב אימות
- `isLoading` - מצב טעינה
- `error` - שגיאות

#### statsSlice
סטטיסטיקות משחק:
- `stats` - סטטיסטיקות משתמש (UserStatsResponse | null) עם:
  - `totalGames` - משחקים כולל
  - `averageScore` - ניקוד ממוצע
  - `totalScore` - ניקוד כולל
  - `topicsPlayed` - נושאים שניגנו (CountRecord)
  - `difficultyStats` - סטטיסטיקות לפי קושי (DifficultyBreakdown)
  - `achievements` - הישגים (Achievement[])
- `globalStats` - סטטיסטיקות גלובליות (UserStatsResponse | null)
- `leaderboard` - לוח תוצאות (LeaderboardEntry[])
- `isLoading` - מצב טעינה
- `error` - שגיאות

#### favoritesSlice
נושאים מועדפים (persisted):
- `topics` - רשימת נושאים (string[])
- `difficulties` - רשימת קשיים (string[])
- `games` - רשימת משחקים (string[])
- `favoriteTopics` - נושאים מועדפים (string[])
- `isLoading` - מצב טעינה
- `error` - שגיאות

#### gameModeSlice
מצב משחק והגדרות (persisted):
- `currentMode` - מצב משחק נוכחי (GameMode)
- `currentTopic` - נושא נוכחי
- `currentDifficulty` - קושי נוכחי (DifficultyLevel)
- `currentSettings` - הגדרות נוכחיות (GameConfig) עם:
  - `mode` - מצב משחק
  - `topic` - נושא
  - `difficulty` - קושי
  - `timeLimit` - מגבלת זמן
  - `questionLimit` - מגבלת שאלות
  - `settings` - הגדרות UI
- `isLoading` - מצב טעינה
- `error` - שגיאות

### Redux Persist

המערכת משתמשת ב-redux-persist לשמירת מצב ב-localStorage:

**User Slice Persist Config:**
```typescript
{
  key: 'user',
  storage: localStorage,
  whitelist: ['user']
}
```

**Favorites Slice Persist Config:**
```typescript
{
  key: 'favorites',
  storage: localStorage,
  whitelist: ['favorites']
}
```

**GameMode Slice Persist Config:**
```typescript
{
  key: 'gameMode',
  storage: localStorage,
  whitelist: ['currentSettings']
}
```

השדות שנשמרים:
- `userSlice` - רק `user` (לא כל ה-slice)
- `favoritesSlice` - רק `favorites` (לא כל ה-slice)
- `gameModeSlice` - רק `currentSettings` (לא כל ה-slice)


## Selectors

### Redux Selectors

```typescript
// Select current user
const currentUser = useSelector((state: RootState) => state.user.currentUser);

// Select game state
const gameState = useSelector((state: RootState) => state.game.state);

// Select stats
const stats = useSelector((state: RootState) => state.stats);

// Select favorites
const favorites = useSelector((state: RootState) => state.favorites.topics);
```

## Actions

### Redux Actions

```typescript
// Game actions
import { updateScore, resetGame } from '@redux/slices';

dispatch(updateScore({
  score: 100,
  timeSpent: 15,
  isCorrect: true,
  totalTime: 30,
  responseTime: 15
}));
dispatch(resetGame());

// User actions
import { setUser, setAvatar, setCreditBalance, deductCredits, setAuthenticated, logout } from '@redux/slices';

dispatch(setUser(user));
dispatch(setAuthenticated(true));
dispatch(setCreditBalance({
  balance: 1000,
  freeCredits: 20,
  purchasedCredits: 980,
  dailyLimit: 20,
  nextResetTime: '2024-01-02T00:00:00Z'
}));
dispatch(deductCredits(5));
dispatch(logout());

// Stats actions
import { setStats, setLeaderboard, resetStats } from '@redux/slices';

dispatch(setStats(userStatsResponse));
dispatch(setLeaderboard(leaderboardEntries));
dispatch(resetStats());

// Favorites actions
import { setFavorites, addFavorite, removeFavorite, clearFavorites } from '@redux/slices';

dispatch(setFavorites(['history:easy', 'science:medium']));
dispatch(addFavorite({ topic: 'history', difficulty: 'easy' }));
dispatch(removeFavorite(0));
dispatch(clearFavorites());

// GameMode actions
import { setGameMode, resetGameMode } from '@redux/slices';

dispatch(setGameMode({
  mode: GameMode.QUESTION_LIMITED,
  topic: 'history',
  difficulty: DifficultyLevel.MEDIUM,
  timeLimit: 300,
  questionLimit: 10
}));
dispatch(resetGameMode());
```

## הפניות

- [ארכיטקטורה כללית](../ARCHITECTURE.md)
- [דיאגרמת Redux State](../DIAGRAMS.md#דיאגרמת-redux-state)
- [דיאגרמת מבנה Frontend](../DIAGRAMS.md#דיאגרמת-מבנה-frontend)
- [Hooks - Frontend](./HOOKS.md) (כולל React Query)
- [רכיבים](./COMPONENTS.md)
