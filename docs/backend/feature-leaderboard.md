# Feature: Leaderboard

תיעוד סטטי למודול לוח תוצאות.

> הערת סנכרון: נתונים נצרכים ממימוש מאוחד של Game/History (ראו `../DIAGRAMS.md#diagram-sync-status`).

## אחריות
- חישוב דירוגים (Rank) לפי ניקוד.
- הצגת Top N משתמשים.
- עדכון Batch או Lazy.

## מבני נתונים (DTO)
```typescript
export class GetLeaderboardDto {
  @IsInt() @Min(1) limit = 10;
}
```

## Service Pattern
```typescript
@Injectable()
export class LeaderboardService {
  async getTop(limit: number) {
    // שליפת Top N
  }
  async getUserRank(userId: string) {
    // חישוב מיקום משתמש
  }
}
```

## ביצועים
- שימוש ב-Cache ל-Top N.
- Index על שדה score.

---
 
