# ארכיטקטורת לוגים - EveryTriv

## סקירה כללית

פרויקט EveryTriv משתמש בארכיטקטורת לוגים מאוחדת המספקת לוגים עקביים בסביבות client ו-server. ארכיטקטורה זו מבטלת כפילות קוד ומבטיחה בטיחות טיפוסים בכל האפליקציה.

## עיצוב הארכיטקטורה

### רכיבי ליבה

```
shared/
├── services/
│   └── logger.service.ts          # מימוש לוגר מאוחד
├── types/
│   └── logging.types.ts           # ממשק Logger יחיד
└── constants/
    └── logging.constants.ts       # קבועי לוגים ומעצבים

client/
└── src/services/utils/
    └── logger.service.ts          # ייצוא מחדש מ-shared

server/
└── src/shared/modules/logging/
    ├── logger.service.ts          # עטיפה של NestJS LoggerService
    ├── client-logs.controller.ts  # נקודת קצה ללוגי client
    └── index.ts                   # ייצוא מודולים
```

### עקרונות מפתח

1. **מקור אמת יחיד**: כל לוגיקת הלוגים מרוכזת ב-`shared/services/logger.service.ts`
2. **ממשק מאוחד**: ממשק `ILogger` יחיד מגדיר את כל שיטות הלוגים
3. **מימוש ספציפי לסביבה**: `ServerLoggerService` ו-`ClientLoggerService` מספקים התנהגות ספציפית לסביבה
4. **בטיחות טיפוסים**: תמיכה מלאה ב-TypeScript עם הגדרות טיפוסים נכונות
5. **ללא כפילות**: מבטל כפילות קוד בין client ו-server
6. **ארכיטקטורה מפושטת**: מורכבות מופחתת עם הפרדת אחריות ברורה

## פרטי המימוש

### BaseLoggerService

המחלקה המופשטת `BaseLoggerService` מספקת:

