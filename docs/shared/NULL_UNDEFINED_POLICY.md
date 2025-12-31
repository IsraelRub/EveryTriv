# Null vs Undefined Policy - EveryTriv

## סקירה כללית

מסמך זה מגדיר את המדיניות הרשמית לטיפול ב-`null` ו-`undefined` בפרויקט EveryTriv.

**גישה:** מתודולוגיה היברידית ומודרנית

---

## עקרונות יסוד

### 1. מתי להשתמש ב-`null`

**שימוש:** ערכים שנשמרים בבסיס הנתונים או מייצגים "אין ערך" באופן מפורש.

**דוגמאות:**
- שדות אופציונליים ב-TypeORM entities עם `nullable: true`
- ערכים שמייצגים "ריק" או "לא קיים" במודל העסקי
- ערכי ברירת מחדל לשדות שעשויים להיות ריקים

```typescript
// ✅ Good - DB field
@Column({ name: 'password_hash', nullable: true })
passwordHash: string | null = null;

// ✅ Good - Explicit "no value"
@Column({ name: 'user_id', type: 'uuid', nullable: true })
userId: string | null = null;

// ✅ Good - Optional timestamp
@Column('timestamp', { name: 'last_login', nullable: true })
lastLogin: Date | null = null;
```

### 2. מתי להשתמש ב-`undefined`

**שימוש:** שדות computed/transient, שדות שלא הוגדרו, או פרמטרים אופציונליים.

**דוגמאות:**
- פרמטרים אופציונליים בפונקציות
- שדות אופציונליים ב-DTOs
- Computed getters שעשויים לא להחזיר ערך
- שדות שלא הוגדרו בממשקי TypeScript

```typescript
// ✅ Good - Optional DTO field
export class UpdateUserProfileDto {
  @IsOptional()
  @IsString()
  firstName?: string; // undefined if not provided
}

// ✅ Good - Optional parameter
function processData(value: string, options?: ProcessOptions) {
  const timeout = options?.timeout ?? 5000;
}

// ✅ Good - Computed getter
get completedAt(): Date | undefined {
  return this.metadata.completedAt != null 
    ? new Date(this.metadata.completedAt) 
    : undefined;
}
```

### 3. מתי להשתמש ב-`Type?` (Optional Properties)

**שימוש:** שדות אופציונליים בממשקים, DTOs, ופרמטרים.

```typescript
// ✅ Good - Interface with optional fields
interface UserProfile {
  id: string;
  email: string;
  firstName?: string; // May not be set
  lastName?: string;
  avatar?: number;
}

// ✅ Good - Optional function parameters
function createGame(
  topic: string,
  difficulty: string,
  options?: GameOptions
) {
  // ...
}
```

---

## דיאגרמת החלטה

```mermaid
flowchart TD
    Start{האם הערך קשור ל-DB?}
    Start -->|כן| DBCheck{nullable: true?}
    Start -->|לא| NonDB{סוג השימוש?}
    
    DBCheck -->|כן| UseNull[Type | null = null]
    DBCheck -->|לא| UseRequired[Type - חובה]
    
    NonDB -->|Computed/Getter| UseUndefined[Type | undefined]
    NonDB -->|DTO/Interface| UseOptional[Type?]
    NonDB -->|Function param| UseOptional
    
    UseNull --> NullExample["@Column nullable: true<br/>passwordHash: string | null = null"]
    UseUndefined --> UndefinedExample["get value(): T | undefined<br/>return computed ?? undefined"]
    UseOptional --> OptionalExample["interface { field?: string }<br/>function(param?: number)"]
    UseRequired --> RequiredExample["@Column<br/>email: string"]
```

---

## טבלת החלטות מהירה

| הקשר | שימוש | דוגמה | הסבר |
|------|-------|-------|------|
| **TypeORM Entity - nullable** | `Type \| null = null` | `passwordHash: string \| null = null` | DB מאפשר NULL |
| **TypeORM Entity - required** | `Type` | `email: string` | DB דורש ערך |
| **DTO - Optional field** | `Type?` | `firstName?: string` | פרמטר אופציונלי |
| **Interface - Optional** | `Type?` | `avatar?: number` | שדה אופציונלי |
| **Function parameter** | `Type?` | `options?: Options` | פרמטר אופציונלי |
| **Computed getter** | `Type \| undefined` | `get value(): T \| undefined` | עשוי לא להיות זמין |
| **Explicit "no value"** | `null` | `selected: null` | "אין בחירה" |
| **Not loaded yet** | `undefined` | `data: undefined` | "עדיין לא נטען" |

---

## בדיקות null/undefined

### שימוש ב-Nullish Coalescing (`??`)

**עקרון:** השתמש ב-`??` במקום `||` לערכי ברירת מחדל.

