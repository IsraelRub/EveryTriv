# Feature: Payment

תיעוד סטטי למודול תשלומים.

> הערת סנכרון: מודולי Payment/Subscription פועלים מול GameModule מאוחד; פירוט: `../DIAGRAMS.md#diagram-sync-status`.

## אחריות
- טיפול בטרנזקציות תשלום (Stripe).
- אימות סכומים.
- ניהול תוצאה (Success/Failure).

## מבני נתונים (DTO)
```typescript
export class PaymentDto {
  @IsUUID() userId!: string;
  @IsInt() amount!: number;
  @IsString() method!: string;
}
```

## Service Pattern
```typescript
@Injectable()
export class PaymentService {
  async process(dto: PaymentDto) {
    // אינטגרציה עם Stripe
  }
}
```

## אבטחה
- אימות בעלות על אמצעי תשלום.
- בדיקת סכום מול טבלת תעריפים.

---
 
