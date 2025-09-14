# API Reference - EveryTriv

תיעוד כל ה-API endpoints של המערכת עם פרטים מלאים על פרמטרים, תגובות ושגיאות.

## Base URL

```
Development: http://localhost:3000/api
Production: https://api.everytriv.com/api
```

## Authentication

כל ה-endpoints (למעט auth ו-public) דורשים JWT token ב-header:

```http
Authorization: Bearer <jwt_token>
```

## Endpoints

### Authentication

#### POST /auth/login
מתחבר עם Google OAuth

**Request:**
```json
{
  "googleToken": "string"
}
```

**Response:**
```json
{
  "accessToken": "string",
  "user": {
    "id": "string",
    "email": "string",
    "name": "string",
    "avatar": "string"
  }
}
```

#### POST /auth/refresh
מרענן JWT token

**Response:**
```json
{
  "accessToken": "string"
}
```

### User Management

#### GET /user/profile
מחזיר פרופיל משתמש

**Response:**
```json
{
  "id": "string",
  "email": "string",
  "name": "string",
  "avatar": "string",
  "points": "number",
  "credits": "number",
  "subscription": {
    "type": "free|premium",
    "expiresAt": "string"
  },
  "preferences": {
    "language": "string",
    "difficulty": "string",
    "topics": ["string"]
  }
}
```

#### PUT /user/profile
מעדכן פרופיל משתמש

**Request:**
```json
{
  "name": "string",
  "avatar": "string",
  "preferences": {
    "language": "string",
    "difficulty": "string",
    "topics": ["string"]
  }
}
```

### Game Management

#### POST /game/create
יוצר משחק חדש

**Request:**
```json
{
  "difficulty": "easy|medium|hard",
  "topics": ["string"],
  "questionCount": "number"
}
```

**Response:**
```json
{
  "gameId": "string",
  "questions": [
    {
      "id": "string",
      "question": "string",
      "options": ["string"],
      "correctAnswer": "number",
      "explanation": "string"
    }
  ]
}
```

#### POST /game/answer
שולח תשובה לשאלה

**Request:**
```json
{
  "gameId": "string",
  "questionId": "string",
  "answer": "number",
  "timeSpent": "number"
}
```

**Response:**
```json
{
  "isCorrect": "boolean",
  "correctAnswer": "number",
  "explanation": "string",
  "pointsEarned": "number"
}
```

#### POST /game/finish
מסיים משחק

**Request:**
```json
{
  "gameId": "string",
  "answers": [
    {
      "questionId": "string",
      "answer": "number",
      "timeSpent": "number"
    }
  ]
}
```

**Response:**
```json
{
  "totalScore": "number",
  "correctAnswers": "number",
  "totalQuestions": "number",
  "pointsEarned": "number",
  "rank": "number"
}
```

### Points System

#### GET /points/balance
מחזיר יתרת נקודות

**Response:**
```json
{
  "balance": "number",
  "transactions": [
    {
      "id": "string",
      "type": "earned|spent",
      "amount": "number",
      "description": "string",
      "createdAt": "string"
    }
  ]
}
```

#### POST /points/spend
מבזבז נקודות

**Request:**
```json
{
  "amount": "number",
  "description": "string"
}
```

### Analytics

#### GET /analytics/stats
מחזיר סטטיסטיקות משתמש

**Response:**
```json
{
  "totalGames": "number",
  "totalQuestions": "number",
  "correctAnswers": "number",
  "successRate": "number",
  "averageScore": "number",
  "bestStreak": "number",
  "topics": [
    {
      "name": "string",
      "gamesPlayed": "number",
      "successRate": "number"
    }
  ]
}
```

### Leaderboard

#### GET /leaderboard/global
מחזיר לוח תוצאות גלובלי

**Query Parameters:**
- `limit`: מספר תוצאות (default: 50)
- `offset`: אופסט (default: 0)