```typescript
// ✅ Good - Nullish coalescing
const timeout = options?.timeout ?? 5000;
const name = user.firstName ?? 'Guest';
const count = data?.count ?? 0;

// ❌ Bad - Logical OR (problematic for 0, '', false)
const timeout = options?.timeout || 5000; // 0 would become 5000!
const count = data?.count || 0; // 0 would stay 0, but unclear intent
```

### שימוש ב-Optional Chaining (`?.`)

**עקרון:** השתמש ב-`?.` לגישה בטוחה לשדות.

```typescript
// ✅ Good - Optional chaining
const email = user?.profile?.email;
const firstItem = array?.[0];
const result = callback?.();

// ❌ Bad - Manual checks
const email = user && user.profile && user.profile.email;
const firstItem = array && array.length > 0 ? array[0] : undefined;
```

### בדיקת null **וגם** undefined

**עקרון:** השתמש ב-`== null` לבדיקת שני המקרים.

```typescript
// ✅ Good - Checks both null and undefined
if (value == null) {
  return defaultValue;
}

if (data != null) {
  processData(data);
}

// ❌ Bad - Verbose
if (value === null || value === undefined) {
  return defaultValue;
}

// ⚠️ Use with caution - Strict equality when you need to distinguish
if (value === null) {
  // Specifically null, not undefined
}
```

### בדיקה שערך קיים

```typescript
// ✅ Good - Check value exists
if (user?.credits != null) {
  deductCredits(user.credits);
}

// ✅ Good - With nullish coalescing
const credits = user?.credits ?? 0;

// ❌ Bad - Doesn't check for null/undefined
if (user.credits) { // Fails for 0!
  deductCredits(user.credits);
}
```

---

## דוגמאות לפי הקשר

### TypeORM Entities

```typescript
import { Column, Entity } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('users')
export class UserEntity extends BaseEntity {
  // ✅ Required field - no null
  @Column()
  email: string;

  // ✅ Optional field - null in DB
  @Column({ name: 'password_hash', nullable: true })
  passwordHash: string | null = null;

  // ✅ Optional field - null in DB
  @Column({ name: 'google_id', nullable: true })
  googleId: string | null = null;

  // ✅ Optional field - null in DB
  @Column({ name: 'first_name', nullable: true })
  firstName: string | null = null;

  // ✅ Optional timestamp - null in DB
  @Column('timestamp', { name: 'last_login', nullable: true })
  lastLogin: Date | null = null;

  // ✅ Required field with default
  @Column('int', { default: 100 })
  credits: number = 100;
}
```

### DTOs (Data Transfer Objects)

```typescript
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserProfileDto {
  /**
   * First name (optional - undefined if not provided)
   * Note: Converted to null when saving to DB
   */
  @ApiPropertyOptional({
    description: 'First name',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  firstName?: string; // ✅ undefined in DTO, null in DB

  /**
   * Last name (optional - undefined if not provided)
   * Note: Converted to null when saving to DB
   */
  @ApiPropertyOptional({
    description: 'Last name',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  lastName?: string; // ✅ undefined in DTO, null in DB
}
```

### Type Guards

```typescript
// ✅ Good - Using nullish check
const hasOptionalPrimitive = (
  value: unknown, 
  type: 'string' | 'number' | 'boolean'
): boolean => {
  return value == null || typeof value === type;
};

// ✅ Good - Nullable guard
export const createNullableGuard =
  <T>(guard: (value: unknown) => value is T) =>
  (value: unknown): value is T | null =>
    value == null || guard(value);

// ✅ Good - Using in validation
export const isUserSearchCacheEntry = (
  value: unknown
): value is UserSearchCacheEntry => {
  if (!isRecord(value)) return false;

  return value.results.every(
    result =>
      isRecord(result) &&
      hasOptionalPrimitive(result.firstName, 'string') && // ✅
      hasOptionalPrimitive(result.lastName, 'string') && // ✅
      hasOptionalPrimitive(result.avatar, 'number') // ✅
  );
};
```

### Services

```typescript
export class CacheService {
  async get<T>(key: string): Promise<T | null> {
    const cachedData = await this.redis.get(key);
    
    // ✅ Good - Nullish check
    if (cachedData == null) {
      return null;
    }

    return JSON.parse(cachedData) as T;
  }

  async set<T>(
    key: string, 
    value: T, 
    ttl?: number
  ): Promise<void> {
    // ✅ Good - Nullish coalescing with optional param
    const expirySeconds = ttl ?? this.defaultTTL;
    
    await this.redis.setex(
      key, 
      expirySeconds, 
      JSON.stringify(value)
    );
  }
}
```

### React Components

