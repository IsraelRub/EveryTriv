# API Reference - EveryTriv

תיעוד כל ה-API endpoints של המערכת עם פרטים מלאים על פרמטרים, תגובות ושגיאות.

## Base URL

```
Development: http://localhost:3002
Production: https://api.your-domain.com
```

הערה: כל ה-endpoints מתחילים ב-`/` ולא ב-`/api/`. הנתיבים הבסיסיים הם:
- `/auth` - אימות
- `/game` - משחק
- `/users` - משתמשים
- `/points` - נקודות
- `/leaderboard` - לוח תוצאות
- `/payment` - תשלומים
- `/subscription` - מנויים
- `/analytics` - אנליטיקה

## Authentication

כל ה-endpoints המוגנים דורשים JWT token ב-header:

```http
Authorization: Bearer <jwt_token>
```

## Public Endpoints (ללא אימות)

### Authentication

#### POST /auth/register
רישום משתמש חדש

**Request:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "firstName": "string",
  "lastName": "string"
}
```

**Response:**
```json
{
  "access_token": "string",
  "refresh_token": "string",
  "user": {
    "id": "string",
    "username": "string",
    "email": "string",
    "firstName": "string",
    "lastName": "string",
    "role": "string"
  }
}
```

#### POST /auth/login
התחברות משתמש

**Request:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "access_token": "string",
  "refresh_token": "string",
  "user": {
    "id": "string",
    "username": "string",
    "email": "string",
    "firstName": "string",
    "lastName": "string",
    "role": "string"
  }
}
```

#### GET /auth/google
התחברות עם Google OAuth

#### GET /auth/google/callback
Callback של Google OAuth

### Leaderboard

#### GET /leaderboard/stats
סטטיסטיקות leaderboard לפי תקופה

**Query Parameters:**
- `period` (optional): `weekly` | `monthly` | `yearly` (default: `weekly`)

**Response:**
```json
{
  "activeUsers": 150,
  "averageScore": 2500,
  "averageGames": 12
}
```

**Description:**
מחזיר סטטיסטיקות כלליות של leaderboard לפי תקופה:
- `activeUsers`: מספר משתמשים פעילים בתקופה
- `averageScore`: ממוצע ציון בתקופה
- `averageGames`: ממוצע משחקים למשתמש בתקופה

### Analytics

#### GET /analytics/global-stats
סטטיסטיקות גלובליות להשוואה

**Response:**
```json
{
  "successRate": 75,
  "averageGames": 25,
  "averageGameTime": 8,
  "consistency": 65
}
```

**Description:**
מחזיר ממוצעים גלובליים להשוואה עם ביצועי משתמש:
- `successRate`: ממוצע שיעור הצלחה גלובלי (%)
- `averageGames`: ממוצע משחקים למשתמש
- `averageGameTime`: זמן משחק ממוצע בדקות
- `consistency`: ציון עקביות גלובלי (%)

### Game

#### GET /game/trivia/:id
מחזיר שאלת טריוויה לפי ID

**Response:**
```json
{
  "id": "string",
  "question": "string",
  "options": ["string"],
  "correctAnswer": "number",
  "explanation": "string",
  "difficulty": "string",
  "topic": "string"
}
```

## Protected Endpoints (דורשים אימות)

### Game

#### POST /game/trivia
יצירת שאלת טריוויה

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request:**
```json
{
  "topic": "string",
  "difficulty": "string",
  "totalQuestions": 1
}
```

**Response:**
```json
{
  "questions": [
    {
      "id": "string",
      "question": "string",
      "answers": [
        {
          "text": "string",
          "isCorrect": true,
          "explanation": "string",
          "order": 0
        }
      ],
      "correctAnswerIndex": 0,
      "topic": "string",
      "difficulty": "string",
      "metadata": {},
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "fromCache": false
}
```

#### POST /game/answer
שליחת תשובה

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request:**
```json
{
  "questionId": "string",
  "answer": "string",
  "timeSpent": 15000
}
```

**Response:**
```json
{
  "questionId": "string",
  "userAnswer": "string",
  "correctAnswer": "string",
  "isCorrect": true,
  "timeSpent": 15000,
  "scoreEarned": 100,
  "totalScore": 100,
  "feedback": "Correct answer!"
}
```

