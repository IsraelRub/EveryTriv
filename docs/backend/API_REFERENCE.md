# API Reference (Static Summary)

מסמך זה מסכם נקודות קצה לפי מודול.

## תבנית תגובה אחידה
```typescript
interface ApiSuccess<T> { success: true; data: T; }
interface ApiError { success: false; error: string; code?: string; }
```

## Auth
| Method | Path | Body | Auth | Description |
|--------|------|------|------|-------------|
| POST | /auth/register | {email,password,username} | No | יצירת משתמש |
| POST | /auth/login | {email,password} | No | התחברות וקבלת טוקנים |
| POST | /auth/refresh | {refreshToken} | Partial | חידוש Access Token |
| GET | /auth/me | - | Access | פרופיל משתמש נוכחי |

## User
| Method | Path | Body | Auth | Description |
|--------|------|------|------|-------------|
| GET | /user/profile | - | Access | פרופיל משתמש |
| PATCH | /user/profile | {username?} | Access | עדכון פרופיל מותר |

## Game
| Method | Path | Body | Auth | Description |
|--------|------|------|------|-------------|
| POST | /game/start | {topic,difficulty} | Access | התחלת משחק |
| POST | /game/answer | {sessionId,questionId,answer} | Access | שליחת תשובה |
| GET | /game/state/:sessionId | - | Access | מצב סשן (אם מתוחזק) |

## Points
| Method | Path | Body | Auth | Description |
|--------|------|------|------|-------------|
| GET | /points/balance | - | Access | יתרת נקודות |
| GET | /points/history | - | Access | היסטוריית טרנזקציות |

## Leaderboard
| Method | Path | Query | Auth | Description |
|--------|------|-------|------|-------------|
| GET | /leaderboard/top | ?limit=10 | No | Top N |
| GET | /leaderboard/rank/:userId | - | No | דירוג משתמש |

## Analytics
| Method | Path | Body | Auth | Description |
|--------|------|------|------|-------------|
| POST | /analytics/track | {type,payload} | Access | רישום אירוע |
| GET | /analytics/report/:type | - | Access | דוח לפי סוג |

## Payment
| Method | Path | Body | Auth | Description |
|--------|------|------|------|-------------|
| POST | /payment/intent | {amount,method} | Access | יצירת כוונת תשלום |
| POST | /payment/confirm | {intentId} | Access | אישור תשלום |
| GET | /payment/history | - | Access | היסטוריית תשלומים |

## Subscription
| Method | Path | Body | Auth | Description |
|--------|------|------|------|-------------|
| GET | /subscription/status | - | Access | סטטוס מנוי |
| POST | /subscription/activate | {tier} | Access | הפעלת מנוי |
| POST | /subscription/cancel | - | Access | ביטול מנוי |

## Health / Infra
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /health | No | בדיקת בריאות כללית |
| GET | /metrics (אם מופעל) | Restricted | מדדים חשופים |

## הערות אבטחה
- כל בקשה מאומתת באמצעות כותרת Authorization: `Bearer <token>` (למעט ציבוריות).
- קודי שגיאה סטנדרטיים: 400 ולידציה, 401 אימות, 403 הרשאה, 404 לא נמצא, 429 Rate Limit, 500 שגיאה כללית.

---
 
