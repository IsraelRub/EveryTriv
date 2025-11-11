# מערכת הרשאות - EveryTriv

## סקירה כללית

מערכת ההרשאות של EveryTriv מבוססת על תפקידים (Roles) ומאפשרת בקרת גישה מדויקת לנקודות הקצה השונות של ה-API.

## תפקידי משתמשים

### תפקידים זמינים

| תפקיד | תיאור | הרשאות |
|-------|-------|---------|
| `user` | משתמש רגיל | גישה לפעולות משתמש רגיל, משחקים, פרופיל |
| `admin` | מנהל מערכת | גישה מלאה לכל הפונקציות, כולל ניהול משתמשים |
| `guest` | אורח | גישה מוגבלת למידע ציבורי |
| `premium` | משתמש פרימיום | גישה לתכונות מתקדמות |

### הגדרת תפקידים

התפקידים מוגדרים ב-`shared/constants/business/info.constants.ts`:

```typescript
export enum UserRole {
  ADMIN = 'admin',
  GUEST = 'guest',
  USER = 'user',
  PREMIUM = 'premium',
}
```

## מערכת בקרת גישה

### Guards

#### AuthGuard
- **תפקיד**: אימות JWT token ובדיקת נתיבים ציבוריים
- **מיקום**: `server/src/common/guards/auth.guard.ts`
- **שימוש**: כל נקודת קצה שדורשת אימות
- **פעולות**:
  - מאמת JWT tokens באמצעות `JwtService`
  - בודק נתיבים ציבוריים באמצעות `isPublicEndpoint()` שקוראת מרשימה מוגדרת
  - בודק אם נתיב מסומן כציבורי באמצעות decorator `@Public()`
  - מחלץ מידע משתמש (`TokenPayload`) ומצרף לבקשה
  - משתמש ב-`sub` claim כמזהה משתמש (תקן JWT)

#### RolesGuard
- **תפקיד**: בדיקת הרשאות על בסיס תפקיד
- **מיקום**: `server/src/common/guards/roles.guard.ts`
- **שימוש**: נקודות קצה שדורשות תפקיד ספציפי
- **פעולות**:
  - בודק תפקידים נדרשים מה-decorator `@Roles()`
  - מדלג על בדיקה לנתיבים ציבוריים
  - מאפשר למנהלים (`admin`) גישה לכל הנתיבים
  - מחזיר `403 Forbidden` כאשר אין הרשאה

### נתיבים ציבוריים

#### רשימת נתיבים ציבוריים
נתיבים ציבוריים מוגדרים במרכז ב-`server/src/internal/constants/public-endpoints.constants.ts`:

```typescript
export const PUBLIC_ENDPOINTS = [
  '/leaderboard/global',
  '/leaderboard/period',
  '/health',
  '/status',
] as const;
```

#### בדיקת נתיבים ציבוריים
הפונקציה `isPublicEndpoint()` ב-`server/src/internal/utils/guards.utils.ts` בודקת אם נתיב הוא ציבורי:

```typescript
export function isPublicEndpoint(path: string): boolean {
  return PUBLIC_ENDPOINTS.some(endpoint => 
    path === endpoint || 
    path?.startsWith(endpoint + '?') || 
    path?.startsWith(endpoint + '/')
  );
}
```

הפונקציה בודקת התאמה מדויקת או התחלת נתיב (עם query params או sub-paths).

### Decorators

#### @Roles()
```typescript
@Get('admin/users')
@Roles('admin')
async getAllUsers() {
  // רק מנהלים יכולים לגשת
}
```

#### @Public()
```typescript
@Get('leaderboard')
@Public()
async getLeaderboard() {
  // גישה ציבורית - מדלג על אימות
}
```

## נקודות קצה מוגבלות

### נקודות קצה למנהלים בלבד

| נתיב | שיטה | תיאור |
|------|------|-------|
| `/auth/admin/users` | GET | רשימת כל המשתמשים |
| `/users/admin/all` | GET | רשימת כל המשתמשים |
| `/users/credits/:userId` | PUT | עדכון נקודות משתמש |
| `/users/:userId` | DELETE | מחיקת משתמש |
| `/users/:userId/status` | PATCH | עדכון סטטוס משתמש |
| `/game/admin/statistics` | GET | סטטיסטיקות משחק |
| `/game/admin/history/clear-all` | DELETE | מחיקת כל היסטוריית המשחקים |
| `/storage/*` | GET/POST/DELETE | ניהול אחסון |
| `/cache/*` | GET/DELETE | ניהול cache |
| `/middleware-metrics/*` | GET/DELETE | ניהול מטריקות |