#### GET /game/history
היסטוריית משחקים

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "games": [
    {
      "id": "string",
      "userId": "string",
      "score": 100,
      "totalQuestions": 10,
      "correctAnswers": 8,
      "topic": "string",
      "difficulty": "string",
      "gameMode": "question-limited",
      "timeSpent": 300,
      "creditsUsed": 0,
      "questionsData": [
        {
          "question": "string",
          "userAnswer": "string",
          "correctAnswer": "string",
          "isCorrect": true,
          "timeSpent": 30
        }
      ],
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "totalGames": 10
}
```

### Users

#### GET /users/profile
קבלת פרופיל משתמש

**Response:**
```json
{
  "id": "string",
  "username": "string",
  "email": "string",
  "firstName": "string",
  "lastName": "string",
  "credits": 100,
  "points": 1000
}
```

#### PUT /users/profile
עדכון פרופיל משתמש

**Request:**
```json
{
  "firstName": "string",
  "lastName": "string",
  "preferences": {}
}
```

#### GET /users/stats
קבלת סטטיסטיקות משתמש

**Response:**
```json
{
  "totalGamesPlayed": 100,
  "totalQuestionsAnswered": 1000,
  "correctAnswers": 800,
  "averageScore": 85.5
}
```

### Credits

#### GET /credits/balance
קבלת מאזן קרדיטים

**Response:**
```json
{
  "balance": 1000
}
```

#### POST /credits/purchase
רכישת קרדיטים

**Request:**
```json
{
  "packageId": "string",
  "paymentMethod": "string"
}
```

#### GET /credits/history
היסטוריית קרדיטים

**Response:**
```json
{
  "transactions": [
    {
      "id": "string",
      "type": "earned",
      "amount": 100,
      "balanceAfter": 1100,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Leaderboard

#### GET /leaderboard/user/ranking
דירוג משתמש

**Response:**
```json
{
  "rank": 10,
  "score": 1000,
  "periodType": "weekly"
}
```

#### GET /leaderboard/daily
לוח תוצאות יומי

**Response:**
```json
{
  "leaderboard": [
    {
      "userId": "string",
      "username": "string",
      "rank": 1,
      "score": 1000
    }
  ]
}
```

### Payment

#### POST /payment/create
יצירת תשלום

**Request:**
```json
{
  "amount": 10.00,
  "currency": "USD",
  "paymentMethod": "stripe",
  "planType": "premium"
}
```

**Response:**
```json
{
  "sessionId": "string",
  "url": "string"
}
```

#### POST /payment/webhook
Webhook של Stripe

### Subscription

#### GET /subscription/plans
קבלת תוכניות מנוי

**Response:**
```json
{
  "plans": [
    {
      "type": "premium",
      "price": 9.99,
      "features": []
    }
  ]
}
```

#### GET /subscription/current
קבלת מנוי נוכחי

**Response:**
```json
{
  "planType": "premium",
  "status": "active",
  "currentPeriodEnd": "2024-02-01T00:00:00Z"
}
```

### Analytics

#### POST /analytics/track
מעקב אירוע

**Request:**
```json
{
  "eventType": "game_started",
  "userId": "string",
  "metadata": {}
}
```

#### GET /analytics/user/:userId/summary
סיכום משתמש

**Response:**
```json
{
  "totalGames": 100,
  "totalQuestions": 1000,
  "averageScore": 85.5
}
```

#### GET /analytics/global-stats
סטטיסטיקות גלובליות להשוואה (ציבורי)

**Response:**
```json
{
  "successRate": 75,
  "averageGames": 25,
  "averageGameTime": 8,
  "consistency": 65
}
```

**Description:**
מחזיר ממוצעים גלובליים להשוואה עם ביצועי משתמש:
- `successRate`: ממוצע שיעור הצלחה גלובלי (%)
- `averageGames`: ממוצע משחקים למשתמש
- `averageGameTime`: זמן משחק ממוצע בדקות
- `consistency`: ציון עקביות גלובלי (%)

## שגיאות

### שגיאות נפוצות

#### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": []
}
```

#### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Authentication token required"
}
```

#### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Insufficient permissions"
}
```

#### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Resource not found"
}
```

#### 500 Internal Server Error
```json
{
  "statusCode": 500,
  "message": "Internal server error"
}
```

## הפניות

- [ארכיטקטורה כללית](../ARCHITECTURE.md)
- [מודולי Backend](../README.md#backend)
- [תיעוד מודולים](./features/AUTH.md)
- [דיאגרמות](../DIAGRAMS.md)
