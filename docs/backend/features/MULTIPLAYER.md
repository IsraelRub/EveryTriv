# Multiplayer Game Feature

## סקירה כללית

מודול המרובה משתתפים מאפשר משחק טריוויה סימולטני בזמן אמת בין 2-4 שחקנים. המערכת משתמשת ב-WebSocket לתקשורת דו-כיוונית בזמן אמת ומספקת חוויית משחק סינכרונית.

## ארכיטקטורה

### WebSocket Gateway

המערכת משתמשת ב-`MultiplayerGateway` המבוסס על NestJS WebSocket Gateway עם Socket.IO:

- **Namespace**: `/multiplayer`
- **Authentication**: `WsAuthGuard` - אימות JWT לכל חיבורים
- **CORS**: מוגדר לתמיכה ב-credentials

### מבנה המודול

```
server/src/features/game/multiplayer/
├── multiplayer.module.ts      # הגדרת המודול
├── multiplayer.gateway.ts    # WebSocket Gateway
├── multiplayer.service.ts    # שירות ראשי
├── room.service.ts            # ניהול חדרים
├── game-state.service.ts      # ניהול מצב משחק
├── matchmaking.service.ts     # יצירת קוד חדר
└── dtos/                      # Data Transfer Objects
    ├── create-room.dto.ts
    ├── join-room.dto.ts
    ├── submit-answer.dto.ts
    ├── game-state.dto.ts
    └── player-status.dto.ts
```

## Services

### MultiplayerService

השירות הראשי המארגן את כל פעולות המרובה משתתפים:

- `createRoom()` - יצירת חדר חדש
- `joinRoom()` - הצטרפות לחדר קיים
- `leaveRoom()` - יציאה מחדר
- `startGame()` - התחלת משחק (host only)
- `getGameState()` - קבלת מצב משחק נוכחי
- `submitAnswer()` - שליחת תשובה
- `nextQuestion()` - מעבר לשאלה הבאה

### RoomService

מנהל את החדרים ב-Redis:

- יצירה, עדכון ומחיקה של חדרים
- ניהול רשימת שחקנים
- עדכון סטטוס חדר
- TTL של שעה לכל חדר
- `findRoomsByUserId()` - חיפוש חדרים לפי userId (משתמש ב-`getKeys()` מ-ServerStorageService)
- שימוש ב-`isMultiplayerRoom` type guard לוודא שהנתונים מ-Redis תקינים

### GameStateService

מנהל את מצב המשחק:

- אתחול משחק עם שאלות
- חישוב נקודות באמצעות `calculateAnswerScore` מ-`@shared/utils`
- ניהול תשובות שחקנים
- עדכון לוח תוצאות
- מעבר בין שאלות

### MatchmakingService

מטפל ב-matchmaking ידני:

- יצירת קוד חדר קצר (8 תווים ראשונים של UUID)
- בעתיד: חיפוש חדר לפי קוד

## WebSocket Events

### Client → Server

#### `create-room`
יצירת חדר חדש.

**Payload:**
```typescript
{
  topic: string;
  difficulty: GameDifficulty;
  requestedQuestions: number;
  maxPlayers: number;
  gameMode: GameMode;
}
```

**Response:** `room-created` event

#### `join-room`
הצטרפות לחדר קיים.

**Payload:**
```typescript
{
  roomId: string;
}
```

**Response:** `room-joined` event

#### `leave-room`
יציאה מחדר.

**Payload:**
```typescript
{
  roomId: string;
}
```

**Response:** `room-left` event

#### `start-game`
התחלת משחק (host only).

**Payload:**
```typescript
{
  roomId: string;
}
```

**Response:** `game-started` event

#### `submit-answer`
שליחת תשובה לשאלה.

**Payload:**
```typescript
{
  roomId: string;
  questionId: string;
  answer: number;
  timeSpent: number;
}
```

**Response:** `answer-received` event

### Server → Client

#### `room-created`
חדר נוצר בהצלחה.

```typescript
{
  room: MultiplayerRoom;
  code: string; // Short room code
}
```

#### `room-joined`
הצטרפות לחדר הצליחה.

```typescript
{
  room: MultiplayerRoom;
}
```

#### `player-joined`
שחקן חדש הצטרף לחדר.

```typescript
{
  type: 'player-joined';
  roomId: string;
  timestamp: Date;
  data: {
    player: Player;
    players: Player[];
  };
}
```