### דוגמאות שימוש

#### בקר אימות
```typescript
@Controller('auth')
export class AuthController {
  @Get('admin/users')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @Cache(60)
  async getAllUsers(@CurrentUser() user: TokenPayload) {
    // לוגיקה למנהלים בלבד
    // גישה למזהה משתמש: user.sub
  }
}
```

#### בקר משתמשים
```typescript
@Controller('users')
export class UserController {
  @Put('credits/:userId')
  @Roles('admin')
  @AuditLog('admin:update-user-credits')
  async updateUserCredits(@Param('userId') userId: string, @Body() creditsData: UpdateUserCreditsDto) {
    // עדכון נקודות למנהלים בלבד
  }
}
```

## מבנה JWT Token

### TokenPayload
אובייקט המשתמש שמוחזר מהאימות:

```typescript
interface TokenPayload {
  sub: string;        // מזהה משתמש (JWT standard)
  email: string;      // דוא"ל משתמש
  username: string;   // שם משתמש
  role: UserRole;     // תפקיד משתמש
  iat?: number;       // זמן הנפקה
  exp?: number;       // זמן תפוגה
}
```

**שימוש ב-`sub` claim**: המערכת משתמשת ב-`sub` (subject) כמזהה משתמש, בהתאם לתקן JWT. זה מאפשר תאימות עם מערכות חיצוניות ושמירה על best practices.

## זרימת אימות

### תהליך אימות בקשה
1. **בקשה נכנסת** - הבקשה מגיעה ל-controller
2. **AuthGuard** - בודק אם הנתיב ציבורי או דורש אימות
   - אם ציבורי: מאשר את הבקשה
   - אם דורש אימות: מאמת JWT token
   - מחלץ `TokenPayload` ומצרף לבקשה
3. **RolesGuard** - בודק תפקידים נדרשים (אם מוגדרים)
   - מדלג על נתיבים ציבוריים
   - בודק אם למשתמש יש תפקיד מתאים
   - מאפשר למנהלים גישה לכל הנתיבים
4. **Controller Method** - מבצע את הלוגיקה העסקית

### דיאגרמת זרימה
```
Request → AuthGuard → RolesGuard → Controller
            ↓           ↓
         @Public?   @Roles?
            ↓           ↓
       JWT Valid?  Role OK?
            ↓           ↓
      Attach User   Allow/Deny
```

## אבטחה

### עקרונות

1. **Least Privilege**: כל משתמש מקבל רק את ההרשאות המינימליות הנדרשות
2. **Defense in Depth**: שכבות הגנה מרובות (Guards, Decorators)
3. **Centralized Configuration**: רשימת נתיבים ציבוריים מנוהלת במרכז אחד
4. **JWT Standard**: שימוש ב-`sub` claim לפי תקן JWT

### בדיקות אבטחה

```typescript
// RolesGuard.ts
private userHasRequiredRole(user: BasicUser, requiredRoles: string[]): boolean {
  if (requiredRoles.length === 0) {
    return true;
  }
  return requiredRoles.includes(user.role);
}
```

## הטמעה בצד הלקוח

### Protected Routes
```typescript
// ב-ProtectedRoute.tsx
export const ProtectedRoute = memo(function ProtectedRoute({
  children,
  requiredRole,
  redirectTo = '/login',
}: ProtectedRouteProps) {
  const { user } = useSelector((state: RootState) => state.user);
  
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to='/unauthorized' replace />;
  }
  
  return <>{children}</>;
});
```

### שימוש
```typescript
// הגנה על דף מנהל
<ProtectedRoute requiredRole="admin">
  <AdminDashboard />
</ProtectedRoute>
```

## הערות חשובות

1. **הסרת Super-Admin**: המערכת לא כוללת עוד תפקיד `super-admin` - כל ההרשאות המנהליות מוגבלות לתפקיד `admin` בלבד
2. **עקביות**: כל נקודות הקצה המנהליות משתמשות ב-`@Roles('admin')`
3. **תיעוד**: כל שינוי בהרשאות חייב להיות מתועד
4. **בדיקות**: יש לבדוק כל נקודת קצה מוגבלת עם משתמשים בעלי תפקידים שונים

## עדכונים עתידיים

אם יהיה צורך להוסיף תפקידים נוספים:
1. הוספה ל-`UserRole` enum
2. עדכון ה-entity
3. עדכון ה-Guards
4. עדכון התיעוד
5. הוספת בדיקות
