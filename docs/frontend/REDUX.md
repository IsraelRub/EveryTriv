# Redux - Frontend

תיעוד מערכת Redux Toolkit לניהול מצב UI מקומי ב-Frontend.

## סקירה כללית

המערכת משתמשת ב-**Redux Toolkit** לניהול מצב UI מקומי וסשן משחק.

> **שינוי ארכיטקטוני חשוב:** כל מצב שמגיע מהשרת (server state) מנוהל על ידי React Query בלבד. Redux משמש למצב UI מקומי שצריך persist (הגדרות משחק, הגדרות אודיו) ולמצב סשן משחק (game session, multiplayer).

> **הערה:** תיעוד על React Query (ניהול מצב שרת) נמצא ב-[Hooks - Frontend](./HOOKS.md).

לדיאגרמות מפורטות, ראו: [דיאגרמות - Redux State](../DIAGRAMS.md#דיאגרמת-redux-state)

## Redux Store

### מבנה ה-Store

```typescript
{
  gameMode: GameModeState,           // הגדרות משחק (persisted)
  gameSession: GameSessionState,     // מצב סשן משחק פעיל (לא persisted)
  multiplayer: MultiplayerState,     // מצב משחק מרובה משתתפים (לא persisted)
  audioSettings: AudioSettingsState,  // הגדרות אודיו (persisted)
  uiPreferences: UIPreferencesState   // העדפות UI (sessionStorage)
}
```

**הערה:** מצב משתמש, סטטיסטיקות, ומועדפים מנוהלים ב-React Query או לא קיימים.

### Slices

#### gameModeSlice
מצב משחק והגדרות (persisted ב-localStorage):
- `currentMode` - מצב משחק נוכחי (GameMode)
- `currentTopic` - נושא נוכחי
- `currentDifficulty` - קושי נוכחי (DifficultyLevel)
- `currentSettings` - הגדרות נוכחיות (GameConfig) עם:
  - `mode` - מצב משחק
  - `topic` - נושא
  - `difficulty` - קושי
  - `timeLimit` - מגבלת זמן
  - `maxQuestionsPerGame` - מגבלת שאלות
  - `answerCount` - מספר תשובות
- `isLoading` - מצב טעינה
- `error` - שגיאות

#### gameSessionSlice
מצב סשן משחק פעיל (לא persisted - session only):
- `gameId` - מזהה משחק
- `currentQuestionIndex` - אינדקס שאלה נוכחית
- `gameQuestionCount` - מספר שאלות במשחק
- `score` - ניקוד נוכחי
- `correctAnswers` - מספר תשובות נכונות
- `questions` - רשימת שאלות
- `questionsData` - נתוני שאלות
- `selectedAnswer` - תשובה נבחרת
- `answered` - האם ענה
- `streak` - רצף תשובות נכונות
- `loading` - מצב טעינה
- `loadingStep` - שלב טעינה
- `gameStartTime` - זמן התחלת משחק
- `timeSpent` - זמן שהושקע
- `isGameFinalized` - האם המשחק הושלם
- `creditsDeducted` - האם נוכו קרדיטים
- `lastScoreEarned` - ניקוד אחרון שהושג

#### multiplayerSlice
מצב משחק מרובה משתתפים (לא persisted - session only):
- `isConnected` - האם מחובר
- `room` - פרטי חדר
- `gameState` - מצב משחק
- `leaderboard` - לוח תוצאות
- `error` - שגיאות
- `isLoading` - מצב טעינה

#### audioSettingsSlice
הגדרות אודיו (persisted ב-localStorage):
- `volume` - עוצמת קול (0-1)
- `isMuted` - האם מושתק
- `soundEnabled` - האם צלילים מופעלים
- `musicEnabled` - האם מוזיקה מופעלת
- `isInitialized` - האם אותחל

#### uiPreferencesSlice
העדפות UI (persisted ב-sessionStorage):
- `leaderboardPeriod` - תקופת לוח תוצאות (GLOBAL/WEEKLY/MONTHLY)

### Redux Persist

המערכת משתמשת ב-redux-persist לשמירת מצב ב-localStorage ו-sessionStorage:

**GameMode Slice Persist Config (localStorage):**
```typescript
{
  key: 'gameMode',
  storage: localStorage,
  whitelist: ['currentSettings']
}
```

**AudioSettings Slice Persist Config (localStorage):**
```typescript
{
  key: 'audioSettings',
  storage: localStorage,
  whitelist: ['volume', 'isMuted', 'soundEnabled', 'musicEnabled']
}
```

**UIPreferences Slice Persist Config (sessionStorage):**
```typescript
{
  key: 'uiPreferences',
  storage: sessionStorage,
  whitelist: ['leaderboardPeriod']
}
```

**הערה:** 
- `gameSessionSlice` ו-`multiplayerSlice` לא persisted (session only)
- מצב משתמש, סטטיסטיקות, ומועדפים מנוהלים ב-React Query או לא קיימים.


## Selectors

### Redux Selectors

```typescript
// Game Mode Selectors
const gameMode = useAppSelector(selectCurrentGameMode);
const currentTopic = useAppSelector(selectCurrentTopic);
const currentDifficulty = useAppSelector(selectCurrentDifficulty);
const currentSettings = useAppSelector(selectCurrentSettings);

// Game Session Selectors
const gameId = useAppSelector(selectGameId);
const score = useAppSelector(selectGameScore);
const currentQuestion = useAppSelector(selectCurrentQuestion);
const currentQuestionIndex = useAppSelector(selectCurrentQuestionIndex);
const questions = useAppSelector(selectGameQuestions);
const timeSpent = useAppSelector(selectTimeSpent);

// Multiplayer Selectors
const isConnected = useAppSelector(selectIsConnected);
const room = useAppSelector(selectMultiplayerRoom);
const gameState = useAppSelector(selectMultiplayerGameState);
const leaderboard = useAppSelector(selectMultiplayerLeaderboard);

// Audio Settings Selectors
const volume = useAppSelector(selectVolume);
const isMuted = useAppSelector(selectIsMuted);
const soundEnabled = useAppSelector(selectSoundEnabled);
const musicEnabled = useAppSelector(selectMusicEnabled);

// UI Preferences Selectors
const leaderboardPeriod = useAppSelector(selectLeaderboardPeriod);
```

**הערה:** עבור מצב משתמש, סטטיסטיקות, ומועדפים, השתמש ב-React Query hooks:
```typescript
// במקום: useSelector((state: RootState) => state.user.currentUser)
const currentUser = useCurrentUserData();

// במקום: useSelector((state: RootState) => state.user.isAuthenticated)
const isAuthenticated = useIsAuthenticated();

// במקום: useSelector((state: RootState) => state.user.creditBalance)
const { data: creditBalance } = useCreditBalance();
```

## Actions

### Redux Actions

```typescript
import { 
  setGameMode, 
  resetGameMode,
  startGameSession,
  setQuestions,
  updateScore,
  moveToNextQuestion,
  finalizeGame,
  resetGameSession,
  setConnectionStatus,
  setRoom,
  updateGameState,
  setVolume,
  setMuted,
  toggleMute,
  setLeaderboardPeriod
} from '@/redux/slices';
import { useAppDispatch } from '@/hooks';

const dispatch = useAppDispatch();

// Game Mode Actions
dispatch(setGameMode({
  mode: GameMode.QUESTION_LIMITED,
  topic: 'history',
  difficulty: DifficultyLevel.MEDIUM,
  maxQuestionsPerGame: 10,
  timeLimit: 300,
  answerCount: 4
}));
dispatch(resetGameMode());

// Game Session Actions
dispatch(startGameSession({ gameId: '123', gameQuestionCount: 10 }));
dispatch(setQuestions({ questions: [...] }));
dispatch(updateScore({ score: 100, correctAnswers: 5 }));
dispatch(moveToNextQuestion());
dispatch(finalizeGame());
dispatch(resetGameSession());

// Multiplayer Actions
dispatch(setConnectionStatus(true));
dispatch(setRoom(roomData));
dispatch(updateGameState(gameState));

// Audio Settings Actions
dispatch(setVolume(0.8));
dispatch(setMuted(false));
dispatch(toggleMute());

// UI Preferences Actions
dispatch(setLeaderboardPeriod(LeaderboardPeriod.WEEKLY));
```

### מצב משתמש, סטטיסטיקות, ומועדפים

**כל מצב שמגיע מהשרת מנוהל ב-React Query:**
```typescript
// User state - React Query
const currentUser = useCurrentUserData();
const isAuthenticated = useIsAuthenticated();
const { data: creditBalance } = useCreditBalance();

// Stats - React Query
const { data: analytics } = useUserAnalytics();
const { data: leaderboard } = useGlobalLeaderboard();

// Favorites - לא קיים כרגע באפליקציה
// אם יתווסף בעתיד, ינוהל ב-React Query או Redux (תלוי בצורך)
```

### מצב משחק (Game Session)

**מצב המשחק מנוהל ב-Redux (`gameSessionSlice`):**
- זה session state שצריך להיות נגיש ממספר קומפוננטות
- לא persisted (session only) - אם המשתמש עוזב, זה בסדר לאבד
- כולל את כל המידע על המשחק הפעיל: שאלות, ניקוד, זמן, וכו'

```typescript
// מצב המשחק - ב-Redux
const gameId = useAppSelector(selectGameId);
const score = useAppSelector(selectGameScore);
const questions = useAppSelector(selectGameQuestions);
const currentQuestion = useAppSelector(selectCurrentQuestion);
// ... וכו'
```

## הפניות

- [ארכיטקטורה כללית](../ARCHITECTURE.md)
- [דיאגרמת Redux State](../DIAGRAMS.md#דיאגרמת-redux-state)
- [דיאגרמת מבנה Frontend](../DIAGRAMS.md#דיאגרמת-מבנה-frontend)
- [Hooks - Frontend](./HOOKS.md) (כולל React Query)
- [רכיבים](./COMPONENTS.md)
