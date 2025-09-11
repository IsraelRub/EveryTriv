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
7. **צבעים מותאמים**: תמיכה בצבעים לכל פורמט (קונסול, קובץ, דפדפן)
8. **ניקוי אוטומטי**: ניקוי הלוג בכל הפעלה של השרת או Docker

## פרטי המימוש

### BaseLoggerService

המחלקה המופשטת `BaseLoggerService` מספקת:

- **פונקציונליות משותפת**: מזהה session, מזהה מעקב, ניהול הגדרות
- **שיטות מופשטות**: `error`, `warn`, `info`, `debug` חייבות להיות ממומשות על ידי מחלקות יורשות
- **שיטות מיוחדות**: שיטות לוגים ספציפיות לתחום (ולידציה, מטמון, מסד נתונים וכו')
- **שיטות עזר**: שיטות עזר לתבניות לוגים נפוצות
- **ניקוי אוטומטי**: פונקציה `clearLogs()` לניקוי הלוגר

### ServerLoggerService

```typescript
export class ServerLoggerService extends BaseLoggerService {
  // צבעים לקונסול עם ANSI color codes
  private readonly ANSI_COLORS = {
    red: '\x1b[31m',      // ERROR
    yellow: '\x1b[33m',   // WARN
    blue: '\x1b[34m',     // INFO
    green: '\x1b[32m',    // DEBUG
    reset: '\x1b[0m'
  };
  
  // ניקוי אוטומטי בכל הפעלה
  constructor() {
    this.clearLogFile(); // Clear log file on startup
  }
  
  // לוגים עם צבעים לקונסול
  protected logError(message: string, meta?: LogMeta): void {
    const coloredMessage = this.colorizeText(message, 'red');
    console.error(coloredMessage, meta);
    this.writeToFile('ERROR', message, meta);
  }
}
```

**תכונות:**
- **צבעים לקונסול**: ANSI color codes לכל רמת לוג
- **צבעים לקובץ**: צבעים בקובץ הלוג עם ANSI
- **זמן מקומי בלבד**: תמיכה בעברית עם timestamp מקומי
- **ניקוי אוטומטי**: קובץ הלוג מתנקה בכל הפעלה
- **לוגי debug מודעים לייצור**

### ClientLoggerService

```typescript
export class ClientLoggerService extends BaseLoggerService {
  // צבעים לדפדפן עם CSS colors
  private readonly CSS_COLORS = {
    red: '#ff0000',        // ERROR
    yellow: '#ffaa00',     // WARN
    blue: '#0066ff',       // INFO
    green: '#00aa00',      // DEBUG
    gray: '#888888'        // DEFAULT
  };
  
  // לוגים עם צבעים בדפדפן
  public logWithColor(level: string, message: string, meta?: LogMeta): void {
    const color = this.getLevelColor(level);
    const coloredMessage = this.colorizeText(message, color);
    console.log(coloredMessage, `color: ${color}; font-weight: bold;`, meta);
  }
}
```

**תכונות:**
- **צבעים לדפדפן**: CSS colors עם console styling
- **לוגים מותאמים לדפדפן**: שימוש ב-console methods מתאימים
- **לוגי debug תמיד פעילים**
- **תמיכה ב-meta data**

## תכונות חדשות

### 1. **צבעים מותאמים לכל פורמט**

#### קונסול (Server):
- **ERROR**: 🔴 אדום
- **WARN**: 🟡 צהוב  
- **INFO**: 🔵 כחול
- **DEBUG**: 🟢 ירוק

#### קובץ (Server):
- **ANSI colors**: צבעים בקובץ הלוג
- **זמן מקומי**: תמיכה בעברית בלבד
- **ניקוי אוטומטי**: בכל הפעלה

#### דפדפן (Client):
- **CSS colors**: צבעים עם console styling
- **Font weight**: טקסט מודגש
- **Console methods**: שימוש בשיטות console מתאימות

### 2. **ניקוי אוטומטי**

```typescript
// ניקוי אוטומטי בכל הפעלה
constructor() {
  this.clearLogFile(); // Clear log file on startup
}

// ניקוי ידני
logger.clearLogs();
```

### 3. **זמן מקומי בלבד**

```typescript
// רק זמן מקומי בעברית
const localTimestamp = now.toLocaleString('he-IL', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false
});
```

## דוגמאות שימוש

### שימוש בשרת

```typescript
// בקוד השרת
import { LoggerService } from '../shared/modules/logging';

@Injectable()
export class SomeService {
  constructor() {}

  async someMethod() {
    // לוגים עם צבעים לקונסול
    logger.info('השרת התחיל', { port: 3000 });
    logger.error('החיבור למסד הנתונים נכשל', { error: 'Connection timeout' });

    // ניקוי הלוגר
    logger.clearLogs();
  }
}
```

### שימוש בלקוח

```typescript
// בקוד הלקוח
import { loggerService } from '../services/utils';

// לוגים עם צבעים בדפדפן
loggerService.info('רכיב נטען', { component: 'GameBoard' });
loggerService.error('בקשת API נכשלה', { status: 500 });

// לוגים מיוחדים
loggerService.navigationPage('/game', { userId: '123' });
loggerService.game('שלב הושלם', { level: 5, score: 1000 });
```

## שיטות לוגים

### שיטות בסיסיות
- `error(message, meta?)` - לוג שגיאות (🔴 אדום)
- `warn(message, meta?)` - לוג אזהרות (🟡 צהוב)
- `info(message, meta?)` - לוג מידע (🔵 כחול)
- `debug(message, meta?)` - לוג מידע debug (🟢 ירוק)

### שיטות חדשות
- `clearLogs()` - ניקוי הלוגר ופתיחת session חדש
- `getLoggerInfo()` - מידע על הלוגר הנוכחי
- `getLoggerStatus()` - סטטוס הלוגר

## הגדרות

### משתני סביבה
- `NODE_ENV` - שולט בלוגי debug בייצור
- `LOG_DIR` - תיקיית הלוגים (ברירת מחדל: logs)

### ניקוי אוטומטי
- **Server**: קובץ הלוג מתנקה בכל הפעלה
- **Docker**: הלוג מתנקה בכל container חדש
- **Manual**: אפשרות לניקוי ידני עם `clearLogs()`

## יתרונות התכונות החדשות

1. **צבעים מותאמים**: זיהוי מהיר של רמות לוג בכל פורמט
2. **ניקוי אוטומטי**: לוגים נקיים וקריאים בכל הפעלה
3. **זמן מקומי**: תמיכה בעברית עם קריאות נוחה
4. **ביצועים משופרים**: קובץ לוג קטן יותר
5. **חוויית פיתוח**: לוגים יפים ונוחים לקריאה
