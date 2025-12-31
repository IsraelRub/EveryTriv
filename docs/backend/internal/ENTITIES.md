# Entities - Internal Structure

תיעוד מפורט על כל ה-TypeORM Entities במערכת, כולל BaseEntity ו-9 entities נוספים.

## סקירה כללית

Entities ב-NestJS משמשות לייצוג טבלאות במסד נתונים באמצעות TypeORM.

**מיקום:** `server/src/internal/entities/`

**Entities:**
- `base.entity.ts` - בסיס משותף לכל ה-entities
- `user.entity.ts` - ישות משתמש
- `trivia.entity.ts` - ישות שאלת טריוויה
- `gameHistory.entity.ts` - ישות היסטוריית משחק
- `userStats.entity.ts` - ישות סטטיסטיקות משתמש
- `pointTransaction.entity.ts` - ישות עסקת נקודות
- `paymentHistory.entity.ts` - ישות היסטוריית תשלום
- `subscription.entity.ts` - ישות מנוי
- `leaderboard.entity.ts` - ישות לוח תוצאות

## BaseEntity

**מיקום:** `server/src/internal/entities/base.entity.ts`

**תפקיד:**
- בסיס משותף לכל ה-entities
- מספק שדות משותפים: `id`, `createdAt`, `updatedAt`
- מימוש `BaseEntity` מ-`@shared/types`

### שדות

```typescript
abstract class BaseEntity implements BaseEntityContract {
  @PrimaryGeneratedColumn('uuid')
  id!: string;              // UUID primary key

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;         // תאריך יצירה אוטומטי

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;         // תאריך עדכון אוטומטי
}
```

### שימוש

```typescript
@Entity('users')
export class UserEntity extends BaseEntity {
  // כל ה-entities יורשים מ-BaseEntity
  // ומקבלים id, createdAt, updatedAt אוטומטית
}
```

## UserEntity

**מיקום:** `server/src/internal/entities/user.entity.ts`

**תפקיד:**
- ייצוג משתמש במערכת
- שמירת פרטי משתמש, נקודות, העדפות, והישגים

### שדות

**פרטי משתמש:**
- `email` (string, unique, indexed) - אימייל
- `passwordHash` (string, nullable) - hash סיסמה (למשתמשים עם סיסמה)
- `googleId` (string, nullable) - מזהה Google (למשתמשי OAuth)

**פרטים אישיים:**
- `firstName` (string, nullable) - שם פרטי
- `lastName` (string, nullable) - שם משפחה

**נקודות ואשראי:**
- `credits` (int, default: 100) - אשראי למשחקים
- `purchasedCredits` (int, default: 0) - קרדיטים שנרכשו
- `dailyFreeQuestions` (int, default: 20) - שאלות חינם יומיות
- `remainingFreeQuestions` (int, default: 20) - שאלות חינם נותרות
- `lastFreeQuestionsReset` (date, nullable) - תאריך איפוס אחרון

**הרשאות וסטטוס:**
- `isActive` (boolean, default: true) - האם משתמש פעיל
- `role` (UserRole enum, default: USER) - תפקיד משתמש (USER, ADMIN)

**העדפות והישגים:**
- `preferences` (jsonb, default: {}) - העדפות משתמש (UserPreferences, כולל avatar: number 1-16)
- `currentSubscriptionId` (string, nullable) - מזהה מנוי נוכחי
- `achievements` (jsonb, default: []) - הישגים (Achievement[])

### אינדקסים

- `email` - unique index

### קשרים

- אין קשרים ישירים (אבל entities אחרים קשורים ל-UserEntity)

### דוגמאות שימוש

```typescript
// יצירת משתמש חדש
const user = new UserEntity();
user.email = 'john@example.com';
user.passwordHash = hashedPassword;
user.credits = 100;
user.dailyFreeQuestions = 20;
user.remainingFreeQuestions = 20;

// עדכון נקודות
user.purchasedCredits += 100;
user.credits += 50;

// עדכון העדפות
user.preferences = {
  language: 'he',
  theme: 'dark',
  notifications: true,
};
```

