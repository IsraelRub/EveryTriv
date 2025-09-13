# Feature: Subscription

תיעוד סטטי למודול מנויים.

> הערת סנכרון: תלויות Game/Points בדיאגרמה מרוכזות ב-`GameModule` בפועל (ראו `../DIAGRAMS.md#diagram-sync-status`).

## אחריות
- ניהול רמות מנוי (Tier).
- הפעלת הרשאות (Feature Flags).
- בדיקת סטטוס מנוי.

## מבני נתונים (DTO)
```typescript
export class SubscriptionDto {
  @IsUUID() userId!: string;
  @IsString() tier!: string;
}
```

## Service Pattern
```typescript
@Injectable()
export class SubscriptionService {
  async activate(dto: SubscriptionDto) {
    // הפעלת מנוי
  }
  async checkStatus(userId: string) {
    // בדיקת סטטוס
  }
}
```

## אבטחה
- בדיקת בעלות על מנוי.
- הרשאות Feature Flags בצד שרת בלבד.

---
 