#### `player-left`
שחקן עזב את החדר.

```typescript
{
  type: 'player-left';
  roomId: string;
  timestamp: Date;
  data: {
    userId: string;
    players: Player[];
  };
}
```

#### `game-started`
המשחק התחיל.

```typescript
{
  type: 'game-started';
  roomId: string;
  timestamp: Date;
  data: {
    questions: TriviaQuestion[];
    config: RoomConfig;
  };
}
```

#### `question-started`
שאלה חדשה התחילה.

```typescript
{
  type: 'question-started';
  roomId: string;
  timestamp: Date;
  data: {
    question: TriviaQuestion;
    questionIndex: number;
    timeLimit: number;
  };
}
```

#### `answer-received`
תשובה התקבלה (broadcast לכל השחקנים).

```typescript
{
  type: 'answer-received';
  roomId: string;
  timestamp: Date;
  data: {
    userId: string;
    questionId: string;
    isCorrect: boolean;
    scoreEarned: number;
    leaderboard: Player[];
  };
}
```

#### `question-ended`
שאלה הסתיימה.

```typescript
{
  type: 'question-ended';
  roomId: string;
  timestamp: Date;
  data: {
    questionId: string;
    correctAnswer: number;
    results: Array<{
      userId: string;
      isCorrect: boolean;
      scoreEarned: number;
    }>;
    leaderboard: Player[];
  };
}
```

#### `game-ended`
המשחק הסתיים.

```typescript
{
  type: 'game-ended';
  roomId: string;
  timestamp: Date;
  data: {
    finalLeaderboard: Player[];
    winner: Player | null;
    gameDuration: number;
  };
}
```

#### `leaderboard-update`
עדכון לוח תוצאות.

```typescript
{
  type: 'leaderboard-update';
  roomId: string;
  timestamp: Date;
  data: {
    leaderboard: Player[];
  };
}
```

#### `error`
שגיאה התרחשה.

```typescript
{
  type: 'error';
  roomId: string;
  timestamp: Date;
  data: {
    message: string;
    code?: string;
  };
}
```

## Authentication

כל חיבורי WebSocket דורשים אימות JWT באמצעות `WsAuthGuard`:

1. Token מועבר ב-`auth.token` או `query.token` ב-handshake
2. Guard מאמת את ה-token
3. User payload מוצמד ל-`client.handshake.user`

### Parameter Decorators

- `@WsCurrentUserId()` - מחזיר את ה-user ID
- `@WsCurrentUser()` - מחזיר את כל ה-user payload
- `@ConnectedSocket()` - מחזיר את ה-Socket instance

## ניהול מצב

### Redis Storage

חדרים נשמרים ב-Redis עם:
- **Key Pattern**: `multiplayer:room:{roomId}`
- **TTL**: 3600 שניות (שעה)
- **Format**: JSON serialized `MultiplayerRoom`

### Room Lifecycle

1. **waiting** - החדר ממתין לשחקנים
2. **starting** - המשחק מתחיל
3. **playing** - המשחק פעיל
4. **finished** - המשחק הסתיים
5. **cancelled** - המשחק בוטל

## חישוב נקודות

המערכת משתמשת ב-`calculateAnswerScore` מ-`@shared/utils` לחישוב נקודות:

- **Base Points**: לפי קושי (easy: 10, medium: 20, hard: 30)
- **Time Bonus**: בונוס זמן (מהיר יותר = יותר נקודות)
- **Streak Bonus**: בונוס רצף תשובות נכונות

## טיימר

כל שאלה מוגבלת ל-30 שניות (קבוע). הטיימר מופעל אוטומטית ב-Gateway ומסיים את השאלה כאשר הזמן נגמר.

## Error Handling

כל שגיאה נשלחת ללקוח דרך event `error` עם הודעה ברורה. שגיאות נכתבות גם ל-logger.

## Scalability

המערכת תומכת ב-scalability עתידי באמצעות:
- Redis Pub/Sub (לא מיושם כרגע)
- Room state ב-Redis (מוכן ל-multi-instance)
- Stateless Gateway design

## Dependencies

- `@nestjs/websockets` - WebSocket support
- `@nestjs/platform-socket.io` - Socket.IO adapter
- `socket.io` - WebSocket library
- `uuid` - יצירת room IDs
- `ioredis` - Redis client (דרך StorageModule)