```typescript
interface GameSessionProps {
  gameId: string;
  initialData?: GameData; // ✅ Optional prop
}

export const GameSession: React.FC<GameSessionProps> = ({ 
  gameId, 
  initialData 
}) => {
  // ✅ Good - Nullish coalescing for state
  const [data, setData] = useState<GameData | null>(
    initialData ?? null
  );

  // ✅ Good - Optional chaining
  const score = data?.score ?? 0;
  const playerName = data?.player?.name ?? 'Guest';

  // ✅ Good - Null check before rendering
  if (data == null) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <h1>{playerName}</h1>
      <p>Score: {score}</p>
    </div>
  );
};
```

### Redux State

```typescript
interface GameState {
  currentGame: Game | null; // ✅ null = no active game
  questions: Question[] | undefined; // ✅ undefined = not loaded
  selectedAnswer: number | null; // ✅ null = no selection
  error: string | undefined; // ✅ undefined = no error
}

const initialState: GameState = {
  currentGame: null, // ✅ Explicit "no game"
  questions: undefined, // ✅ "Not loaded yet"
  selectedAnswer: null, // ✅ "No selection"
  error: undefined, // ✅ "No error"
};

// Reducer
const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    setGame(state, action: PayloadAction<Game | null>) {
      // ✅ Good - Nullish coalescing
      state.currentGame = action.payload ?? null;
    },
    selectAnswer(state, action: PayloadAction<number>) {
      state.selectedAnswer = action.payload;
    },
    clearSelection(state) {
      state.selectedAnswer = null; // ✅ Explicit clear
    },
    setError(state, action: PayloadAction<string | undefined>) {
      // ✅ Good - Optional chaining
      state.error = action.payload?.trim() ?? undefined;
    },
  },
});
```

---

## Getters/Setters ב-Entities

```typescript
@Entity('payment_history')
export class PaymentHistoryEntity extends BaseEntity {
  @Column({ name: 'payment_method', type: 'varchar', nullable: true })
  private paymentMethodInternal: PaymentMethod | null = null;

  @Column('jsonb', { name: 'metadata', default: () => "'{}'::jsonb" })
  private metadataInternal: PaymentHistoryMetadata = {};

  // ✅ Good - Returns undefined for computed property
  get paymentMethod(): PaymentMethod | undefined {
    return this.paymentMethodInternal ?? undefined;
  }

  set paymentMethod(value: PaymentMethod | undefined) {
    // ✅ Good - Converts undefined to null for DB
    this.paymentMethodInternal = value ?? null;
  }

  // ✅ Good - Nullish check in getter
  get completedAt(): Date | undefined {
    return this.metadataInternal.completedAt != null
      ? new Date(this.metadataInternal.completedAt)
      : undefined;
  }

  set completedAt(value: Date | undefined) {
    if (value != null) {
      this.metadataInternal.completedAt = value.toISOString();
    } else {
      delete this.metadataInternal.completedAt;
    }
  }
}
```

---

## דוגמאות טובות ורעות

### ✅ Good Examples

```typescript
// Nullish coalescing for defaults
const timeout = config?.timeout ?? 5000;
const retries = options?.retries ?? 3;

// Optional chaining for safe access
const email = user?.profile?.email;
const firstQuestion = game?.questions?.[0];

// Nullish check for both null and undefined
if (data == null) return;
if (value != null) process(value);

// Explicit null for "no value" in business logic
const selectedAnswer: number | null = null;
const currentGame: Game | null = null;

// Undefined for optional parameters
function fetchData(url: string, options?: FetchOptions) {
  const timeout = options?.timeout ?? 5000;
}

// Type | null for DB fields
@Column({ nullable: true })
lastName: string | null = null;
```

### ❌ Bad Examples

```typescript
// ❌ Logical OR instead of nullish coalescing
const timeout = config?.timeout || 5000; // 0 becomes 5000!
const count = data?.count || 0; // 0 stays 0, but intent unclear

// ❌ Manual null/undefined checks
if (value === null || value === undefined) return;
const email = user && user.profile && user.profile.email;

// ❌ Mixing Type? with Type | null inconsistently
@Column({ nullable: true })
firstName?: string; // Should be: string | null = null

// ❌ Using || for booleans/numbers
const isEnabled = config?.enabled || false; // false becomes false, but unclear
const score = player?.score || 0; // 0 becomes 0, but unclear

// ❌ Not using optional chaining
const email = user ? (user.profile ? user.profile.email : undefined) : undefined;

// ❌ Using 'as' to bypass null checks
const value = data as string; // Unsafe!
```

---

## אינטגרציה עם Validation

### Validation Service

