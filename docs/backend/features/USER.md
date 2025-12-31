# User Module - EveryTriv

## סקירה כללית

מודול המשתמשים מספק את כל הפונקציונליות הקשורה לניהול משתמשים, כולל פרופילים, העדפות, ניהול חשבונות, ופעולות מנהליות.

לקשר לדיאגרמות: [דיאגרמת מודולי Backend](../../DIAGRAMS.md#דיאגרמת-מודולי-backend)

## אחריות
- ניהול פרופיל משתמש
- עדכון שדות מותרים בלבד
- סטטיסטיקות בסיסיות
- ניהול נקודות משתמשים
- חיפוש משתמשים
- ניהול מנהלי (מנהלים בלבד)

## מבנה מודול

```
server/src/features/user/
├── dtos/                       # Data Transfer Objects
│   ├── changePassword.dto.ts    # DTO לשינוי סיסמה
│   ├── deductCredits.dto.ts     # DTO לניכוי נקודות
│   ├── searchUsers.dto.ts       # DTO לחיפוש משתמשים
│   ├── updateSinglePreference.dto.ts # DTO לעדכון העדפה יחידה
│   ├── updateUserCredits.dto.ts # DTO לעדכון נקודות (מנהל)
│   ├── updateUserField.dto.ts   # DTO לעדכון שדה יחיד
│   ├── updateUserPreferences.dto.ts # DTO לעדכון העדפות
│   ├── updateUserProfile.dto.ts # DTO לעדכון פרופיל
│   ├── updateUserStatus.dto.ts  # DTO לעדכון סטטוס (מנהל)
│   └── index.ts
├── user.controller.ts            # Controller
├── user.service.ts              # Service
├── user.module.ts               # Module
└── index.ts
```

## API Endpoints

### GET /users/profile

אחזור פרופיל משתמש נוכחי.

**Response:**
```typescript
{
  id: string;
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}
```

**דוגמת שימוש:**
```typescript
@Get('profile')
@NoCache()
async getUserProfile(@CurrentUser() user: TokenPayload) {
  const result = await this.userService.getUserProfile(user.sub);
  return result;
}
```

### POST /users/credits

ניכוי נקודות ממשתמש נוכחי.

**Request Body:**
```typescript
{
  amount: number;    // מספר נקודות לניכוי
  reason?: string;   // סיבת הניכוי
}
```

**Response:**
```typescript
{
  credits: number;   // נקודות נוכחיות
  deducted: number;  // נקודות שנוכו
}
```

**דוגמת שימוש:**
```typescript
@Post('credits')
async deductCredits(@CurrentUserId() userId: string, @Body() body: DeductCreditsDto) {
  const result = await this.userService.deductCredits(userId, body.amount, body.reason || 'Game play');
  return result;
}
```

### PUT /users/profile

עדכון פרופיל משתמש נוכחי.

**Request Body:**
```typescript
{
  firstName?: string;
  lastName?: string;
  avatar?: string;
  preferences?: Partial<UserPreferences>;
}
```

**Response:**
```typescript
{
  id: string;
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}
```

**דוגמת שימוש:**
```typescript
@Put('profile')
@RequireEmailVerified()
@RequireUserStatus('active')
async updateProfile(@CurrentUserId() userId: string, @Body(UserDataPipe) body: UpdateUserProfileData) {
  const result = await this.userService.updateUserProfile(userId, body);
  return result;
}
```

### PATCH /users/avatar

עדכון avatar של משתמש נוכחי.

**Request Body:**
```typescript
{
  avatarId: number;  // מזהה avatar (1-16)
}
```

**Response:**
```typescript
UserProfileResponseType
```

**דוגמת שימוש:**
```typescript
@Patch('avatar')
@RequireEmailVerified()
@RequireUserStatus('active')
async setAvatar(@CurrentUserId() userId: string | null, @Body() avatarData: SetAvatarDto) {
  const result = await this.userService.setAvatar(userId, avatarData.avatarId);
  return result;
}
```

### GET /users/search

חיפוש משתמשים לפי שאילתה.

**Request Query:**
```typescript
{
  query: string;      // שאילתת חיפוש (מינימום 2 תווים)
  limit?: number;     // מספר תוצאות (ברירת מחדל: 10)
}
```

**Response:**
```typescript
{
  query: string;
  results: Array<{
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
  }>;
  totalResults: number;
}
```

**דוגמת שימוש:**
```typescript
@Get('search')
@Cache(CACHE_DURATION.MEDIUM)
async searchUsers(@Query() query: SearchUsersDto) {
  const result = await this.userService.searchUsers(query.query, query.limit || PAGINATION_LIMITS.DEFAULT);
  return result;
}
```


### DELETE /users/account

מחיקת חשבון משתמש נוכחי.

**Response:**
```typescript
{
  message: string;
}
```

**דוגמת שימוש:**
```typescript
@Delete('account')
async deleteUserAccount(@CurrentUserId() userId: string) {
  const result = await this.userService.deleteUserAccount(userId);
  return result;
}
```

### PUT /users/change-password

שינוי סיסמה של משתמש נוכחי.

**Request Body:**
```typescript
{
  currentPassword: string;  // סיסמה נוכחית
  newPassword: string;      // סיסמה חדשה
}
```

**Response:**
```typescript
{
  message: string;
}
```

**דוגמת שימוש:**
```typescript
@Put('change-password')
async changePassword(@CurrentUserId() userId: string, @Body() passwordData: ChangePasswordDto) {
  const result = await this.userService.changePassword(
    userId,
    passwordData.currentPassword,
    passwordData.newPassword
  );
  return result;
}
```

### PUT /users/preferences

עדכון העדפות משתמש נוכחי.

**Request Body:**
```typescript
Partial<UserPreferences>
```

**Response:**
```typescript
{
  message: string;
  preferences: UserPreferences;
}
```

**דוגמת שימוש:**
```typescript
@Put('preferences')
async updateUserPreferences(@CurrentUserId() userId: string, @Body() preferences: UpdateUserPreferencesDto) {
  const result = await this.userService.updateUserPreferences(userId, preferences);
  return result;
}
```

### PATCH /users/profile/:field

עדכון שדה יחיד בפרופיל משתמש נוכחי.

**Path Parameters:**
- `field`: שם השדה לעדכון (email, firstName, lastName, avatar, וכו')

**Request Body:**
```typescript
{
  value: BasicValue;  // הערך החדש
}
```

**Response:**
```typescript
UserEntity
```

**דוגמת שימוש:**
```typescript
@Patch('profile/:field')
async updateUserField(
  @CurrentUserId() userId: string,
  @Param('field') field: string,
  @Body() body: UpdateUserFieldDto
) {
  const result = await this.userService.updateUserField(userId, field, body.value);
  return result;
}
```

### PATCH /users/preferences/:preference

עדכון העדפה יחידה של משתמש נוכחי.

**Path Parameters:**
- `preference`: שם ההעדפה לעדכון

**Request Body:**
```typescript
{
  value: BasicValue;  // הערך החדש
}
```

**Response:**
```typescript
UserEntity
```

**דוגמת שימוש:**
```typescript
@Patch('preferences/:preference')
async updateSinglePreference(
  @CurrentUserId() userId: string,
  @Param('preference') preference: string,
  @Body() body: UpdateSinglePreferenceDto
) {
  const result = await this.userService.updateSinglePreference(userId, preference, body.value);
  return result;
}
```

### GET /users/:id

אחזור משתמש לפי ID.

**Response:**
```typescript
UserEntity | null
```

**דוגמת שימוש:**
```typescript
@Get(':id')
@Cache(CACHE_DURATION.MEDIUM)
async getUserById(@Param('id') id: string) {
  const result = await this.userService.getUserById(id);
  return result;
}
```

### PATCH /users/credits/:userId (Admin)

עדכון נקודות משתמש (מנהלים בלבד).

**Request Body:**
```typescript
{
  amount: number;    // מספר נקודות (חיובי או שלילי)
  reason: string;    // סיבת העדכון
}
```

**Response:**
```typescript
UserEntity
```

**דוגמת שימוש:**
```typescript
@Patch('credits/:userId')
@Roles(UserRole.ADMIN)
async updateUserCredits(@Param('userId') userId: string, @Body() creditsData: UpdateUserCreditsDto) {
  const result = await this.userService.updateUserCredits(userId, creditsData.amount, creditsData.reason);
  return result;
}
```

### DELETE /users/:userId (Admin)

מחיקת משתמש (מנהלים בלבד).

**Response:**
```typescript
{
  message: string;
}
```

**דוגמת שימוש:**
```typescript
@Delete(':userId')
@Roles(UserRole.ADMIN)
async deleteUser(@Param('userId') userId: string) {
  const result = await this.userService.deleteUserAccount(userId);
  return result;
}
```

### PATCH /users/:userId/status (Admin)

עדכון סטטוס משתמש (מנהלים בלבד).

**Request Body:**
```typescript
{
  status: UserStatus;  // active, inactive, suspended, banned
}
```

**Response:**
```typescript
UserEntity
```

**דוגמת שימוש:**
```typescript
@Patch(':userId/status')
@Roles(UserRole.ADMIN)
async updateUserStatus(@Param('userId') userId: string, @Body() statusData: UpdateUserStatusDto) {
  const result = await this.userService.updateUserStatus(userId, statusData.status);
  return result;
}
```

### PATCH /users/admin/:userId/status (Admin)

עדכון סטטוס משתמש על ידי מנהל (מנהלים בלבד, עם בדיקת אימות מפורשת).

**Request Body:**
```typescript
{
  status: UserStatus;  // active, inactive, suspended, banned
}
```

**Response:**
```typescript
{
  userId: string;
  status: UserStatus;
  isActive: boolean;
  updatedAt: string;
}
```

**דוגמת שימוש:**
```typescript
@Patch('admin/:userId/status')
@Roles(UserRole.ADMIN)
async adminUpdateUserStatus(
  @CurrentUser() adminUser: BasicUser | null,
  @Param('userId') userId: string,
  @Body() statusData: UpdateUserStatusDto
) {
  if (!adminUser || !adminUser.id) {
    throw new ForbiddenException(ERROR_CODES.USER_NOT_AUTHENTICATED);
  }
  const updated = await this.userService.updateUserStatus(userId, statusData.status);
  return {
    userId: updated.id,
    status: statusData.status,
    isActive: updated.isActive,
    updatedAt: updated.updatedAt ? updated.updatedAt.toISOString() : new Date().toISOString(),
  };
}
```

### GET /users/admin/all (Admin)

אחזור כל המשתמשים (מנהלים בלבד).

**Request Query:**
```typescript
{
  limit?: number;    // מספר תוצאות (אופציונלי)
  offset?: number;   // אופסט (אופציונלי)
}
```

**Response:**
```typescript
{
  message: string;
  success: boolean;
  adminUser: AdminUserData;
  users: AdminUserData[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
  timestamp: string;
}
```

**דוגמת שימוש:**
```typescript
@Get('admin/all')
@Roles(UserRole.ADMIN)
@Cache(CACHE_DURATION.MEDIUM)
async getAllUsers(
  @CurrentUser() user: TokenPayload,
  @Query('limit') limit?: number,
  @Query('offset') offset?: number
) {
  const result = await this.userService.getAllUsers(limit, offset);
  return {
    message: 'Users retrieved successfully',
    success: true,
    adminUser: /* ... */,
    users: result.users,
    pagination: {
      total: result.total,
      limit: result.limit,
      offset: result.offset,
    },
    timestamp: new Date().toISOString(),
  };
}
```

## Service Methods

### UserService

```typescript
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly cacheService: CacheService,
    private readonly storageService: ServerStorageService,
    private readonly authenticationManager: AuthenticationManager,
    private readonly passwordService: PasswordService,
    private readonly validationService: ValidationService
  ) {}

  /**
   * Get user profile by ID
   */
  async getUserProfile(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      preferences: user.preferences,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId: string, profileData: UpdateUserProfileData) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Update user fields
    if (profileData.firstName !== undefined) user.firstName = profileData.firstName;
    if (profileData.lastName !== undefined) user.lastName = profileData.lastName;
    if (profileData.avatar !== undefined) user.avatar = profileData.avatar;
    if (profileData.preferences !== undefined)
      user.preferences = mergeUserPreferences(user.preferences, profileData.preferences);

    // Save updated user
    const updatedUser = await this.userRepository.save(user);

    // Invalidate user profile cache
    await this.cacheService.delete(`user:profile:${userId}`);
    await this.cacheService.delete(`user:stats:${userId}`);

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      avatar: updatedUser.avatar,
      preferences: updatedUser.preferences,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    };
  }

  /**
   * Search users
   */
  async searchUsers(query: string, limit: number = 10): Promise<UserSearchCacheEntry> {
    const normalizedQuery = normalizeText(query);
    if (!normalizedQuery || normalizedQuery.length < 2) {
      throw new BadRequestException('Search query must be at least 2 characters long');
    }

    const cacheKey = `user:search:${normalizedQuery}:${limit}`;

    return await this.cacheService.getOrSet<UserSearchCacheEntry>(
      cacheKey,
      async () => {
        const users = await this.userRepository
          .createQueryBuilder('user')
          .where('user.email ILIKE :query OR user.firstName ILIKE :query OR user.lastName ILIKE :query', {
            query: `%${normalizedQuery}%`,
          })
          .andWhere('user.is_active = :isActive', { isActive: true })
          .select(['user.id', 'user.email', 'user.firstName', 'user.lastName', 'user.avatar'])
          .limit(limit)
          .getMany();

        return {
          query,
          results: users.map(user => ({
            id: user.id,
            email: user.email,
            firstName: user.firstName ?? null,
            lastName: user.lastName ?? null,
            avatar: user.avatar ?? null,
          })),
          totalResults: users.length,
        };
      },
      CACHE_DURATION.MEDIUM
    );
  }

    return user;
  }

  /**
   * Delete user account
   */
  async deleteUserAccount(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Soft delete by setting is_active to false
    user.isActive = false;
    await this.userRepository.save(user);

    // Invalidate all user-related cache
    await this.cacheService.delete(`user:profile:${userId}`);
    await this.cacheService.delete(`user:stats:${userId}`);
    await this.cacheService.delete(`user:credits:${userId}`);

    return {
      message: 'Account deleted successfully',
    };
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    if (!user.passwordHash) {
      throw new BadRequestException('Password not set');
    }
    const isCurrentPasswordValid = await this.passwordService.comparePassword(currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await this.passwordService.hashPassword(newPassword);

    // Update password
    user.passwordHash = newPasswordHash;
    await this.userRepository.save(user);

    // Clear user cache
    await this.cacheService.delete(`user:profile:${userId}`);

    return {
      message: 'Password changed successfully',
    };
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(userId: string, preferences: Partial<UserPreferences>) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Merge existing preferences with new ones (deep merge)
    user.preferences = mergeUserPreferences(user.preferences, preferences);
    await this.userRepository.save(user);

    // Invalidate user profile cache
    await this.cacheService.delete(`user:profile:${userId}`);

    return {
      message: 'Preferences updated successfully',
      preferences: user.preferences,
    };
  }

  /**
   * Update single user field
   */
  async updateUserField(userId: string, field: string, value: BasicValue): Promise<UserEntity> {
    const validFields = [
      'email',
      'firstName',
      'lastName',
      'avatar',
      'isActive',
      'credits',
      'purchasedCredits',
      'dailyFreeQuestions',
      'remainingFreeQuestions',
      'role',
      'currentSubscriptionId',
      'status',
    ];

    if (!validFields.includes(field)) {
      throw new BadRequestException(`Invalid field: ${field}`);
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Field type mapping for validation
    const fieldTypeMap: Record<
      string,
      { type: 'string' | 'number' | 'boolean'; fieldName?: string; minLength?: number; maxLength?: number }
    > = {
      email: { type: 'string' },
      firstName: { type: 'string' },
      lastName: { type: 'string' },
      avatar: { type: 'string' },
      isActive: { type: 'boolean' },
      credits: { type: 'number' },
      purchasedCredits: { type: 'number' },
      dailyFreeQuestions: { type: 'number' },
      remainingFreeQuestions: { type: 'number' },
    };

    // Handle special fields (role, currentSubscriptionId, status)
    if (field === 'role') {
      const validRole = Object.values(UserRole).find(role => role === value);
      if (validRole) {
        user.role = validRole;
      } else {
        throw createValidationError('role', 'string');
      }
    } else if (field === 'currentSubscriptionId') {
      if (typeof value === 'string' || value === null || value === undefined) {
        user.currentSubscriptionId = typeof value === 'string' ? value : undefined;
      } else {
        throw createValidationError('currentSubscriptionId', 'string');
      }
    } else if (field === 'status') {
      if (typeof value !== 'string') {
        throw createValidationError('status', 'string');
      }
      const nextStatus = Object.values(UserStatus).find(statusOption => statusOption === value);
      if (!nextStatus) {
        throw createValidationError('status', 'string');
      }
      user.isActive = nextStatus === UserStatus.ACTIVE;
    } else {
      // Use ValidationService to validate and set field based on type
      if (fieldTypeMap[field]) {
        const fieldConfig = fieldTypeMap[field];
        const targetField = fieldConfig.fieldName || field;

        // Use ValidationService to validate and set field based on type
        switch (fieldConfig.type) {
          case 'string':
            this.validationService.validateAndSetStringField(
              user,
              targetField,
              value,
              fieldConfig.minLength,
              fieldConfig.maxLength
            );
            break;
          case 'number':
            this.validationService.validateAndSetNumberField(user, targetField, value);
            break;
          case 'boolean':
            this.validationService.validateAndSetBooleanField(user, targetField, value);
            break;
        }
      }
    }

    await this.userRepository.save(user);

    // Invalidate cache
    await this.cacheService.delete(`user:profile:${userId}`);
    await this.cacheService.delete(`user:stats:${userId}`);

    return user;
  }

  /**
   * Update single preference
   */
  async updateSinglePreference(userId: string, preference: string, value: BasicValue): Promise<UserEntity> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Initialize preferences if not exists
    if (!user.preferences) {
      user.preferences = DEFAULT_USER_PREFERENCES;
    }

    // Update the specific preference using spread operator
    user.preferences = {
      ...user.preferences,
      [preference]: value,
    };

    await this.userRepository.save(user);

    // Invalidate cache
    await this.cacheService.delete(`user:profile:${userId}`);

    return user;
  }

  /**
   * Update user credits (admin)
   */
  async updateUserCredits(userId: string, amount: number, reason: string): Promise<UserEntity> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.credits = (user.credits || 0) + amount;
    await this.userRepository.save(user);

    // Invalidate cache
    await this.cacheService.delete(`user:credits:${userId}`);
    await this.cacheService.delete(`user:profile:${userId}`);

    return user;
  }

  /**
   * Update user status (admin)
   */
  async updateUserStatus(userId: string, status: UserStatus): Promise<UserEntity> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.status = status;
    user.isActive = status === UserStatus.ACTIVE;
    await this.userRepository.save(user);

    // Invalidate cache
    await this.cacheService.delete(`user:profile:${userId}`);

    return user;
  }

  /**
   * Get all users (admin)
   */
  async getAllUsers(limit?: number, offset?: number) {
    const queryBuilder = this.userRepository.createQueryBuilder('user');

    if (limit) {
      queryBuilder.limit(limit);
    }
    if (offset) {
      queryBuilder.offset(offset);
    }

    const [users, total] = await queryBuilder.getManyAndCount();

    return {
      users: users.map(user => ({
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
      })),
      total,
      limit: limit || users.length,
      offset: offset || 0,
    };
  }

  /**
   * Deduct credits from user
   */
  async deductCredits(userId: string, amount: number, reason: string): Promise<{ credits: number; deducted: number }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const currentCredits = user.credits || 0;
    if (currentCredits < amount) {
      throw new BadRequestException('Insufficient credits');
    }

    user.credits = currentCredits - amount;
    await this.userRepository.save(user);

    // Invalidate cache
    await this.cacheService.delete(`user:credits:${userId}`);
    await this.cacheService.delete(`user:profile:${userId}`);

    return {
      credits: user.credits,
      deducted: amount,
    };
  }
}
```

## Cache Strategy

| סוג נתון | Key Pattern | TTL | הערה |
|----------|-------------|-----|------|
| פרופיל משתמש | `user:profile:{userId}` | - | מוסר בעת עדכון |
| חיפוש משתמשים | `user:search:{query}:{limit}` | 300s | עדכון אוטומטי |
| נקודות משתמש | `user:credits:{userId}` | - | מוסר בעת עדכון |
| סטטיסטיקות משתמש | `user:stats:{userId}` | - | מוסר בעת עדכון |

## אבטחה
- כל פעולה מחייבת אימות משתמש (חוץ מ-search שעשוי להיות ציבורי)
- עדכון רק לשדות מותרים
- בדיקת הרשאות מנהליות על פעולות מנהליות
- ולידציית שדות לפני עדכון

## אינטגרציות

- **Authentication Manager**: ניהול אימות ומשתמשים
- **Password Service**: ניהול סיסמאות
- **Cache Service**: ניהול מטמון
- **Storage Service**: ניהול אחסון
- **Validation Service**: ולידציית נתונים

## קישורים רלוונטיים

- מבנה Backend: `../../README.md#backend`
- API Reference: `../API_REFERENCE.md`
- Internal Structure: `../internal/README.md`
- Authorization: `../AUTHORIZATION.md`
- דיאגרמות: [דיאגרמת מודולי Backend](../../DIAGRAMS.md#דיאגרמת-מודולי-backend)

---
 