## TriviaEntity

**מיקום:** `server/src/internal/entities/trivia.entity.ts`

**תפקיד:**
- ייצוג שאלת טריוויה במערכת
- שמירת שאלות, תשובות, וקושי

### שדות

**פרטי שאלה:**
- `topic` (string, indexed) - נושא השאלה
- `difficulty` (DifficultyLevel enum, default: EASY) - רמת קושי
- `question` (string, indexed) - טקסט השאלה
- `answers` (jsonb, default: []) - תשובות אפשריות (TriviaAnswer[])
- `correctAnswerIndex` (int) - אינדקס התשובה הנכונה

**משתמש:**
- `userId` (uuid, nullable) - מזהה משתמש שיצר השאלה (null = מערכת)
- `user` (ManyToOne → UserEntity, nullable) - קשר למשתמש

**מטא-דאטה:**
- `isCorrect` (boolean, default: false) - האם השאלה נכונה (לשאלות משתמש)
- `metadata` (jsonb, nullable) - מטא-דאטה נוספת (TriviaQuestionDetailsMetadata)

### אינדקסים

- `topic` - index
- `question` - index

### קשרים

- `user` (ManyToOne) → `UserEntity` (nullable) - משתמש שיצר השאלה

### דוגמאות שימוש

```typescript
// יצירת שאלת טריוויה חדשה
const trivia = new TriviaEntity();
trivia.topic = 'Science';
trivia.difficulty = DifficultyLevel.MEDIUM;
trivia.question = 'What is the capital of France?';
trivia.answers = [
  { text: 'Paris', isCorrect: true },
  { text: 'London', isCorrect: false },
  { text: 'Berlin', isCorrect: false },
  { text: 'Madrid', isCorrect: false },
];
trivia.correctAnswerIndex = 0;
trivia.userId = userId; // או null למערכת
```

## GameHistoryEntity

**מיקום:** `server/src/internal/entities/gameHistory.entity.ts`

**תפקיד:**
- ייצוג היסטוריית משחק
- שמירת פרטי משחק, ניקוד, ושאלות

### שדות

**קשר למשתמש:**
- `userId` (uuid, indexed) - מזהה משתמש
- `user` (ManyToOne → UserEntity, CASCADE delete) - קשר למשתמש

**פרטי משחק:**
- `topic` (varchar, default: '') - נושא המשחק
- `difficulty` (varchar, default: '') - קושי המשחק
- `score` (int) - ניקוד המשחק
- `totalQuestions` (int, default: 0) - מספר שאלות כולל
- `correctAnswers` (int, default: 0) - תשובות נכונות
- `gameMode` (varchar, default: QUESTION_LIMITED) - מצב משחק (GameMode)
- `timeSpent` (int, nullable) - זמן שהושקע (שניות)
- `creditsUsed` (int, default: 0) - אשראי שנצרך

**נתוני שאלות:**
- `questionsData` (jsonb, default: []) - נתוני שאלות (QuestionData[])

**Computed Properties:**
- `incorrectAnswers` (getter) - תשובות שגויות = `totalQuestions - correctAnswers`

### אינדקסים

- `userId` - index

### קשרים

- `user` (ManyToOne) → `UserEntity` (CASCADE delete) - משתמש בעל ההיסטוריה

### דוגמאות שימוש

```typescript
// יצירת היסטוריית משחק חדשה
const gameHistory = new GameHistoryEntity();
gameHistory.userId = userId;
gameHistory.topic = 'Science';
gameHistory.difficulty = 'medium';
gameHistory.score = 850;
gameHistory.totalQuestions = 10;
gameHistory.correctAnswers = 8;
gameHistory.gameMode = GameMode.QUESTION_LIMITED;
gameHistory.timeSpent = 300; // 5 דקות
gameHistory.creditsUsed = 10;
gameHistory.questionsData = [
  { questionId: '...', answer: '...', isCorrect: true, timeSpent: 30 },
  // ...
];

// גישה ל-incorrectAnswers
console.log(gameHistory.incorrectAnswers); // 2
```