- **פונקציונליות משותפת**: מזהה session, מזהה מעקב, ניהול הגדרות
- **שיטות מופשטות**: `error`, `warn`, `info`, `debug` חייבות להיות ממומשות על ידי מחלקות יורשות
- **שיטות מיוחדות**: שיטות לוגים ספציפיות לתחום (ולידציה, מטמון, מסד נתונים וכו')
- **שיטות עזר**: שיטות עזר לתבניות לוגים נפוצות

### ServerLoggerService

```typescript
export class ServerLoggerService extends BaseLoggerService {
  public error(message: string, meta?: LogMeta): void {
    console.error(message, meta);
  }
  
  public debug(message: string, meta?: LogMeta): void {
    if (process.env.NODE_ENV !== 'prod') {
      console.log(message, meta);
    }
  }
  // ... שיטות אחרות
}
```

**תכונות:**
- לוגי debug מודעים לייצור
- פלט מבוסס console
- התנהגות ספציפית לסביבה

### ClientLoggerService

```typescript
export class ClientLoggerService extends BaseLoggerService {
  public error(message: string, meta?: LogMeta): void {
    console.error(message, meta);
  }
  
  public debug(message: string, meta?: LogMeta): void {
    console.debug(message, meta);
  }
  // ... שיטות אחרות
}
```

**תכונות:**
- לוגים מותאמים לדפדפן
- לוגי debug תמיד פעילים
- פלט ספציפי לשיטת console

### עטיפה של NestJS LoggerService

```typescript
@Injectable()
export class LoggerService extends ServerLoggerService {
  // דריסה רק של השיטות הבסיסיות לשימוש ב-console.log לתצוגה טובה יותר
  info(message: string, meta?: LogMeta): void {
    console.log(`[INFO] ${message}`, meta || '');
  }
  // ... דריסות אחרות
}
```

**תכונות:**
- תמיכה בהזרקת תלויות של NestJS
- פלט console משופר עם קידומות
- מימוש בטוח בטיפוסים

## דוגמאות שימוש

### שימוש בשרת

```typescript
// בקוד השרת
import { LoggerService } from '../shared/modules/logging';

@Injectable()
export class SomeService {
  constructor(private readonly logger: LoggerService) {}

  async someMethod() {
    // לוגים בסיסיים
    this.logger.info('השרת התחיל', { port: 3000 });
    this.logger.error('החיבור למסד הנתונים נכשל', { error: 'Connection timeout' });

    // לוגים מיוחדים
    this.logger.database('שאילתה בוצעה', { table: 'users', duration: 150 });
    this.logger.securityLogin('משתמש אומת', { userId: '123' });
  }
}
```

### שימוש בלקוח

```typescript
// בקוד הלקוח
import { loggerService } from '../services/utils';

// לוגים בסיסיים
loggerService.info('רכיב נטען', { component: 'GameBoard' });
loggerService.error('בקשת API נכשלה', { status: 500 });

// לוגים מיוחדים
loggerService.navigationPage('/game', { userId: '123' });
loggerService.game('שלב הושלם', { level: 5, score: 1000 });
```

### שימוש משותף

```typescript
// גם client וגם server יכולים להשתמש באותו ממשק
import type { Logger } from 'everytriv-shared/types';

function logUserActivity(logger: ILogger, userId: string, action: string) {
  logger.userInfo(`משתמש ביצע פעולה: ${action}`, { userId });
}
```

## שיטות לוגים

### שיטות בסיסיות
- `error(message, meta?)` - לוג שגיאות
- `warn(message, meta?)` - לוג אזהרות
- `info(message, meta?)` - לוג מידע
- `debug(message, meta?)` - לוג מידע debug

### שיטות מיוחדות
- **ולידציה**: `validationError()`, `validationWarn()` וכו'
- **מטמון**: `cacheSet()`, `cacheHit()`, `cacheMiss()` וכו'
- **מסד נתונים**: `database()`, `databaseError()` וכו'
- **אבטחה**: `securityLogin()`, `securityLogout()` וכו'
- **HTTP**: `http()`, `httpSuccess()`, `httpError()` וכו'
- **ביצועים**: `performance()`, `logPerformance()`
- **משחק**: `game()`, `gameForm()`, `gameStatistics()` וכו'
- **משתמש**: `user()`, `userError()`, `logUserActivity()` וכו'
- **ניווט**: `navigationPage()`, `navigationRoute()` וכו'
- **תשלום**: `payment()`, `paymentSuccess()`, `paymentFailed()` וכו'

## הגדרות

### משתני סביבה
- `NODE_ENV` - שולט בלוגי debug בייצור
- הגדרת רמת לוגים דרך constructor

### ספי ביצועים
- רגיל: 100ms
- איטי: 1000ms (שנייה אחת)
- קריטי: 5000ms (5 שניות)

## יתרונות

1. **עקביות**: אותו ממשק לוגים ב-client ו-server
2. **בטיחות טיפוסים**: תמיכה מלאה ב-TypeScript עם טיפוסים נכונים
3. **תחזוקה**: מקור אמת יחיד ללוגיקת לוגים
4. **ביצועים**: אתחול עצל ולוגים מודעים לסביבה
5. **הרחבה**: קל להוסיף שיטות לוגים מיוחדות חדשות
6. **דיבוג**: תמיכה בהקשר עשיר ומטא-דאטה

## מדריך הגירה

### מהלוגר הישן
```typescript
// דרך ישנה
logger.log('error', 'משהו השתבש');

// דרך חדשה
logger.error('משהו השתבש');
```

### שימוש בשיטות מיוחדות
```typescript
// במקום לוגים גנריים
logger.info('שאילתת מסד נתונים בוצעה', { table: 'users', duration: 150 });

// השתמש בשיטה מיוחדת
logger.database('שאילתה בוצעה', { table: 'users', duration: 150 });
```

## שיטות עבודה מומלצות

1. **השתמש בשיטות מיוחדות**: העדף שיטות ספציפיות לתחום על פני גנריות
2. **כלול הקשר**: תמיד ספק מטא-דאטה רלוונטי
3. **שמות עקביים**: השתמש בעיצוב הודעות עקבי
4. **מודעות לביצועים**: השתמש בלוגי ביצועים לפעולות איטיות
5. **טיפול בשגיאות**: תמיד לוג שגיאות עם stack traces כשזמינים
6. **אבטחה**: לעולם אל תלוג מידע רגיש כמו סיסמאות או tokens
