# Feature: Points

תיעוד מודול הנקודות.

> הערת סנכרון: מודול הנקודות מתקשר למימוש ממוזג של Game/Trivia (ראו `../DIAGRAMS.md#diagram-sync-status`).

## אחריות
- חישוב נקודות לפי קושי, זמן, נכונות.
- שמירת טרנזקציות נקודות (Ledger).
- מניעת כפילויות (Idempotency).

## מבני נתונים (DTO)
```typescript
export class AddPointsDto {
  @IsUUID() userId!: string;
  @IsInt() delta!: number;
  @IsString() reason!: string;
}
```

## Service Pattern
```typescript
@Injectable()
export class PointsService {
  async addPoints(dto: AddPointsDto) {
    // חישוב, שמירה, החזרת מצב
  }
  calculate(params: {difficulty: string, timeMs: number}) {
    // לוגיקת חישוב נקודות
  }
}
```

## אבטחה
- כל פעולה מחייבת אימות משתמש.
- בדיקת בעלות על טרנזקציה.

## ביצועים
- שימוש ב-Cache לסטטיסטיקות.

---
 
