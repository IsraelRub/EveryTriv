# API Reference - EveryTriv

תיעוד כל ה-API endpoints של המערכת עם פרטים מלאים על פרמטרים, תגובות ושגיאות.

## Base URL

```
Development: http://localhost:3001
Production: https://api.everytriv.com
```

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
  "accessToken": "string",
  "refreshToken": "string",
  "user": {
    "id": "string",
    "username": "string",
    "email": "string",
    "firstName": "string",
    "lastName": "string"
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
  "accessToken": "string",
  "refreshToken": "string",
  "user": {
    "id": "string",
    "username": "string",
    "email": "string",
    "firstName": "string",
    "lastName": "string"
  }
}
```

#### GET /auth/google
התחברות עם Google OAuth (מבצע הפניה ל-Google באמצעות Passport)

#### GET /auth/google/callback
Callback של Google OAuth – מחזיר הזוג אסימונים (access/refresh) ומידע על המשתמש

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

#### GET /game/:id
מחזיר משחק לפי ID

### Leaderboard

#### GET /leaderboard/global
מחזיר לוח תוצאות גלובלי

**Response:**
```json
{
  "users": [
    {
      "rank": "number",
      "username": "string",
      "points": "number",
      "gamesPlayed": "number"
    }
  ],
  "total": "number"
}
```

#### GET /leaderboard/period/:period
מחזיר לוח תוצאות לתקופה

### Users

#### GET /users/username/:username
מחזיר פרופיל ציבורי לפי username

#### GET /users/search
חיפוש משתמשים

### Subscription

#### GET /subscription/plans
מחזיר תוכניות מנוי זמינות

### AI Providers

#### GET /api/ai-providers/health
מחזיר סטטוס בריאות של ספקי AI

### Storage & Cache

#### GET /storage/metrics
מחזיר מדדי אחסון

#### GET /cache/stats
מחזיר סטטיסטיקות מטמון

### System

#### GET /
נקודת קצה ראשית

#### GET /health
בדיקת בריאות המערכת

#### GET /status
בדיקת סטטוס המערכת

## Protected Endpoints (דורש אימות)

### Authentication

#### GET /auth/me
מחזיר משתמש נוכחי

#### POST /auth/refresh
מרענן JWT token

#### POST /auth/logout
התנתקות משתמש

#### GET /auth/admin/users
מחזיר רשימת משתמשים (מנהל)

### Users

#### GET /users/profile
מחזיר פרופיל משתמש

**Response:**
```json
{
  "id": "string",
  "username": "string",
  "email": "string",
  "firstName": "string",
  "lastName": "string",
  "points": "number",
  "credits": "number",
  "preferences": {
    "language": "string",
    "difficulty": "string",
    "topics": ["string"]
  }
}
```

#### PUT /users/profile
מעדכן פרופיל משתמש

#### GET /users/credits
מחזיר נקודות זכות משתמש

#### POST /users/credits
מנכה נקודות זכות

#### DELETE /users/account
מוחק חשבון משתמש

#### PUT /users/preferences
מעדכן העדפות משתמש

#### PATCH /users/profile/:field
מעדכן שדה ספציפי בפרופיל

#### PATCH /users/preferences/:preference
מעדכן העדפה יחידה

#### GET /users/:id
מחזיר משתמש לפי ID

#### PUT /users/credits/:userId
מעדכן נקודות זכות (מנהל)

#### DELETE /users/:userId
מוחק משתמש (מנהל)

#### PATCH /users/:userId/status
מעדכן סטטוס משתמש (מנהל)

#### GET /users/admin/all
מחזיר כל המשתמשים (מנהל)

#### PUT /users/admin/:userId/status
עדכון סטטוס משתמש (מנהל)

### Game

#### POST /game/answer
שולח תשובה לשאלה

**Request:**
```json
{
  "questionId": "string",
  "answer": "number",
  "timeSpent": "number"
}
```

#### GET /game/history
מחזיר היסטוריית משחקים

#### POST /game/history
יוצר היסטוריית משחק

#### DELETE /game/history/:gameId
מוחק היסטוריית משחק

#### DELETE /game/history
מנקה היסטוריית משחקים

#### POST /game/validate-custom
מאמת קושי מותאם אישית

#### POST /game/validate-language
מאמת שפה

#### GET /game/admin/statistics
מחזיר סטטיסטיקות משחק (מנהל)

#### DELETE /game/admin/history/clear-all
מנקה כל היסטוריית משחקים (מנהל)

### Leaderboard

#### GET /leaderboard/user/ranking
מחזיר דירוג משתמש

#### POST /leaderboard/user/update
מעדכן דירוג משתמש

#### GET /leaderboard/user/percentile
מחזיר אחוזון משתמש

### Payment

#### GET /payment/history
מחזיר היסטוריית תשלומים

#### POST /payment/create
יוצר תשלום (מנוי או חיוב חד-פעמי)  
גוף לדוגמה עבור מנוי:
```json
{
  "planType": "premium",
  "numberOfPayments": 12,
  "agreeToTerms": true
}
```
גוף לדוגמה עבור תשלום מותאם:
```json
{
  "amount": 29.99,
  "currency": "USD",
  "description": "Custom credit top-up",
  "paymentMethod": "credit_card"
}
```

### Points

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

#### GET /points/packages
מחזיר חבילות נקודות

#### GET /points/can-play
בודק אם משתמש יכול לשחק עם המלאי הנוכחי  
פרמטרים:
- `questionCount` (query, חובה) – מספר השאלות המבוקש
- `gameMode` (query, אופציונלי) – ברירת מחדל `question-limited`

#### POST /points/deduct
מנכה נקודות עבור משחק יחיד  
גוף לדוגמה:
```json
{
  "questionCount": 5,
  "gameMode": "question-limited",
  "reason": "Game play"
}
```

#### GET /points/history
מחזיר היסטוריית נקודות

#### POST /points/purchase
רוכש נקודות

#### POST /points/confirm-purchase
מאשר רכישת נקודות לאחר תשלום מוצלח  
גוף לדוגמה:
```json
{
  "paymentIntentId": "pi_your_payment_intent_id",
  "points": 120
}
```

### Subscription

#### GET /subscription/current
מחזיר מנוי נוכחי

#### POST /subscription/create
יוצר מנוי

#### DELETE /subscription/cancel
מבטל מנוי

### Analytics

#### POST /analytics/track
מעקב אירוע אנליטיקה

#### GET /analytics/game/stats
מחזיר סטטיסטיקות משחק

#### GET /analytics/user
מחזיר אנליטיקת משתמש מחושב עבור המשתמש המחובר

#### GET /analytics/user-stats/:userId
מחזיר סטטיסטיקות משחק מפורטות עבור משתמש מוגדר

#### GET /analytics/user-performance/:userId
מחזיר מדדי ביצועים (רצפים, שיפור, עקביות) של משתמש

#### GET /analytics/user-progress/:userId
מחזיר התקדמות לפי נושאים וציר זמן של ביצועים
- פרמטרים (query): `startDate`, `endDate`, `groupBy` (hourly/daily/weekly/monthly), `limit`

#### GET /analytics/user-activity/:userId
מחזיר פעילות אחרונה ואירועים בולטים של המשתמש
- פרמטרים (query): `startDate`, `endDate`, `limit`

#### GET /analytics/user-insights/:userId
מחזיר תובנות והמלצות לשיפור

#### GET /analytics/user-recommendations/:userId
מחזיר המלצות פעולה מותאמות אישית

#### GET /analytics/user-achievements/:userId
מחזיר הישגים שנפתרו למשתמש

#### GET /analytics/user-trends/:userId
מחזיר מגמות וגרף ביצועים לאורך זמן
- פרמטרים (query): `startDate`, `endDate`, `groupBy`, `limit`

#### GET /analytics/user-comparison/:userId
השוואת נתוני משתמש מול משתמש אחר או ממוצע גלובלי  
- פרמטרים (query): `target` (global/user), `targetUserId` (חובה אם target=user), `startDate`, `endDate`

#### GET /analytics/user-summary/:userId
מחזיר תקציר מרוכז ל-dashboard (הישגים, תובנות, ביצועים)  
- פרמטרים (query): `includeActivity` (ברירת מחדל false)

#### GET /analytics/topics/popular
מחזיר נושאים פופולריים

#### GET /analytics/difficulty/stats
מחזיר סטטיסטיקות קושי לפי רמות

### Cache

#### DELETE /cache/clear
מנקה כל המטמון

#### GET /cache/exists/:key
בודק אם מפתח קיים

#### GET /cache/ttl/:key
מחזיר TTL של מפתח

### Storage

#### POST /storage/metrics/reset
מאפס מדדי אחסון

#### GET /storage/keys
מחזיר מפתחות אחסון

#### GET /storage/item/:key
מחזיר פריט אחסון

#### DELETE /storage/clear
מנקה אחסון

### AI Providers

#### GET /api/ai-providers/stats
מחזיר סטטיסטיקות ספקים

#### GET /api/ai-providers/count
מחזיר מספר ספקים זמינים

### Admin

#### GET /admin/middleware-metrics
מחזיר כל מדדי middleware

#### GET /admin/middleware-metrics/:name
מחזיר מדדי middleware לפי שם

#### DELETE /admin/middleware-metrics/:name
מאפס מדדי middleware

#### DELETE /admin/middleware-metrics
מאפס כל מדדי middleware

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

קובץ Postman collection זמין ב: `tools/api/postman-endpoints.json`

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