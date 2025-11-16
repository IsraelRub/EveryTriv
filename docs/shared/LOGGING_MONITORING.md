# לוגים וניטור (ארכיטקטורה + אופרטיבי)

מסמך מאוחד: ארכיטקטורת מערכת הלוגים (תפקידים, שכבות, עקרונות) + ניטור וביצועים. מחליף את שני המסמכים הקודמים (מערכת לוגים / לוגים וניטור).

> הערת סנכרון תרשימים: בתרשימים ייתכן ומופיע "Logger Module" כגבול מודולרי; בפועל הלוגים ממומשים כשירות משותף (`serverLogger`) ללא מודול Nest עצמאי. מיפוי מושגים ↔ מימוש: `../DIAGRAMS.md#diagram-sync-status`. זרימת ליבת NestJS: `../DIAGRAMS.md#nestjs-core-flow`.

## מטרות
- עקיבות וחקירת אירועים.
- איתור תקלות בזמן קצר.
- מדדי בריאות/ביצועים בסיסיים.
- פלט עקבי בין Client / Server עם טיפוסים משותפים.

## היררכיה של מתודות לוגר

### רמות גישה
- **Public**: מתודות ספציפיות לקטגוריות (userError, apiError, gameInfo וכו')
- **Protected**: מתודות בסיסיות (error, warn, info, debug) - לשימוש פנימי בלבד
- **Private**: מתודות קונפיגורציה (updateConfig, getConfig)

### מתי להשתמש במתודה ספציפית?

| הקשר | מתודה נכונה | מתודות שגויות |
|------|-------------|----------------|
| שגיאות משתמש (פרופיל, העדפות) | `userError`, `userWarn` | `error`, `apiError` |
| פעולות API (CRUD) | `apiCreate/Read/Update/Delete`, `apiError` | `error`, `info` |
| שגיאות משחק | `gameError`, `gameInfo` | `error`, `apiError` |
| אבטחה והרשאות | `securityError`, `securityDenied`, `authError` | `error`, `userError` |
| מסד נתונים | `databaseError`, `databaseInfo` | `error`, `systemError` |
| Cache | `cacheHit/Miss/Error`, `cacheInfo` | `info`, `error` |
| ניווט | `navigationError`, `navigationRoute` | `error`, `info` |
| אחסון | `storageError`, `storageInfo` | `error`, `systemError` |
| תשלומים | `paymentSuccess/Failed`, `payment` | `info`, `error` |
| ביצועים | `performance`, `trackPerformanceEnhanced` | `info`, `debug` |
| אנליטיקה | `analyticsError`, `analyticsTrack` | `error`, `info` |
| וולידציה | `validationError/Success` | `error`, `userError` |
| מערכת כללי | `systemError`, `appStartup/Shutdown` | `error` |

### דוגמאות שימוש נכון

```typescript
// ✅ נכון - ספציפי ומדויק
logger.userError('Failed to update user preferences', { userId, preferences });
logger.navigationPage('analytics', { timeFilter });
logger.paymentSuccess(paymentId, amount, { userId, method });

// ❌ שגוי - גנרי מדי
logger.error('Failed to update user preferences');
logger.info('Analytics view loaded');
logger.info('Payment completed');
```

### שימוש ב-console
- **מותר**: migrations, main.ts, ErrorBoundary components
- **אסור**: כל שאר הקוד - השתמש בלוגר במקום
- **ESLint**: אוכף כלל `no-console` עם חריגות לקבצים ספציפיים

### ארכיטקטורה
| עיקרון | הסבר |
|--------|------|
| מקור אמת יחיד | מימוש לוגר משותף בשכבת shared/services |
| ממשק אחיד | `ILogger` עם error/warn/info/debug + הרחבות דומיין |
| הפרדת סביבות | עטיפות ייעודיות: ClientLogger / ServerLogger |
| פורמט מובנה | אובייקט JSON עם שדות קבועים |
| הרחבה ללא שבירה | הוספת שדות meta ללא שינוי פורמט בסיס |
| ניקוי מחזורי | רוטציה או clear בעת עליית שרת / Container |

### שכבות לוג
| שכבה | דוגמאות אירועים | מטרה |
|-------|-----------------|-------|
| Application | game_started, user_registered | דומיין/עסקי |
| Infrastructure | cache_miss, db_query | תשתית ותלות חיצונית |
| Security | auth_failure, rate_limited | אבטחה ובקרות |
| Performance | request_timing, queue_latency | מדדי זמן |

### רמות
| Level | שימוש |
|-------|-------|
| error | כשל שלא טופל בהמשך השרשרת |
| warn  | אירוע חריג שאינו שובר תהליך |
| info  | אירוע עסקי או תשתיתי משמעותי |
| debug | פרטים טכניים לזמן פיתוח |

## פורמט מבני
```json
{
  "ts": "2025-09-12T10:00:00.000Z",
  "level": "info",
  "ctx": "GameService",
  "event": "question.generated",
  "requestId": "c1f...",
  "durationMs": 142,
  "meta": { "topic": "science", "difficulty": "medium" }
}
```

### שדות עיקריים
| שדה | הסבר |
|-----|------|
| ts | ISO timestamp (UTC) |
| level | רמת לוג |
| ctx | רכיב/Service מקור |
| event | מזהה אירוע תמציתי (snake.case) |
| requestId | קורלציה לבקשת HTTP (אם רלוונטי) |
| durationMs | משך פעולה (אם נמדד) |
| meta | פרטי הרחבה אופציונליים |

## Masking & Privacy
- ללא רישום סיסמאות / טוקנים / פרטי תשלום גולמיים.
- אימיילים נרשמים ב-hash חד-כיווני אם נדרש זיהוי עקבי.
- מזהי משתמשים: UUID בלבד, ללא פרטים אישיים.

## מתודולוגיית איסוף מדדים
מדדים נרשמים כרשומות לוג ברמת performance או נשלחים ל-collector.

| רכיב | מדד | תיוג event | הערה |
|------|-----|------------|------|
| HTTP | latency_ms | http.request.end | path, status |
| Cache | hit_ratio | cache.summary | window מחושב אגרגטיבית |
| DB | query_time | db.query | table, rows |
| Game | questions_per_min | game.rate | ממוצע מתגלגל |

דוגמה:
```typescript
performanceTimer.wrap('http.request', async () => {
  // handler logic
});
logger.debug('http.request.end', { path:'/game/start', ms: elapsed });
```

## בריאות (Health)
- Redis Ping
- DB Ping
- גרסת אפליקציה (Build metadata)
- זמני תגובה ממוצעים (SLI בסיסי)

## אסטרטגיית אחסון
- קובץ מסתובב לפי גודל (rotation) + מחיקה אוטומטית בעת הפעלה.

## קורלציה (Request Id)
```typescript
req.id = req.headers['x-request-id'] ?? randomUUID();
logger.with({ requestId: req.id }).info('request.start');
```

## כשלים ותבניות
| תרחיש | טיפול |
|-------|-------|
| חריג באסינכרוני | wrap + log error עם stack טרימרי |
| Rate Limit | warn + counter ב-Redis |
| Retry ידני | מצוין ב-meta: { retry: n } |
| שגיאת צד ספק | event: provider.error + provider שם |

## הרחבת לוגר (Facade)
```typescript
logger.with({ feature: 'points' }).info('points.awarded', { amount: 50 });
```

## קונבנציות שמות
- event בפורמט: domain.action (game.started, auth.failure)
- ctx = שם מחלקה / מודול לוגי

## סיכום
מערכת לוגים אחודה + ניטור בסיסי מספקת עקיבות, חלוקה שכבתית ויכולת הרחבה ללא שינוי חוזה בסיס.

## קישורים רלוונטיים

- מבנה Shared Services: `./SHARED_PACKAGE.md`
- Types: `./TYPES.md`
- Constants: `./CONSTANTS.md`
- דיאגרמות: [דיאגרמת חבילה משותפת (Shared)](../DIAGRAMS.md#דיאגרמת-חבילה-משותפת-shared)

---
 
