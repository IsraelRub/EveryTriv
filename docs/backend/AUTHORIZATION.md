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
- **תפקיד**: אימות JWT token
- **מיקום**: `server/src/common/guards/auth.guard.ts`
- **שימוש**: כל נקודת קצה שדורשת אימות

#### RolesGuard
- **תפקיד**: בדיקת הרשאות על בסיס תפקיד
- **מיקום**: `server/src/common/guards/roles.guard.ts`
- **שימוש**: נקודות קצה שדורשות תפקיד ספציפי

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
  // גישה ציבורית
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
  async getAllUsers(@CurrentUser() user: { id: string; role: string; username: string }) {
    // לוגיקה למנהלים בלבד
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

## Middleware אוטומטי

מערכת ה-middleware מזהה אוטומטית את סוג הנתיב ומציעה הרשאות מתאימות:

```typescript
// ב-decorator-aware.middleware.ts
let requiredRoles: string[] = [];
if (path.includes('/admin')) {
  requiredRoles = ['admin'];
} else if (path.includes('/user') || path.includes('/profile')) {
  requiredRoles = ['user', 'admin'];
}
```

## אבטחה

### עקרונות

1. **Least Privilege**: כל משתמש מקבל רק את ההרשאות המינימליות הנדרשות
2. **Defense in Depth**: מספר שכבות הגנה (Guards, Decorators, Middleware)
3. **Audit Logging**: כל פעולת מנהל מתועדת

### בדיקות אבטחה

```typescript
// בדיקת תפקיד ב-AuthenticationManager
hasRole(user: TokenPayload, requiredRole: string): boolean {
  return user.role === requiredRole || user.role === 'admin';
}

hasAnyRole(user: TokenPayload, requiredRoles: string[]): boolean {
  return requiredRoles.includes(user.role) || user.role === 'admin';
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
