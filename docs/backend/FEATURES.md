# Backend Features Overview (NestJS)

תיעוד מבנה מודולי ה-NestJS הקיימים. כל מודול עומד בעקרונות: אחריות יחידה, יצוא מינימלי, שימוש ב-DI, DTO ולידציה, ושכבת Service מבודדת.

> **הערת סנכרון**: ייצוג מודולים בדיאגרמות הוא מושגי; פירוט מיפוי בפועל: [סנכרון תרשימים ↔ קוד](../DIAGRAMS.md#diagram-sync-status).

## רשימת מודולים

| מודול | נתיב בסיס | אחריות עיקרית | תלות ליבה |
|-------|-----------|---------------|-----------|
| Auth | /auth | אימות, הנפקת JWT, OAuth (Google) | User, Config, Tokens |
| User | /user | פרופיל משתמש, סטטיסטיקות בסיסיות | Points, Game |
| Game | /game | לוגיקת משחק, trivia, AI providers | Points, User, Cache |
| Points | /points | חישוב וניהול נקודות | User, Game |
| Leaderboard | /leaderboard | דירוגים וחישובי מיקום | Points, User, Analytics |
| Analytics | /analytics | מדדים, איסוף שימוש, דוחות | Game, Points |
| Payment | /payment | תשלומים, טרנזקציות | Subscription, User |
| Subscription | /subscription | ניהול מנויים והרשאות פרימיום | Payment, User |

## עקרון שכבות

Controller → Service → Repository/Data Layer → Cache (אופציונלי) → External / Shared.

## תבנית Controller כללית
```typescript
// Example Pattern Only
@Controller('example')
export class ExampleController {
  constructor(private readonly service: ExampleService) {}

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.service.findById(id);
  }
}
```

## תבנית Service כללית
```typescript
@Injectable()
export class ExampleService {
  constructor(
    private readonly repo: ExampleRepository,
    private readonly cache: CacheService,
  ) {}

  async findById(id: string) {
    const key = `example:${id}`;
    const cached = await this.cache.get(key);
    if (cached) return cached;
    const entity = await this.repo.findOne(id);
    if (entity) await this.cache.set(key, entity, 300);
    return entity;
  }
}
```

## DTO וולידציה
```typescript
export class CreateItemDto {
  @IsString() @IsNotEmpty() name!: string;
  @IsOptional() @IsInt() @Min(0) score?: number;
}
```

## מודול Auth (feature-auth)

- Token Issuance (Access + Refresh)
- אימות בסיסי + אפשרות הרחבה ל-Provider חיצוני.
- יציבות: Stateless למעט Blacklist חלקית בקאש (Rate / Abuse).

## מודול User (feature-user)

- קריאת פרופיל.
- עדכון בסיסי (שדות מותרים בלבד).
- שאילתות קונסיסטנטיות מוגנות ע"י DTO.

## מודול Game (feature-game)

- יצירת מופע משחק.
- אחזור מצב נוכחי.
- עדכון תוצאה/סיום.
- לוגיקת trivia ו-AI providers.
- שימוש בקאש לשאלות ונתוני Session קצרים.

## מודול Points (feature-points)

- חישוב דטרמיניסטי (קושי + זמן + נכונות).
- שמירת טרנזקציית נקודות.
- מניעת כפילויות (Idempotency Key ברמת Service).

## מודול Leaderboard (feature-leaderboard)

- Aggregation מרוכז (אין לוגיקת דירוג מפוזרת).
- עידכון Lazy או Batch.

## מודול Analytics (feature-analytics)

- איסוף event פנימי (לא חשוף ישירות למשתמש חיצוני ללא אבטחה).
- מבנה Event אחיד (Type + Payload + Timestamp).

## מודול Payment (feature-payment)

- טיפול בטרנזקציה בודדת.
- אימות סכומים מול טבלת תעריפים.
- ניהול תוצאה (Success/Failure) בצורה אטומית.

## מודול Subscription (feature-subscription)

- רמות מנוי (Tier) סטטיות.
- החלת הרשאות (Feature Flags) בצד השרת.

## תלות בשכבת Shared

- Types (Contract אחיד בין Client ↔ Server).
- Validation Schemas (איחוד לוגיקה החוזרת על עצמה).
- Constants (מניעת Magic Numbers / Strings).

## לוג ובקרה

- Structured Logging לכל פעולת Service משמעותית.
- זיהוי Pattern חריג (Rate / Error Spike) דרך Analytics + Cache.

## אבטחה כללית

- כל Route ציבורי מסומן במפורש (@Public / Metadata) או מוגן ב-Guard.
- נתוני קלט עוברים Pipe (ValidationPipe) + DTO מחייב.

## ביצועים

- Cache before external call.
- שימוש ב-Index לישות מרכזית (User, Game History, Points Ledger).