**Response:**
```json
{
  "users": [
    {
      "rank": "number",
      "name": "string",
      "avatar": "string",
      "points": "number",
      "gamesPlayed": "number"
    }
  ],
  "total": "number"
}
```

#### GET /leaderboard/friends
מחזיר לוח תוצאות חברים

**Response:**
```json
{
  "users": [
    {
      "rank": "number",
      "name": "string",
      "avatar": "string",
      "points": "number",
      "gamesPlayed": "number"
    }
  ]
}
```

### Payment

#### POST /payment/create-intent
יוצר payment intent

**Request:**
```json
{
  "amount": "number",
  "currency": "string",
  "subscriptionType": "monthly|yearly"
}
```

**Response:**
```json
{
  "clientSecret": "string",
  "amount": "number"
}
```

#### POST /payment/confirm
מאשר תשלום

**Request:**
```json
{
  "paymentIntentId": "string"
}
```

**Response:**
```json
{
  "success": "boolean",
  "subscription": {
    "type": "premium",
    "expiresAt": "string"
  }
}
```

### Subscription

#### GET /subscription/status
מחזיר סטטוס מנוי

**Response:**
```json
{
  "type": "free|premium",
  "expiresAt": "string",
  "features": ["string"]
}
```

#### POST /subscription/cancel
מבטל מנוי

**Response:**
```json
{
  "success": "boolean",
  "expiresAt": "string"
}
```

## Error Responses

כל ה-endpoints מחזירים שגיאות בפורמט אחיד:

```json
{
  "statusCode": "number",
  "message": "string",
  "error": "string",
  "timestamp": "string",
  "path": "string"
}
```

### Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - פרמטרים לא תקינים |
| 401 | Unauthorized - לא מחובר או token לא תקין |
| 403 | Forbidden - אין הרשאה |
| 404 | Not Found - משאב לא נמצא |
| 409 | Conflict - קונפליקט (למשל משתמש קיים) |
| 422 | Unprocessable Entity - ולידציה נכשלה |
| 429 | Too Many Requests - יותר מדי בקשות |
| 500 | Internal Server Error - שגיאת שרת |

## Rate Limiting

- **Auth endpoints**: 5 בקשות לדקה
- **Game endpoints**: 10 בקשות לדקה
- **Other endpoints**: 100 בקשות לדקה

## Webhooks

### Stripe Webhooks

המערכת מקבלת webhooks מ-Stripe עבור:

- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

**Endpoint:** `POST /webhooks/stripe`

## SDK Examples

### JavaScript/TypeScript

```typescript
import { EveryTrivAPI } from '@everytriv/api-client';

const api = new EveryTrivAPI({
  baseURL: 'https://api.everytriv.com/api',
  token: 'your-jwt-token'
});

// Create game
const game = await api.game.create({
  difficulty: 'medium',
  topics: ['science', 'history'],
  questionCount: 10
});

// Submit answer
const result = await api.game.answer({
  gameId: game.gameId,
  questionId: game.questions[0].id,
  answer: 1,
  timeSpent: 15
});
```

### Python

```python
import requests

class EveryTrivAPI:
    def __init__(self, base_url, token):
        self.base_url = base_url
        self.headers = {'Authorization': f'Bearer {token}'}
    
    def create_game(self, difficulty, topics, question_count):
        response = requests.post(
            f'{self.base_url}/game/create',
            json={
                'difficulty': difficulty,
                'topics': topics,
                'questionCount': question_count
            },
            headers=self.headers
        )
        return response.json()
```

## Testing

### Postman Collection

קובץ Postman collection זמין ב: `postman-endpoints.json`

### Test Data

לצורך בדיקות, ניתן להשתמש בנתונים הבאים:

```json
{
  "testUser": {
    "email": "test@everytriv.com",
    "name": "Test User"
  },
  "testGame": {
    "difficulty": "medium",
    "topics": ["science"],
    "questionCount": 5
  }
}
```