# Auth Module - EveryTriv

## סקירה כללית

מודול האימות מספק את כל הפונקציונליות הקשורה לאימות משתמשים, כולל רישום, התחברות, ניהול טוקנים, ואימות Google OAuth.

> **הבחנה חשובה**: מודול זה (Authentication - אימות) עוסק בשאלה **"מי אתה?"** - אימות זהות המשתמש, יצירת טוקנים, ורישום/התחברות. לשאלה **"מה אתה רשאי לעשות?"** (Authorization - הרשאה) - תפקידים, בקרת גישה, ו-Guards - ראו [AUTHORIZATION.md](../AUTHORIZATION.md).

לקשר לדיאגרמות: [דיאגרמת זרימת אימות](../../DIAGRAMS.md#דיאגרמת-זרימת-אימות)

## אחריות

- רישום משתמש חדש
- התחברות והנפקת Access Token + Refresh Token
- אימות טוקן קיים
- חידוש טוקן (Refresh Token)
- יציאה (logout)
- אימות Google OAuth
- ניהול מנהל ראשוני

## מבנה מודול

```
server/src/features/auth/
├── dtos/                      # Data Transfer Objects
│   ├── auth.dto.ts            # DTOs לאימות
│   └── index.ts
├── services/                  # שירותים נוספים
│   ├── admin-bootstrap.service.ts # שירות bootstrap למנהל
│   └── index.ts
├── auth.controller.ts         # Controller
├── auth.service.ts            # Service
├── auth.module.ts             # Module
├── google.strategy.ts         # Google OAuth Strategy
└── index.ts
```

## API Endpoints

### POST /auth/register

רישום משתמש חדש.

**Request Body:**
```typescript
{
  email: string;        // אימייל
  password: string;     // סיסמה (6-128 תווים)
  firstName?: string;   // שם פרטי
  lastName?: string;    // שם משפחה
}
```

**Response:**
```typescript
{
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role: UserRole;
  };
}
```

**דוגמת שימוש:**
```typescript
@Post('register')
@Public()
async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
  const result = await this.authService.register(registerDto);
  return result;
}
```

### POST /auth/login

התחברות משתמש.

**Request Body:**
```typescript
{
  email: string;     // אימייל
  password: string;  // סיסמה
}
```

**Response:**
```typescript
{
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role: UserRole;
  };
}
```

**דוגמת שימוש:**
```typescript
@Post('login')
@Public()
async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
  const result = await this.authService.login(loginDto);
  return result;
}
```

### POST /auth/refresh

חידוש Access Token באמצעות Refresh Token.

**Request Body:**
```typescript
{
  refresh_token: string;
}
```

**Response:**
```typescript
{
  access_token: string;
  refresh_token: string;
}
```

**דוגמת שימוש:**
```typescript
@Post('refresh')
@Public()
async refreshToken(@Body() refreshTokenDto: RefreshTokenDto): Promise<RefreshTokenResponseDto> {
  const result = await this.authService.refreshToken(refreshTokenDto.refresh_token);
  return result;
}
```

### GET /auth/me

אחזור פרופיל משתמש נוכחי.

**Response:**
```typescript
{
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
}
```

**דוגמת שימוש:**
```typescript
@Get('me')
async getCurrentUser(@CurrentUser() user: TokenPayload) {
  const profile = await this.userService.getUserProfile(user.sub);
  return profile;
}
```

### GET /auth/google

התחברות Google OAuth.

**Response:** Redirect to Google OAuth

**דוגמת שימוש:**
```typescript
@Get('google')
@UseGuards(PassportAuthGuard('google'))
async googleAuth() {
  // Passport handles the redirect
}

@Get('google/callback')
@UseGuards(PassportAuthGuard('google'))
async googleAuthCallback(@Req() req: GoogleAuthRequest) {
  const result = await this.authService.googleLogin(req.user);
  return result;
}
```

### GET /auth/admin/users

אחזור רשימת כל המשתמשים (מנהל בלבד).

**Response:**
```typescript
{
  users: AdminUserData[];
  total: number;
}
```

**דוגמת שימוש:**
```typescript
@Get('admin/users')
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
async getAllUsers() {
  const result = await this.userService.getAllUsers();
  return result;
}
```

## Service Methods

### AuthService

```typescript
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly authenticationManager: AuthenticationManager,
    private readonly passwordService: PasswordService
  ) {}

  /**
   * Register a new user
   */
  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    // Check if email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      const passwordMatches = existingUser.passwordHash
        ? await this.passwordService.comparePassword(registerDto.password, existingUser.passwordHash)
        : false;

      if (!passwordMatches) {
        throw new BadRequestException('Email already exists');
      }

      // Login existing user
      const tokenPair = await this.jwtTokenService.generateTokenPair(
        existingUser.id,
        existingUser.email,
        existingUser.role
      );

      return {
        access_token: tokenPair.accessToken,
        refresh_token: tokenPair.refreshToken,
        user: {
          id: existingUser.id,
          email: existingUser.email,
          firstName: existingUser.firstName,
          lastName: existingUser.lastName,
          role: existingUser.role,
        },
      };
    }

    // Determine role for new user: first registered user becomes admin
    const adminExists = await this.userRepository.existsBy({ role: UserRole.ADMIN });
    const roleForNewUser = adminExists ? UserRole.USER : UserRole.ADMIN;

    // Hash password
    const hashedPassword = await this.passwordService.hashPassword(registerDto.password);

    // Create user
    const user = this.userRepository.create({
      email: registerDto.email,
      passwordHash: hashedPassword,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      role: roleForNewUser,
      isActive: true,
    });

    const savedUser = await this.userRepository.save(user);

    // Generate tokens
    const tokenPair = await this.jwtTokenService.generateTokenPair(savedUser.id, savedUser.email, savedUser.role);

    return {
      access_token: tokenPair.accessToken,
      refresh_token: tokenPair.refreshToken,
      user: {
        id: savedUser.id,
        email: savedUser.email,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
        role: savedUser.role,
      },
    };
  }

  /**
   * Login user
   */
  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email, isActive: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Use AuthenticationManager for authentication
    const authResult = await this.authenticationManager.authenticate(loginDto, {
      id: user.id,
      email: user.email,
      passwordHash: user.passwordHash || '',
      role: user.role,
      isActive: user.isActive,
    });

    if (authResult.error) {
      throw new UnauthorizedException(authResult.error || 'Invalid credentials');
    }

    if (!authResult.accessToken || !authResult.refreshToken || !authResult.user) {
      throw new UnauthorizedException('Authentication result incomplete');
    }

    return {
      access_token: authResult.accessToken,
      refresh_token: authResult.refreshToken,
      user: authResult.user,
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<RefreshTokenResponseDto> {
    const tokenPair = await this.authenticationManager.refreshTokens(refreshToken);
    return {
      access_token: tokenPair.accessToken,
      refresh_token: tokenPair.refreshToken,
    };
  }

  /**
   * Google OAuth login
   */
  async googleLogin(googleUser: GoogleProfile): Promise<AuthResponseDto> {
    let user = await this.userRepository.findOne({
      where: { googleId: googleUser.id },
    });

    if (!user) {
      // Create new user or link to existing email
      user = await this.userRepository.findOne({
        where: { email: googleUser.email },
      });

      if (user) {
        user.googleId = googleUser.id;
        await this.userRepository.save(user);
      } else {
        const adminExists = await this.userRepository.existsBy({ role: UserRole.ADMIN });
        const roleForNewUser = adminExists ? UserRole.USER : UserRole.ADMIN;

        user = this.userRepository.create({
          email: googleUser.email,
          googleId: googleUser.id,
          firstName: googleUser.given_name,
          lastName: googleUser.family_name,
          avatar: googleUser.picture,
          role: roleForNewUser,
          isActive: true,
        });

        await this.userRepository.save(user);
      }
    }

    const tokenPair = await this.jwtTokenService.generateTokenPair(user.id, user.email, user.role);

    return {
      access_token: tokenPair.accessToken,
      refresh_token: tokenPair.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }
}
```

## אבטחה

### סיסמאות
- Hash + Salt באמצעות bcrypt/argon2
- אימות בטוח עם `PasswordService`
- אין אחסון סיסמאות גולמיות

### Tokens
- Access Token: 15 דקות
- Refresh Token: 7 ימים
- JWT עם חתימה דיגיטלית
- Refresh Token מאוחסן בצד לקוח בלבד

### Rate Limiting
- הגבלת קצב לניסיונות התחברות
- מניעת brute force attacks

### חוסן
- כל תשובת כשל מספקת הודעה גנרית (למניעת User Enumeration)
- Log פנימי כולל מזהה בקשה ללא חשיפת נתוני סיסמה
- Masking של נתונים רגישים בלוגים

## הרשאות מנהל

נקודות הקצה המנהליות דורשות תפקיד `admin`:

```typescript
@Get('admin/users')
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
async getAllUsers() {
  // גישה למנהלים בלבד
}
```

למידע מפורט על מערכת ההרשאות, ראו [AUTHORIZATION.md](../AUTHORIZATION.md).

## ולידציה

- כל DTO עובר class-validator
- Sanitization להתאמת Trim
- בדיקת אורך שדות
- אימות אימייל

## אינטגרציות

- **User Service**: ניהול משתמשים
- **Authentication Manager**: ניהול אימות מרכזי
- **Password Service**: ניהול סיסמאות
- **JWT Service**: יצירת ואימות טוקנים

## קישורים רלוונטיים

- מבנה Backend: `../../README.md#backend`
- API Reference: `../API_REFERENCE.md`
- Common Structure: `../common/README.md`
- דיאגרמות: [דיאגרמת זרימת אימות](../../DIAGRAMS.md#דיאגרמת-זרימת-אימות)

