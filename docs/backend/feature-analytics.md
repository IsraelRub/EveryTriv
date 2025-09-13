# Feature: Analytics

תיעוד סטטי למודול אנליטיקה.

> הערת סנכרון: צריכת אירועים ממימוש משחק מאוחד (ראו `../DIAGRAMS.md#diagram-sync-status`).

## אחריות
- איסוף אירועים (Events) מהמשחק.
- הפקת דוחות שימוש.
- ניתוח מגמות.

## מבני נתונים (DTO)
```typescript
export class TrackEventDto {
  @IsString() type!: string;
  @IsObject() payload!: Record<string, unknown>;
}
```

## Service Pattern
```typescript
@Injectable()
export class AnalyticsService {
  async trackEvent(dto: TrackEventDto) {
    // שמירה/שליחה לאנליטיקס
  }
  async getReport(type: string) {
    // הפקת דוח
  }
}
```

## אבטחה
- קבלת אירועים רק ממשתמשים מאומתים.

---
 
