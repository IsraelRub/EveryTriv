# הגדרת מסד נתונים - EveryTriv

מדריך מקיף להגדרת מסד נתונים עבור EveryTriv, כולל PostgreSQL ו-Redis, עם הוראות התקנה, קונפיגורציה וניהול.

לדיאגרמות מפורטות, ראו: [דיאגרמות - מסד נתונים](../DIAGRAMS.md#דיאגרמת-מסד-נתונים-erd)

## דרישות מערכת

- **PostgreSQL**: גרסה 16 ומעלה
- **Redis**: גרסה 7 ומעלה
- **Docker**: (אופציונלי) לפריסה
- **Node.js**: גרסה 18 ומעלה

## הגדרת PostgreSQL

### התקנה עם Docker

```bash
# הפעלת PostgreSQL עם Docker
docker run -d \
  --name everytriv-postgres \
  -e POSTGRES_DB=everytriv \
  -e POSTGRES_USER=everytriv_user \
  -e POSTGRES_PASSWORD=test123 \
  -p 5432:5432 \
  -v postgres_data:/var/lib/postgresql/data \
  postgres:16-alpine
```

### הגדרת מסד נתונים

```sql
-- התחברות ל-PostgreSQL
psql -U postgres

-- יצירת משתמש
CREATE USER everytriv_user WITH PASSWORD 'test123';

-- יצירת מסד נתונים
CREATE DATABASE everytriv OWNER everytriv_user;

-- הרשאות
GRANT ALL PRIVILEGES ON DATABASE everytriv TO everytriv_user;
GRANT ALL ON SCHEMA public TO everytriv_user;

-- יצירת הרחבות נדרשות
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
```

## הגדרת Redis

### התקנה עם Docker

```bash
# הפעלת Redis עם Docker
docker run -d \
  --name everytriv-redis \
  -p 6379:6379 \
  -v redis_data:/data \
  redis:7-alpine redis-server --requirepass R3d!s_Pr0d_P@ssw0rd_2025_S3cur3!
```

### הגדרת Redis

```bash
# התחברות ל-Redis
redis-cli -a R3d!s_Pr0d_P@ssw0rd_2025_S3cur3!

# בדיקת חיבור
PING
```

## קונפיגורציית TypeORM

### data-source.ts

```typescript
import { DataSource } from 'typeorm';
import { AppConfig } from './app.config';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: AppConfig.database.host,
  port: AppConfig.database.port,
  username: AppConfig.database.username,
  password: AppConfig.database.password,
  database: AppConfig.database.name,
  schema: AppConfig.database.schema,
  entities: [
    __dirname + '/../internal/entities/user.entity.ts',
    __dirname + '/../internal/entities/userStats.entity.ts',
    __dirname + '/../internal/entities/gameHistory.entity.ts',
    __dirname + '/../internal/entities/trivia.entity.ts',
    __dirname + '/../internal/entities/paymentHistory.entity.ts',
    __dirname + '/../internal/entities/creditTransaction.entity.ts',
    __dirname + '/../internal/entities/leaderboard.entity.ts',
  ],
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],
  synchronize: false,
  logging: AppConfig.database.logging,
  ssl: AppConfig.database.ssl,
  extra: {
    max: AppConfig.database.pool.max,
    min: AppConfig.database.pool.min,
    acquire: AppConfig.database.pool.acquire,
    idle: AppConfig.database.pool.idle,
  },
});
```

## ישויות מסד הנתונים

### UserEntity
ישות משתמש (`users`):
```typescript
@Entity('users')
export class UserEntity extends BaseEntity {
  @Column() @Index({ unique: true })
  email: string;                 // אימייל (unique)

  @Column({ name: 'password_hash', nullable: true })
  passwordHash?: string;         // hash של סיסמה (null עבור Google OAuth)

  @Column({ name: 'google_id', nullable: true })
  googleId?: string;             // מזהה Google OAuth

  @Column({ name: 'first_name', nullable: true })
  firstName?: string;            // שם פרטי

  @Column({ name: 'last_name', nullable: true })
  lastName?: string;             // שם משפחה

  @Column('int', { default: 100 })
  credits: number = 100;         // נקודות זכות (ברירת מחדל: 100)

  @Column({ name: 'purchased_points', type: 'int', default: 0 })
  purchasedCredits: number = 0;   // קרדיטים שנרכשו

  @Column({ name: 'daily_free_questions', type: 'int', default: 20 })
  dailyFreeQuestions: number = 20; // שאלות חינמיות יומיות

  @Column({ name: 'remaining_free_questions', type: 'int', default: 20 })
  remainingFreeQuestions: number = 20; // שאלות חינמיות נותרות

  @Column({ name: 'last_free_questions_reset', type: 'date', nullable: true })
  lastFreeQuestionsReset?: Date; // תאריך איפוס אחרון

  @Column({ name: 'is_active', default: true })
  isActive: boolean = true;      // האם החשבון פעיל

  @Column({ default: UserRole.USER })
  role: UserRole = UserRole.USER; // תפקיד (user, admin, guest, premium)

  @Column('jsonb', { default: {} })
  preferences: Partial<UserPreferences> = {}; // העדפות משתמש (כולל avatar: number 1-16)

  @Column('jsonb', { default: [] })
  achievements: Achievement[];   // הישגים

  // BaseEntity fields: id, createdAt, updatedAt
}
```

**קשרים:**
- `OneToMany` → `GameHistoryEntity`
- `OneToMany` → `PointTransactionEntity`
- `OneToMany` → `PaymentHistoryEntity`
- `OneToOne` → `UserStatsEntity`
- `OneToMany` → `LeaderboardEntity`

### TriviaEntity
ישות שאלת טריוויה (`trivia`):
```typescript
@Entity('trivia')
export class TriviaEntity extends BaseEntity {
  @Column() @Index()
  topic: string = '';            // נושא השאלה

  @Column({
    type: 'enum',
    enum: DifficultyLevel,
    default: DifficultyLevel.EASY
  })
  difficulty: DifficultyLevel = DifficultyLevel.EASY; // קושי (easy, medium, hard, custom)

  @Column() @Index()
  question: string = '';         // טקסט השאלה

  @Column('jsonb', { default: [] })
  answers: TriviaAnswer[] = [];  // תשובות אפשריות (array של TriviaAnswer)

  @Column({ name: 'correct_answer_index', type: 'int' })
  correctAnswerIndex: number = 0; // אינדקס התשובה הנכונה

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null = null;  // מזהה משתמש (nullable, למשתמשים שיצרו שאלות)

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;             // קשר למשתמש (optional)

  @Column({ name: 'is_correct', type: 'boolean', default: false })
  isCorrect: boolean = false;    // האם השאלה נכונה (למעקב)

  @Column('jsonb', { nullable: true })
  metadata: TriviaQuestionDetailsMetadata = {}; // מטא-דאטה (source, explanation, tags)

  // BaseEntity fields: id, createdAt, updatedAt
}
```

**TriviaAnswer Structure:**
```typescript
interface TriviaAnswer {
  text: string;                  // טקסט התשובה
  isCorrect: boolean;            // האם התשובה נכונה
  explanation?: string;          // הסבר (אופציונלי)
  order: number;                 // סדר תשובה
}
```

### GameHistoryEntity
ישות היסטוריית משחק (`game_history`):
```typescript
@Entity('game_history')
export class GameHistoryEntity extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid' })
  @Index()
  userId!: string;               // מזהה משתמש (required, FK)

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;             // קשר למשתמש

  @Column({ type: 'varchar', default: '' })
  topic: string = '';             // נושא המשחק

  @Column({ type: 'varchar', default: '' })
  difficulty: string = '';       // קושי המשחק

  @Column('int')
  score: number = 0;             // ניקוד כולל במשחק

  @Column({ name: 'total_questions', type: 'int', default: 0 })
  totalQuestions: number = 0;    // מספר שאלות כולל

  @Column({ name: 'correct_answers', type: 'int', default: 0 })
  correctAnswers: number = 0;    // מספר תשובות נכונות

  @Column({ name: 'game_mode', type: 'varchar', default: GameMode.QUESTION_LIMITED })
  gameMode: GameMode = GameMode.QUESTION_LIMITED; // מצב משחק

  @Column({ name: 'time_spent', type: 'int', default: 0, nullable: true })
  timeSpent?: number;            // זמן שהושקע במילישניות (optional)

  @Column({ name: 'credits_used', type: 'int', default: 0 })
  creditsUsed: number = 0;       // נקודות זכות שנצרכו

  @Column({ name: 'questions_data', type: 'jsonb', default: () => "'[]'::jsonb" })
  questionsData: QuestionData[] = []; // נתוני שאלות (array של QuestionData)

  // BaseEntity fields: id, createdAt, updatedAt

  // Computed property
  get incorrectAnswers(): number {
    return Math.max(0, this.totalQuestions - this.correctAnswers);
  }
}
```

**QuestionData Structure:**
```typescript
interface QuestionData {
  question: string;              // טקסט השאלה
  questionId: string;            // מזהה השאלה
  userAnswerIndex: number;      // אינדקס התשובה שנבחרה (0-3, -1 = timeout)
  correctAnswerIndex: number;   // אינדקס התשובה הנכונה (0-3)
  isCorrect: boolean;            // האם התשובה נכונה
  timeSpent?: number;            // זמן שהושקע בשניות (optional)
}
```

### UserStatsEntity
ישות סטטיסטיקות משתמש (`user_stats`):
```typescript
@Entity('user_stats')
export class UserStatsEntity extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid' })
  @Index({ unique: true })
  userId: string = '';           // מזהה משתמש (unique, FK)

  @ManyToOne(() => UserEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;             // קשר למשתמש

  // Game Statistics
  @Column('int', { name: 'total_games', default: 0 })
  @Index()
  totalGames: number = 0;        // מספר משחקים כולל

  @Column('int', { name: 'total_questions', default: 0 })
  totalQuestions: number = 0;    // מספר שאלות כולל

  @Column('int', { name: 'correct_answers', default: 0 })
  correctAnswers: number = 0;    // מספר תשובות נכונות

  @Column('int', { name: 'incorrect_answers', default: 0 })
  incorrectAnswers: number = 0;  // מספר תשובות שגויות

  @Column('decimal', { name: 'overall_success_rate', precision: 5, scale: 2, default: 0 })
  @Index()
  overallSuccessRate: number = 0; // שיעור הצלחה כולל (0-100)

  // Streak Statistics
  @Column('int', { name: 'current_streak', default: 0 })
  currentStreak: number = 0;     // רצף נוכחי

  @Column('int', { name: 'longest_streak', default: 0 })
  longestStreak: number = 0;     // רצף ארוך ביותר

  @Column('timestamp', { name: 'last_play_date', nullable: true })
  lastPlayDate?: Date;           // תאריך משחק אחרון

  @Column('int', { name: 'consecutive_days_played', default: 0 })
  consecutiveDaysPlayed: number = 0; // ימים רצופים ששיחק

  // Topic Statistics (JSONB)
  @Column('jsonb', { name: 'topic_stats', default: {} })
  topicStats: Record<string, {
    totalQuestions: number;
    correctAnswers: number;
    successRate: number;
    score: number;
    lastPlayed: Date;
  }> = {};                       // סטטיסטיקות לפי נושא

  // Difficulty Statistics (JSONB)
  @Column('jsonb', { name: 'difficulty_stats', default: {} })
  difficultyStats: Record<string, {
    totalQuestions: number;
    correctAnswers: number;
    successRate: number;
    score: number;
    lastPlayed: Date;
  }> = {};                       // סטטיסטיקות לפי קושי

  // Time-based Statistics
  @Column('int', { name: 'weekly_score', default: 0 })
  @Index()
  weeklyScore: number = 0;       // ניקוד שבועי

  @Column('int', { name: 'monthly_score', default: 0 })
  @Index()
  monthlyScore: number = 0;      // ניקוד חודשי

  @Column('int', { name: 'yearly_score', default: 0 })
  @Index()
  yearlyScore: number = 0;       // ניקוד שנתי

  @Column('timestamp', { name: 'last_weekly_reset', nullable: true })
  lastWeeklyReset?: Date;        // תאריך איפוס שבועי אחרון

  @Column('timestamp', { name: 'last_monthly_reset', nullable: true })
  lastMonthlyReset?: Date;       // תאריך איפוס חודשי אחרון

  @Column('timestamp', { name: 'last_yearly_reset', nullable: true })
  lastYearlyReset?: Date;        // תאריך איפוס שנתי אחרון

  // BaseEntity fields: id, createdAt, updatedAt
}
```

### PaymentHistoryEntity
ישות היסטוריית תשלום (`payment_history`):
```typescript
@Entity('payment_history')
export class PaymentHistoryEntity extends BaseEntity {
  @Column({ name: 'user_id' })
  @Index()
  userId!: string;               // מזהה משתמש (required, FK)

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;             // קשר למשתמש

  @Column({ name: 'payment_id', type: 'varchar' })
  paymentId!: string;            // מזהה תשלום (Stripe payment intent ID)

  @Column({ name: 'amount', type: 'int' })
  amount: number = 0;            // סכום בסנטים

  @Column({ default: 'USD' })
  currency: string = 'USD';      // מטבע

  @Column({ name: 'status', type: 'varchar', default: PaymentStatus.PENDING })
  status: PaymentStatus = PaymentStatus.PENDING; // סטטוס תשלום

  @Column({ name: 'payment_method', type: 'varchar', nullable: true })
  paymentMethod?: PaymentMethod; // שיטת תשלום (STRIPE, PAYPAL, MANUAL_CREDIT)

  @Column({ nullable: true })
  description?: string;          // תיאור התשלום

  @Column('jsonb', { name: 'metadata', default: () => "'{}'::jsonb" })
  metadata: PaymentHistoryMetadata = {}; // מטא-דאטה

  // Getters/Setters for metadata fields:
  // completedAt, failedAt, originalAmount, originalCurrency

  // BaseEntity fields: id, createdAt, updatedAt
}
```

**PaymentHistoryMetadata Structure:**
```typescript
interface PaymentHistoryMetadata extends PaymentMetadata {
  completedAt?: string;          // תאריך השלמה
  failedAt?: string;             // תאריך כישלון
  originalAmount?: number;       // סכום מקורי
  originalCurrency?: string;     // מטבע מקורי
}
```

### CreditTransactionEntity
ישות עסקת נקודות (`point_transactions`):
```typescript
@Entity('point_transactions')
export class PointTransactionEntity extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid' })
  @Index()
  userId: string;                // מזהה משתמש (required, FK)

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;              // קשר למשתמש

  @Column({
    type: 'enum',
    enum: PointTransactionType
  })
  type: PointTransactionType;    // סוג עסקה (DAILY_RESET, PURCHASE, GAME_USAGE, ADMIN_ADJUSTMENT, REFUND)

  @Column({
    type: 'enum',
    enum: PointSource,
    nullable: true
  })
  source?: PointSource;          // מקור (FREE_DAILY, PURCHASED, BONUS, REFUND)

  @Column('int')
  amount: number;                // סכום נקודות (חיובי ל-credit, שלילי ל-debit)

  @Column({ name: 'balance_after', type: 'int' })
  balanceAfter: number;          // מאזן כולל אחרי עסקה

  @Column({ name: 'free_questions_after', type: 'int', default: 0 })
  freeQuestionsAfter: number = 0; // שאלות חינמיות נותרות אחרי עסקה

  @Column({ name: 'purchased_points_after', type: 'int', default: 0 })
  purchasedCreditsAfter: number = 0; // קרדיטים שנרכשו נותרות אחרי עסקה

  @Column({ nullable: true })
  description?: string;          // תיאור העסקה

  @Column({ name: 'game_history_id', nullable: true })
  gameHistoryId?: string;        // מזהה היסטוריית משחק (אם רלוונטי)

  @Column({ name: 'payment_id', nullable: true })
  paymentId?: string;            // מזהה תשלום (אם רלוונטי)

  @Column('jsonb', { default: {} })
  metadata: {
    difficulty?: string;
    topic?: string;
    requestedQuestions?: number;
    pricePerCredit?: number;
    originalAmount?: number;
    gameMode?: string;
    freeQuestionsUsed?: number;
    purchasedCreditsUsed?: number;
    creditsUsed?: number;
    reason?: string | null;
  } = {};                        // מטא-דאטה

  @Index()
  @Column({ name: 'transaction_date', type: 'date', default: () => 'CURRENT_DATE' })
  transactionDate: Date;         // תאריך עסקה

  // BaseEntity fields: id, createdAt, updatedAt
}
```

### LeaderboardEntity
ישות לוח תוצאות (`leaderboard`):
```typescript
@Entity('leaderboard')
export class LeaderboardEntity extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid' })
  @Index({ unique: true })
  userId: string = '';           // מזהה משתמש (unique, FK)

  @ManyToOne(() => UserEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;             // קשר למשתמש

  @Column({ name: 'user_stats_id', type: 'uuid' })
  @Index()
  userStatsId: string = '';      // מזהה סטטיסטיקות משתמש (FK)

  @ManyToOne(() => UserStatsEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_stats_id' })
  userStats!: UserStatsEntity;   // קשר לסטטיסטיקות משתמש

  // Ranking-specific data
  @Column('int')
  @Index()
  rank: number = 0;              // דירוג נוכחי

  @Column('int')
  @Index()
  percentile: number = 0;        // אחוזון (0-100)

  @Column('int')
  @Index()
  score: number = 0;             // ניקוד כולל לדירוג

  @Column('int', { name: 'total_users' })
  totalUsers: number = 0;        // מספר משתמשים כולל בדירוג

  // Ranking metadata
  @Column('timestamp', { name: 'last_rank_update', nullable: true })
  lastRankUpdate?: Date;         // תאריך עדכון דירוג אחרון

  // BaseEntity fields: id, createdAt, updatedAt
}
```

**קשרים:**
- `ManyToOne` → `UserEntity` (cascade delete)
- `ManyToOne` → `UserStatsEntity` (cascade delete)

## מיגרציות

### יצירת מיגרציה

```bash
# יצירת מיגרציה חדשה
cd server
pnpm run migration:generate -- -n CreateInitialTables

# הרצת מיגרציות
pnpm run migration:run

# ביטול מיגרציה אחרונה
pnpm run migration:revert

# הצגת מיגרציות
pnpm run migration:show
```

## קונפיגורציית Redis

### Redis Service

המערכת משתמשת ב-Redis למטמון ול-session management:
- מטמון שאלות טריוויה
- מטמון מאזן נקודות
- מטמון לוח תוצאות
- Session storage
- Rate limiting

**CacheService Methods:**
```typescript
import { CacheService } from '@internal/modules';

// Set value
await cacheService.set('key', value, 3600);

// Get value
const result = await cacheService.get<T>('key', validator);

// Get or Set (cache-aside pattern)
const value = await cacheService.getOrSet<T>(
  'key',
  async () => fetchData(),
  3600,
  validator
);

// Delete
await cacheService.delete('key');

// Increment
const newValue = await cacheService.increment('counter', 1);
```

**זמני Cache:**
```typescript
import { CACHE_DURATION } from '@shared/constants';

CACHE_DURATION.SHORT      // 300 seconds (5 minutes)
CACHE_DURATION.MEDIUM     // 1800 seconds (30 minutes)
CACHE_DURATION.LONG       // 3600 seconds (1 hour)
CACHE_DURATION.VERY_LONG  // 86400 seconds (24 hours)
CACHE_DURATION.EXTENDED   // 900 seconds (15 minutes)
```

**Cache Keys (עם prefix `everytriv_cache_`):**
- `everytriv_cache_trivia:{topic}:{difficulty}` - שאלות טריוויה
- `everytriv_cache_points:balance:{userId}` - מאזן נקודות
- `everytriv_cache_leaderboard:global` - לוח תוצאות גלובלי
- `everytriv_cache_user_session:{userId}` - Session משתמש
- `everytriv_cache_credits:packages:all` - חבילות קרדיטים

**Cache Decorator:**
```typescript
import { Cache, NoCache } from '@common';

@Get('profile')
@Cache(CACHE_DURATION.MEDIUM)
async getProfile() {
  // Response will be cached for 30 minutes
}

@Post('update')
@NoCache()
async updateProfile() {
  // Response will not be cached
}
```

**StorageService (Persistent Storage):**
```typescript
import { ServerStorageService } from '@internal/modules';

// אחסון מתמיד
await storageService.set('session:user:123', sessionData, 86400);

// קריאה
const result = await storageService.get('session:user:123');
```

**שימוש:**
- **CacheService** - למטמון זמני (TTL קצר)
- **StorageService** - לאחסון מתמיד (session data, preferences)

## אינדקסים מומלצים

```sql
-- אינדקסים למשתמשים
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY idx_users_username ON users(username);
CREATE INDEX CONCURRENTLY idx_users_created_at ON users(created_at);

-- אינדקסים לשאלות טריוויה
CREATE INDEX CONCURRENTLY idx_trivia_topic_difficulty ON trivia(topic, difficulty);
CREATE INDEX CONCURRENTLY idx_trivia_created_at ON trivia(created_at);

-- אינדקסים להיסטוריית משחקים
CREATE INDEX CONCURRENTLY idx_game_history_user_created ON game_history(user_id, created_at);
CREATE INDEX CONCURRENTLY idx_game_history_topic_difficulty ON game_history(topic, difficulty);
CREATE INDEX CONCURRENTLY idx_game_history_score ON game_history(score DESC);
```

## גיבוי ושחזור

### גיבוי מסד נתונים

```bash
# גיבוי מלא
docker exec everytriv-postgres pg_dump -U everytriv_user -d everytriv | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

### שחזור מסד נתונים

```bash
# שחזור מגיבוי
gunzip -c backup.sql.gz | docker exec -i everytriv-postgres psql -U everytriv_user -d everytriv
```

## ביצועים ואופטימיזציה

### הגדרות PostgreSQL

```sql
-- הגדרות ביצועים
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;

-- הפעלה מחדש
SELECT pg_reload_conf();
```

### הגדרות Redis

```bash
# redis.conf
maxmemory 256mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
appendonly yes
appendfsync everysec
```

## פתרון בעיות

### שגיאות נפוצות

#### Connection Refused
```bash
# בדיקת סטטוס PostgreSQL
docker-compose ps postgres

# בדיקת לוגים
docker-compose logs postgres
```

#### Authentication Failed
```sql
-- בדיקת משתמשים
SELECT usename, usesysid FROM pg_user;

-- יצירת משתמש מחדש
CREATE USER everytriv_user WITH PASSWORD 'test123';

-- הרשאות
GRANT ALL PRIVILEGES ON DATABASE everytriv TO everytriv_user;
```

#### Database Does Not Exist
```sql
-- יצירת מסד נתונים
CREATE DATABASE everytriv OWNER everytriv_user;
```

## הפניות

- [ארכיטקטורה כללית](../ARCHITECTURE.md)
- [דיאגרמות](../DIAGRAMS.md)
- [מבנה Backend](../backend/internal/README.md)
