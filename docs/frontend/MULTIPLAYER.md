# Multiplayer Game - Frontend

## סקירה כללית

המערכת הקדמית למרובה משתתפים מספקת ממשק משתמש מלא למשחק סימולטני בזמן אמת. המערכת משתמשת ב-WebSocket לתקשורת עם השרת ומנהלת מצב מקומי ב-React hooks.

## REST Proxy לבדיקות

לצד ה-WebSocket, נוסף שכבת REST ייעודית לצורכי בדיקות וכלים אוטומטיים (Postman / Newman). כל קריאה מחזירה נתון תקף כך שמריצים לא נתקלים בשגיאות 404:

- `GET /multiplayer` – מחזיר פרטי חיבור (URL, namespace, דרישות אימות)
- `POST /multiplayer/rooms` – יוצר חדר ומחזיר `{ room, code }`
- `POST /multiplayer/rooms/join` – מצרף שחקן ומחזיר `{ room }`
- `POST /multiplayer/rooms/leave` – מנתק שחקן ומחזיר סטטוס (`player-left` / `room-closed`)
- `POST /multiplayer/rooms/start` – מפעיל משחק (host בלבד) ומחזיר את החדר המעודכן
- `POST /multiplayer/rooms/answer` – שולח תשובה ומחזיר תוצאה + דירוג
- `GET /multiplayer/rooms/:roomId` – מצב החדר עבור משתתפים קיימים
- `GET /multiplayer/rooms/:roomId/state` – מצב משחק מלא (שאלה נוכחית, טיימר, לוח מובילים)

כל הנתיבים (מלבד `GET /multiplayer`) דורשים JWT זהה ל-WebSocket, וכך ניתן להריץ את איסוף ה-endpoints ללא שגיאות.

## ארכיטקטורה

### WebSocket Service

`multiplayer.service.ts` מספק wrapper ל-Socket.IO client:

- ניהול חיבור WebSocket
- Event listeners
- Emit methods
- Reconnection logic

### Hooks

#### useMultiplayer

Hook ראשי לניהול חיבור ומצב מרובה משתתפים:

```typescript
const {
  isConnected,
  room,
  gameState,
  leaderboard,
  error,
  connect,
  disconnect,
  createRoom,
  joinRoom,
  leaveRoom,
  startGame,
  submitAnswer,
} = useMultiplayer();
```

**State:**
- `isConnected` - סטטוס חיבור
- `room` - מצב החדר הנוכחי
- `gameState` - מצב המשחק
- `leaderboard` - לוח תוצאות
- `error` - שגיאות

**Methods:**
- `connect()` - התחברות לשרת
- `disconnect()` - ניתוק
- `createRoom(config)` - יצירת חדר
- `joinRoom(roomId)` - הצטרפות לחדר
- `leaveRoom(roomId)` - יציאה מחדר
- `startGame(roomId)` - התחלת משחק
- `submitAnswer(roomId, questionId, answer, timeSpent)` - שליחת תשובה

#### useMultiplayerRoom

Hook מיוחד לניהול חדר:

```typescript
const {
  room,
  isLoading,
  isConnected,
  error,
  isHost,
  currentPlayer,
  isReadyToStart,
  createRoom,
  joinRoom,
  leaveRoom,
  startGame,
} = useMultiplayerRoom(roomId?);
```

**Computed Values:**
- `isHost` - האם המשתמש הוא host
- `currentPlayer` - השחקן הנוכחי
- `isReadyToStart` - האם החדר מוכן להתחיל

## Components

### PlayerList

מציג רשימת שחקנים בחדר.

**Props:**
```typescript
{
  players: Player[];
  currentUserId?: string;
  className?: string;
}
```

**Features:**
- הצגת שם, סטטוס וניקוד
- סימון host
- סימון שחקן נוכחי
- אנימציות

### LiveLeaderboard

מציג לוח תוצאות בזמן אמת.

**Props:**
```typescript
{
  leaderboard: Player[];
  currentUserId?: string;
  className?: string;
}
```

**Features:**
- מיון לפי ניקוד
- מדליות (🥇🥈🥉)
- עדכון בזמן אמת
- הדגשת שחקן נוכחי

### QuestionTimer

מציג טיימר לשאלה נוכחית.

**Props:**
```typescript
{
  timeRemaining: number;
  totalTime: number;
  onTimeout?: () => void;
  className?: string;
}
```

**Features:**
- טיימר עגול עם progress
- אזהרה בזמן נמוך (אדום)
- אנימציות

## Views

### MultiplayerLobbyView

מסך לובי ליצירה/הצטרפות לחדר.

**Routes:**
- `/multiplayer` - לובי ראשי

**Features:**
- יצירת חדר עם הגדרות
- הצטרפות לחדר לפי ID
- הצגת רשימת שחקנים
- כפתור התחלה (host only)

### MultiplayerGameView

מסך משחק פעיל.

**Routes:**
- `/multiplayer/game/:roomId` - משחק פעיל

**Features:**
- הצגת שאלה נוכחית
- בחירת תשובה
- טיימר
- לוח תוצאות בזמן אמת
- עדכון אוטומטי

### MultiplayerResultsView

מסך תוצאות סופיות.

**Routes:**
- `/multiplayer/results/:roomId` - תוצאות

**Features:**
- מנצח
- דירוג אישי
- לוח תוצאות מלא
- כפתורי המשך

## State Management

המערכת משתמשת ב-**local state** ב-hooks ולא ב-Redux:

- `useState` ב-`useMultiplayer` hook
- State מתעדכן דרך WebSocket events
- אין צורך ב-Redux עבור state זמני של משחק

## Event Flow

### יצירת חדר

1. משתמש מזין הגדרות
2. `createRoom()` נשלח
3. Server יוצר חדר
4. `room-created` event מתקבל
5. State מתעדכן
6. UI מציג את החדר

### הצטרפות לחדר

1. משתמש מזין room ID
2. `joinRoom()` נשלח
3. Server מוסיף שחקן
4. `room-joined` event מתקבל
5. `player-joined` event נשלח לכל השחקנים
6. State מתעדכן

### התחלת משחק

1. Host לוחץ "Start Game"
2. `startGame()` נשלח
3. Server מייצר שאלות
4. `game-started` event נשלח
5. `question-started` event נשלח
6. UI עובר למסך משחק

### שליחת תשובה

1. שחקן בוחר תשובה
2. `submitAnswer()` נשלח
3. Server מחשב נקודות
4. `answer-received` event נשלח
5. `leaderboard-update` event נשלח
6. UI מתעדכן

### סיום שאלה

1. טיימר מגיע ל-0 או כל השחקנים ענו
2. Server מחשב תוצאות
3. `question-ended` event נשלח
4. אם יש עוד שאלות: `question-started` נשלח
5. אם לא: `game-ended` נשלח
6. UI מתעדכן

## Error Handling

שגיאות מטופלות ב:
- `error` state ב-hook
- `error` event מ-server
- הצגת הודעות שגיאה ב-UI
- Logging ל-console

## Reconnection

המערכת תומכת ב-reconnection אוטומטי:
- Socket.IO מטפל ב-reconnection
- עד 5 ניסיונות
- Delay של 1 שנייה בין ניסיונות

## Performance

- Event listeners נרשמים פעם אחת
- State updates מותאמים (useCallback)
- אנימציות מותאמות (Framer Motion)
- אין re-renders מיותרים

## Dependencies

- `socket.io-client` - WebSocket client
- `react` - UI framework
- `framer-motion` - אנימציות
- `@tanstack/react-query` - לא בשימוש למרובה משתתפים

