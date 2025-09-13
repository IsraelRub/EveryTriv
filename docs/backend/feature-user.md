# Feature: User

תיעוד סטטי למודול משתמשים.

> הערת סנכרון: מודולים מושגיים (Logger / Game History) ממוזגים; פירוט: `../DIAGRAMS.md#diagram-sync-status`.

## אחריות
- ניהול פרופיל משתמש.
- עדכון שדות מותרות בלבד.
- סטטיסטיקות בסיסיות.

## מבני נתונים (DTO)
```typescript
export class UpdateUserDto {
  @IsString() @Length(3,40) username?: string;
  @IsEmail() email?: string;
}
```

## Service Pattern
```typescript
@Injectable()
export class UserService {
  async getProfile(userId: string) {
    // שליפת פרופיל
  }
  async updateProfile(userId: string, dto: UpdateUserDto) {
    // עדכון שדות
  }
}
```

## אבטחה
- כל פעולה מחייבת אימות.
- עדכון רק לשדות מותרים.

---
 