## UserStatsEntity

**מיקום:** `server/src/internal/entities/userStats.entity.ts`

**תפקיד:**
- ייצוג סטטיסטיקות משתמש
- שמירת נתונים מצטברים על ביצועי משתמש

### שדות

**קשר למשתמש:**
- `userId` (uuid, unique, indexed) - מזהה משתמש (ייחודי)
- `user` (ManyToOne → UserEntity, CASCADE delete) - קשר למשתמש

**סטטיסטיקות כללי משחק:**
- `totalGames` (int, default: 0, indexed) - משחקים כולל
- `totalQuestions` (int, default: 0) - שאלות כולל
- `correctAnswers` (int, default: 0) - תשובות נכונות
- `incorrectAnswers` (int, default: 0) - תשובות שגויות
- `overallSuccessRate` (decimal, default: 0, indexed) - אחוז הצלחה כללי

**רצפים:**
- `currentStreak` (int, default: 0) - רצף נוכחי
- `longestStreak` (int, default: 0) - רצף ארוך ביותר
- `lastPlayDate` (timestamp, nullable) - תאריך משחק אחרון
- `consecutiveDaysPlayed` (int, default: 0) - ימים רצופים

**סטטיסטיקות לפי נושא:**
- `topicStats` (jsonb, default: {}) - סטטיסטיקות לפי נושא:
  ```typescript
  {
    [topic: string]: {
      totalQuestions: number;
      correctAnswers: number;
      successRate: number;
      score: number;
      lastPlayed: Date;
    }
  }
  ```

**סטטיסטיקות לפי קושי:**
- `difficultyStats` (jsonb, default: {}) - סטטיסטיקות לפי קושי:
  ```typescript
  {
    [difficulty: string]: {
      totalQuestions: number;
      correctAnswers: number;
      successRate: number;
      score: number;
      lastPlayed: Date;
    }
  }
  ```

**ניקוד:**
- `totalScore` (int, default: 0, indexed) - ניקוד כולל
- `averageScore` (decimal, default: 0) - ניקוד ממוצע
- `bestScore` (int, default: 0, indexed) - ניקוד גבוה ביותר

### אינדקסים

- `userId` - unique index
- `totalGames` - index
- `overallSuccessRate` - index
- `totalScore` - index
- `bestScore` - index

### קשרים

- `user` (ManyToOne) → `UserEntity` (CASCADE delete) - משתמש בעל הסטטיסטיקות

### דוגמאות שימוש

```typescript
// יצירת סטטיסטיקות משתמש חדשות
const userStats = new UserStatsEntity();
userStats.userId = userId;
userStats.totalGames = 0;
userStats.totalQuestions = 0;
userStats.correctAnswers = 0;
userStats.overallSuccessRate = 0;
userStats.currentStreak = 0;
userStats.longestStreak = 0;

// עדכון סטטיסטיקות לאחר משחק
userStats.totalGames += 1;
userStats.totalQuestions += 10;
userStats.correctAnswers += 8;
userStats.overallSuccessRate = (userStats.correctAnswers / userStats.totalQuestions) * 100;
userStats.currentStreak += 1;
if (userStats.currentStreak > userStats.longestStreak) {
  userStats.longestStreak = userStats.currentStreak;
}

// עדכון סטטיסטיקות לפי נושא
userStats.topicStats = {
  ...userStats.topicStats,
  Science: {
    totalQuestions: 50,
    correctAnswers: 40,
    successRate: 80,
    score: 4000,
    lastPlayed: new Date(),
  },
};
```

