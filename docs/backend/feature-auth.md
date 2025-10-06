# Feature: Auth

תיעוד מודול האימות.

> הערת סנכרון: ייצוג מודולים בדיאגרמות הוא מושגי; פירוט מיפוי בפועל: `../DIAGRAMS.md#diagram-sync-status`.

## אחריות
- רישום משתמש
- התחברות והנפקת Access Token + Refresh Token
- אימות טוקן קיים
- יציאה (אפסון אינדקטיבי של Refresh בפריטי Cache אם מופעל)

## זרימת התחברות בסיסית
```mermaid
description
sequenceDiagram
  participant C as Client
  participant A as Auth Controller
  participant S as Auth Service
  participant U as User Repo
  C->>A: POST /auth/login (email,password)
  A->>S: validateCredentials()
  S->>U: findByEmail()
  U-->>S: User
  S-->>A: Tokens + Profile
  A-->>C: 200 {accessToken,refreshToken,user}
```

## מבני נתונים (DTO)
```typescript
export class LoginDto {
  @IsEmail() email!: string;
  @IsString() @Length(6, 128) password!: string;
}

export class RegisterDto {
  @IsEmail() email!: string;
  @IsString() @Length(3, 40) username!: string;
  @IsString() @Length(6, 128) password!: string;
}
```

## Service Pattern
```typescript
@Injectable()
export class AuthService {
  constructor(
    private readonly users: UserRepository,
    private readonly jwt: JwtService,
    private readonly hash: PasswordHasher,
  ) {}

  async validateCredentials(email: string, plain: string) {
    const user = await this.users.findByEmail(email);
    if (!user) return null;
    const ok = await this.hash.compare(plain, user.passwordHash);
    return ok ? user : null;
  }

  issueTokens(user: UserEntity) {
    const payload = { sub: user.id, email: user.email };
    return {
      accessToken: this.jwt.sign(payload, { expiresIn: '15m' }),
      refreshToken: this.jwt.sign(payload, { expiresIn: '7d' }),
    };
  }
}
```

## אבטחה
- סיסמאות: Hash + Salt (bcrypt / argon2)
- Refresh Token: החזקה בצד לקוח בלבד; אימות מלא בשרת בכל החלפה
- הגבלת קצב (Rate Limit) לניסיונות התחברות

## חוסן
- כל תשובת כשל מספקת הודעה גנרית (למניעת User Enumeration)
- Log פנימי כולל מזהה בקשה (Request Id) ללא חשיפת נתוני סיסמה

## נקודות קצה טיפוסיות
| שיטה | נתיב | תיאור | מאומת | הרשאות |
|------|------|-------|-------|---------|
| POST | /auth/register | רישום משתמש חדש | לא | ציבורי |
| POST | /auth/login | התחברות | לא | ציבורי |
| POST | /auth/refresh | חידוש טוקן | כן (Refresh) | ציבורי |
| GET | /auth/me | אחזור פרופיל נוכחי | כן | משתמש מאומת |
| GET | /auth/admin/users | רשימת כל המשתמשים | כן | admin בלבד |

## הרשאות מנהל

נקודות הקצה המנהליות דורשות תפקיד `admin`:

```typescript
@Get('admin/users')
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin')
async getAllUsers() {
  // גישה למנהלים בלבד
}
```

למידע מפורט על מערכת ההרשאות, ראו [AUTHORIZATION.md](./AUTHORIZATION.md).

## ולידציה
- כל DTO עובר class-validator
- Sanitization להתאמת Trim