```typescript
export class ValidationService {
  async validateUsername(
    value: string, 
    options?: ValidationOptions
  ): Promise<ValidationResult> {
    // ✅ Good - Nullish coalescing for options
    const sanitized = sanitizeInput(value ?? '');
    const logFailures = options?.logFailures ?? true;
    const maxLength = options?.maxLength ?? 30;

    // ✅ Good - Optional chaining
    if (options?.sanitizeInputs) {
      value = sanitizeInput(value);
    }

    // Validation logic...
    return { isValid: true, errors: [] };
  }
}
```

### Type Guards in Validation

```typescript
// ✅ Good - Nullish check in type guard
const hasOptionalBasicValue = (
  value: unknown, 
  type: 'string' | 'number' | 'boolean'
): boolean => {
  return value == null || typeof value === type;
};

// Usage in entity validation
export const isCreditBalanceCacheEntry = (
  value: unknown
): value is CreditBalance => {
  if (!isRecord(value)) return false;

  return (
    hasBasicValue(value.totalCredits, 'number') &&
    hasBasicValue(value.credits, 'number') &&
    hasOptionalBasicValue(value.nextResetTime, 'string') // ✅
  );
};
```

---

## ESLint Rules

הפרויקט משתמש ב-ESLint rules הבאים לאכיפת המדיניות:

```javascript
// tools/eslint.config.js
rules: {
  // Enforce nullish coalescing over logical OR
  '@typescript-eslint/prefer-nullish-coalescing': ['error', {
    ignoreConditionalTests: false,
    ignoreMixedLogicalExpressions: false,
  }],
  
  // Enforce optional chaining
  '@typescript-eslint/prefer-optional-chain': 'error',
  
  // Allow == null for null/undefined checks
  'eqeqeq': ['error', 'always', { null: 'ignore' }],
}
```

---

## TypeScript Compiler Options

```json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": false
  }
}
```

**הסבר:**
- `strict: true` - מצב strict מלא
- `strictNullChecks: true` - אכיפת בדיקות null/undefined
- `noUncheckedIndexedAccess: true` - גישה למערכים מחזירה `T | undefined`
- `exactOptionalPropertyTypes: false` - מאפשר `Type?` להיות `Type | undefined`

---

## המרה בין null ל-undefined

### DTO → Entity (undefined → null)

```typescript
// In service
async updateUserProfile(
  userId: string, 
  dto: UpdateUserProfileDto
): Promise<UserEntity> {
  const user = await this.userRepository.findOne({ where: { id: userId } });
  
  // ✅ Good - Convert undefined to null for DB
  if (dto.firstName !== undefined) {
    user.firstName = dto.firstName ?? null;
  }
  
  if (dto.lastName !== undefined) {
    user.lastName = dto.lastName ?? null;
  }
  
  return await this.userRepository.save(user);
}
```

### Entity → Response (null → undefined)

```typescript
// In controller
@Get('profile')
async getProfile(@UserId() userId: string): Promise<UserProfileResponse> {
  const user = await this.userService.findById(userId);
  
  // ✅ Good - Convert null to undefined for API response
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName ?? undefined,
    lastName: user.lastName ?? undefined,
    avatar: user.avatar ?? undefined,
  };
}
```

---

## סיכום עקרונות

### ✅ DO:
1. השתמש ב-`Type | null = null` לשדות DB עם `nullable: true`
2. השתמש ב-`Type?` לשדות אופציונליים ב-DTOs וממשקים
3. השתמש ב-`??` במקום `||` לערכי ברירת מחדל
4. השתמש ב-`?.` לגישה בטוחה לשדות
5. השתמש ב-`== null` לבדיקת null **וגם** undefined
6. השתמש ב-`!= null` לבדיקה שערך קיים
7. המר `undefined` ל-`null` בעת שמירה ל-DB
8. המר `null` ל-`undefined` בעת החזרת API responses (אופציונלי)

### ❌ DON'T:
1. אל תשתמש ב-`=== null || === undefined` (השתמש ב-`== null`)
2. אל תשתמש ב-`|| defaultValue` עבור numbers/booleans (השתמש ב-`??`)
3. אל תערבב `Type?` עם `Type | null` באותו הקשר ללא סיבה
4. אל תשתמש ב-`as Type` לעקוף null checks
5. אל תשתמש ב-`!` (non-null assertion) אלא אם כן אתה בטוח 100%

---

## קישורים נוספים

- [TypeScript Handbook - Null and Undefined](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#null-and-undefined)
- [MDN - Nullish Coalescing](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing)
- [MDN - Optional Chaining](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining)
- [`docs/shared/TYPES.md`](./TYPES.md) - תיעוד טיפוסים משותפים
- [`docs/backend/common/VALIDATION.md`](../backend/common/VALIDATION.md) - תיעוד validation
- [`docs/shared/SHARED_PACKAGE.md`](./SHARED_PACKAGE.md) - תיעוד shared package