## PointTransactionEntity

**מיקום:** `server/src/internal/entities/pointTransaction.entity.ts`

**תפקיד:**
- ייצוג עסקת נקודות
- שמירת היסטוריית עסקות נקודות (רכישה, שימוש, וכו')

### שדות

**קשר למשתמש:**
- `userId` (uuid, indexed) - מזהה משתמש
- `user` (ManyToOne → UserEntity) - קשר למשתמש

**פרטי עסקה:**
- `type` (PointTransactionType enum) - סוג עסקה (CREDIT, DEBIT, PURCHASE, USAGE, REFUND, EXPIRY)
- `source` (PointSource enum, nullable) - מקור נקודות (GAME, PURCHASE, BONUS, REFUND)
- `amount` (int) - סכום נקודות (חיובי = credit, שלילי = debit)
- `balanceAfter` (int) - מאזן אחרי העסקה
- `freeQuestionsAfter` (int, default: 0) - שאלות חינם נותרות אחרי העסקה
- `purchasedCreditsAfter` (int, default: 0) - קרדיטים נרכשים נותרות אחרי העסקה

**מטא-דאטה:**
- `description` (string, nullable) - תיאור העסקה
- `gameHistoryId` (string, nullable) - מזהה היסטוריית משחק (אם רלוונטי)
- `paymentId` (string, nullable) - מזהה תשלום (אם רלוונטי)
- `transactionDate` (date, default: CURRENT_DATE, indexed) - תאריך עסקה

**metadata (jsonb, default: {}):**
- `difficulty` (string) - קושי (אם רלוונטי)
- `topic` (string) - נושא (אם רלוונטי)
- `requestedQuestions` (number) - מספר שאלות מבוקשות (אם רלוונטי)
- `pricePerPoint` (number) - מחיר לנקודה (אם רלוונטי)
- `originalAmount` (number) - סכום מקורי (אם רלוונטי)
- `gameMode` (string) - מצב משחק (אם רלוונטי)
- `freeQuestionsUsed` (number) - שאלות חינם שנצרכו
- `purchasedCreditsUsed` (number) - קרדיטים נרכשים שנצרכו
- `creditsUsed` (number) - אשראי שנצרך
- `reason` (string | null) - סיבת העסקה

### אינדקסים

- `userId` - index
- `transactionDate` - index

### קשרים

- `user` (ManyToOne) → `UserEntity` - משתמש בעל העסקה

### דוגמאות שימוש

```typescript
// יצירת עסקת credit (רכישת נקודות)
const transaction = new PointTransactionEntity();
transaction.userId = userId;
transaction.type = PointTransactionType.PURCHASE;
transaction.source = PointSource.PURCHASE;
transaction.amount = 100;
transaction.balanceAfter = user.purchasedCredits + 100;
transaction.description = 'Purchased 100 credits';
transaction.paymentId = paymentId;
transaction.metadata = {
  pricePerCredit: 0.1,
  originalAmount: 10,
};

// יצירת עסקת debit (שימוש בנקודות)
const usageTransaction = new PointTransactionEntity();
usageTransaction.userId = userId;
usageTransaction.type = PointTransactionType.USAGE;
usageTransaction.amount = -10; // שלילי = debit
usageTransaction.balanceAfter = user.purchasedCredits - 10;
usageTransaction.gameHistoryId = gameHistoryId;
usageTransaction.metadata = {
  difficulty: 'medium',
  topic: 'Science',
  requestedQuestions: 10,
  gameMode: 'QUESTION_LIMITED',
  purchasedCreditsUsed: 10,
};
```

## PaymentHistoryEntity

**מיקום:** `server/src/internal/entities/paymentHistory.entity.ts`

**תפקיד:**
- ייצוג היסטוריית תשלום
- שמירת פרטי תשלומים, מנויים, וסטטוסים

### שדות

**קשר למשתמש:**
- `userId` (string, indexed) - מזהה משתמש
- `user` (ManyToOne → UserEntity, CASCADE delete) - קשר למשתמש

**פרטי תשלום:**
- `paymentId` (string, private) - מזהה תשלום (גם `transactionId` via getter/setter)
- `amount` (int, default: 0) - סכום תשלום
- `currency` (string, default: 'USD') - מטבע
- `status` (PaymentStatus enum, default: PENDING, private) - סטטוס תשלום
- `paymentMethod` (PaymentMethod enum, nullable, private) - שיטת תשלום

**מטא-דאטה:**
- `description` (string, nullable) - תיאור תשלום
- `metadata` (jsonb, default: {}, private) - מטא-דאטה נוספת (PaymentHistoryMetadata)

**Computed Properties (מטא-דאטה):**
- `completedAt` (Date | undefined, getter/setter) - תאריך השלמה
- `failedAt` (Date | undefined, getter/setter) - תאריך כשלון
- `subscriptionId` (string | undefined, getter/setter) - מזהה מנוי
- `originalAmount` (number | undefined, getter/setter) - סכום מקורי
- `originalCurrency` (string | undefined, getter/setter) - מטבע מקורי

### אינדקסים

- `userId` - index

### קשרים

- `user` (ManyToOne) → `UserEntity` (CASCADE delete) - משתמש בעל התשלום

### דוגמאות שימוש

```typescript
// יצירת היסטוריית תשלום חדשה
const payment = new PaymentHistoryEntity();
payment.userId = userId;
payment.paymentId = 'pay_123456';
payment.amount = 1000; // $10.00 (בסנטים)
payment.currency = 'USD';
payment.status = PaymentStatus.PENDING;
payment.paymentMethod = PaymentMethod.MANUAL_CREDIT;
payment.description = 'Subscription payment';

// עדכון סטטוס לאחר אישור
payment.status = PaymentStatus.COMPLETED;
payment.completedAt = new Date();
payment.subscriptionId = subscriptionId;

// עדכון מטא-דאטה
payment.originalAmount = 10.00;
payment.originalCurrency = 'USD';
```

## SubscriptionEntity

**מיקום:** `server/src/internal/entities/subscription.entity.ts`

**תפקיד:**
- ייצוג מנוי
- שמירת פרטי מנוי, תוכנית, ותקופות

### שדות

**קשר למשתמש:**
- `userId` (string, indexed) - מזהה משתמש
- `user` (ManyToOne → UserEntity, CASCADE delete) - קשר למשתמש

**פרטי מנוי:**
- `subscriptionExternalId` (varchar, default: '') - מזהה מנוי חיצוני (מ-PayPal/Stripe)
- `planId` (varchar) - מזהה תוכנית
- `status` (SubscriptionStatus enum, default: PENDING, private) - סטטוס מנוי

**תקופות:**
- `periodStart` (timestamp, nullable, private) - תחילת תקופה
- `periodEnd` (timestamp, nullable, private) - סיום תקופה
- `cancelAtPeriodEnd` (boolean, default: false) - ביטול בסיום תקופה

**מטא-דאטה:**
- `metadata` (jsonb, default: {}, private) - מטא-דאטה נוספת (SubscriptionMetadata)

**Computed Properties:**
- Getters/Setters ל-status, periodStart, periodEnd, metadata, וכו'

### אינדקסים

- `userId` - index

### קשרים

- `user` (ManyToOne) → `UserEntity` (CASCADE delete) - משתמש בעל המנוי

### דוגמאות שימוש

```typescript
// יצירת מנוי חדש
const subscription = new SubscriptionEntity();
subscription.userId = userId;
subscription.subscriptionExternalId = 'sub_123456';
subscription.planId = 'premium';
subscription.status = SubscriptionStatus.ACTIVE;
subscription.periodStart = new Date();
subscription.periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 ימים

// ביטול מנוי בסיום תקופה
subscription.cancelAtPeriodEnd = true;
subscription.status = SubscriptionStatus.CANCELED;
```

## LeaderboardEntity

**מיקום:** `server/src/internal/entities/leaderboard.entity.ts`

**תפקיד:**
- ייצוג דירוג בלוח תוצאות
- שמירת מידע דירוג ספציפי (rank, percentile, וכו')

### שדות

**קשרים:**
- `userId` (uuid, unique, indexed) - מזהה משתמש (ייחודי)
- `user` (ManyToOne → UserEntity, CASCADE delete) - קשר למשתמש
- `userStatsId` (uuid, indexed) - מזהה סטטיסטיקות משתמש
- `userStats` (ManyToOne → UserStatsEntity, CASCADE delete) - קשר לסטטיסטיקות

**דירוג:**
- `rank` (int, indexed) - דירוג בלוח תוצאות
- `percentile` (int, indexed) - אחוזון
- `score` (int, indexed) - ניקוד בדירוג
- `totalUsers` (int) - מספר משתמשים כולל

**מטא-דאטה:**
- `lastRankUpdate` (timestamp, nullable) - תאריך עדכון דירוג אחרון

### אינדקסים

- `userId` - unique index
- `userStatsId` - index
- `rank` - index
- `percentile` - index
- `score` - index

### קשרים

- `user` (ManyToOne) → `UserEntity` (CASCADE delete) - משתמש בדירוג
- `userStats` (ManyToOne) → `UserStatsEntity` (CASCADE delete) - סטטיסטיקות משתמש

### דוגמאות שימוש

```typescript
// יצירת דירוג בלוח תוצאות
const leaderboard = new LeaderboardEntity();
leaderboard.userId = userId;
leaderboard.userStatsId = userStatsId;
leaderboard.rank = 5;
leaderboard.percentile = 95; // משתמש ב-5% העליונים
leaderboard.score = 5000;
leaderboard.totalUsers = 1000;
leaderboard.lastRankUpdate = new Date();

// עדכון דירוג
leaderboard.rank = 3; // עלייה בדירוג
leaderboard.percentile = 97;
leaderboard.lastRankUpdate = new Date();
```

## Best Practices

### 1. שימוש ב-BaseEntity

```typescript
// ✅ טוב - יורש מ-BaseEntity
@Entity('custom')
export class CustomEntity extends BaseEntity {
  // מקבל id, createdAt, updatedAt אוטומטית
}

// ❌ רע - לא יורש מ-BaseEntity
@Entity('custom')
export class CustomEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string; // כפילות
}
```

### 2. שימוש ב-Indexes

```typescript
// ✅ טוב - indexes על שדות שמושאלים לעיתים קרובות
@Column()
@Index()
topic: string;

// ✅ טוב - unique index על שדה ייחודי
@Column()
@Index({ unique: true })
email: string;
```

### 3. CASCADE Delete

```typescript
// ✅ טוב - CASCADE delete כאשר יש תלות
@ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
user: UserEntity;

// ✅ טוב - לא CASCADE כאשר אין תלות חזקה
@ManyToOne(() => UserEntity)
user: UserEntity;
```

### 4. JSONB למטא-דאטה דינמית

```typescript
// ✅ טוב - JSONB למטא-דאטה גמישה
@Column('jsonb', { default: {} })
metadata: Record<string, unknown>;

// ❌ רע - שדות רבים עבור מטא-דאטה
@Column()
metadata1: string;
@Column()
metadata2: string;
// ...
```

## הפניות

- [BaseEntity](./ENTITIES.md#baseentity) - בסיס משותף
- [Modules](./MODULES.md) - מודולים שמשתמשים ב-entities
- [Request-Response Cycle](../REQUEST_RESPONSE_CYCLE.md) - זרימת בקשות
- [Internal Structure](./README.md) - סקירה כללית
