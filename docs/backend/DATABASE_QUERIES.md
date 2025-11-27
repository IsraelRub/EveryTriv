# דפוסי שאילתות ומסד נתונים - Backend

תיעוד מפורט על דפוסי השאילתות, Query Helpers, ואינדקסים במסד הנתונים.

## סקירה כללית

המערכת משתמשת ב-TypeORM לניהול מסד הנתונים, עם Query Builder לשאילתות מורכבות ו-Repository methods לשאילתות פשוטות.

## Query Helpers

המערכת כוללת helper functions לשאילתות חוזרות ב-`server/src/common/queries/`:

### Date Range Queries

**מיקום:** `server/src/common/queries/date-range.query.ts`

Helper functions לשאילתות לפי טווח תאריכים:

```typescript
// Add date range conditions to existing query builder
addDateRangeConditions<T>(
  queryBuilder: SelectQueryBuilder<T>,
  alias: string,
  dateField: string = 'createdAt',
  startDate?: Date | string,
  endDate?: Date | string
): SelectQueryBuilder<T>

// Create new query builder with date range
createDateRangeQuery<T>(
  repository: Repository<T>,
  alias: string,
  dateField: string = 'createdAt',
  startDate?: Date | string,
  endDate?: Date | string
): SelectQueryBuilder<T>
```

**דוגמת שימוש:**
```typescript
const { addDateRangeConditions } = require('../../common/queries');
const queryBuilder = this.gameHistoryRepo.createQueryBuilder('game');
addDateRangeConditions(queryBuilder, 'game', 'createdAt', startDate, endDate);
```

**משמש ב:**
- `analytics.service.ts` - `createFilteredGameHistoryQuery()`
- שאילתות analytics לפי טווח תאריכים

### Search Queries (ILIKE)

**מיקום:** `server/src/common/queries/search.query.ts`

Helper functions לחיפוש טקסט עם ILIKE:

```typescript
// Add ILIKE search conditions to existing query builder
addSearchConditions<T>(
  queryBuilder: SelectQueryBuilder<T>,
  alias: string,
  searchFields: string[],
  searchTerm: string,
  options?: {
    normalizeTerm?: (term: string) => string;
    wildcardPattern?: 'both' | 'start' | 'end' | 'none';
  }
): SelectQueryBuilder<T>

// Create new query builder with search conditions
createSearchQuery<T>(
  repository: Repository<T>,
  alias: string,
  searchFields: string[],
  searchTerm: string,
  options?: {...}
): SelectQueryBuilder<T>
```

**דוגמת שימוש:**
```typescript
const { addSearchConditions } = require('../../common/queries');
const queryBuilder = this.userRepository.createQueryBuilder('user');
addSearchConditions(queryBuilder, 'user', ['username', 'firstName', 'lastName'], searchTerm, {
  wildcardPattern: 'both',
});
```

**משמש ב:**
- `user.service.ts` - `searchUsers()`

### Random Queries

שאילתות אקראיות (RANDOM) ממומשות כיום ישירות ב-services, ללא helper ייעודי:

```typescript
const queryBuilder = this.triviaRepository
  .createQueryBuilder('trivia')
  .where('trivia.topic = :topic', { topic })
  .andWhere('trivia.difficulty = :difficulty', { difficulty })
  .orderBy('RANDOM()')
  .limit(count);
```

**משמש ב:**
- `triviaGeneration.service.ts` - `getRandomQuestions()`

### GROUP BY Queries

**מיקום:** `server/src/common/queries/group-by.query.ts`

Helper functions לשאילתות GROUP BY ברמת ה-DB (לנתונים גדולים ואנליטיקות):

```typescript
// Create new query builder with GROUP BY + COUNT
createGroupByQuery<T>(
  repository: Repository<T>,
  alias: string,
  groupByField: string,
  countFieldAlias: string = 'count',
  whereConditions?: Record<string, unknown>
): SelectQueryBuilder<T>
```

**כלל שימוש:**  
- לסטטיסטיקות / Aggregations על טבלאות גדולות (כמו `game_history`) – להשתמש ב-`createGroupByQuery`.  
- לחישוב על מערכים שכבר נטענו לזיכרון – להשתמש ב-`groupBy` מתוך `shared/utils/core/data.utils.ts`.

**דוגמת שימוש (אנליטיקות):**
```typescript
import { createGroupByQuery } from '../../common/queries';

const queryBuilder = createGroupByQuery(
  this.gameHistoryRepo,
  'game',
  'topic',
  'count',
  { userId, topics: topicsInStats }
);
const topicCounts = await queryBuilder.getRawMany<{ topic: string; count: number }>();
```

**משמש ב:**
- `analytics.service.ts` - `calculateUserStats()` - ספירת משחקים לפי נושא
- `game.service.ts` - חישוב התפלגות נושאים/רמת קושי ברמת ה-DB

## אינדקסים במסד הנתונים

### GameHistoryEntity

**טבלה:** `game_history`

**אינדקסים קיימים:**
- `IDX_game_history_user_id` - על `user_id` (לשאילתות לפי משתמש)
- `IDX_game_history_created_at` - על `created_at` (לשאילתות date range)
- `IDX_game_history_topic` - על `topic` (לשאילתות GROUP BY ו-WHERE)
- `IDX_game_history_difficulty` - על `difficulty` (לשאילתות GROUP BY ו-WHERE)
- `IDX_game_history_user_id_created_at` - Composite index על `(user_id, created_at)` (לשאילתות משולבות)

**Migration:** `1740000000000-AddMissingIndexes.ts`

### TriviaEntity

**טבלה:** `trivia`

**אינדקסים קיימים:**
- `IDX_trivia_topic` - על `topic` (לשאילתות WHERE)
- `IDX_trivia_question` - על `question` (לשאילתות חיפוש)
- `IDX_trivia_difficulty` - על `difficulty` (לשאילתות WHERE)
- `IDX_trivia_topic_difficulty` - Composite index על `(topic, difficulty)` (לשאילתות משולבות)

**Migration:** `1740000000000-AddMissingIndexes.ts`

### UserEntity

**טבלה:** `users`

**אינדקסים קיימים:**
- `IDX_users_username` - על `username` (UNIQUE, לשאילתות login/search)
- `IDX_users_email` - על `email` (UNIQUE, לשאילתות login/search)

### UserStatsEntity

**טבלה:** `user_stats`

**אינדקסים קיימים:**
- `IDX_user_stats_user_id` - על `user_id` (UNIQUE, לשאילתות לפי משתמש)
- `IDX_user_stats_total_games` - על `total_games` (לשאילתות leaderboard)
- `IDX_user_stats_overall_success_rate` - על `overall_success_rate` (לשאילתות leaderboard)
- `IDX_user_stats_weekly_score` - על `weekly_score` (לשאילתות leaderboard לפי תקופה)
- `IDX_user_stats_monthly_score` - על `monthly_score` (לשאילתות leaderboard לפי תקופה)
- `IDX_user_stats_yearly_score` - על `yearly_score` (לשאילתות leaderboard לפי תקופה)

### PaymentHistoryEntity

**טבלה:** `payment_history`

**אינדקסים קיימים:**
- `IDX_payment_history_user_id` - על `user_id` (לשאילתות לפי משתמש)

## דפוסי שאילתות נפוצים

### 1. שאילתות Date Range

**דפוס:**
```typescript
const queryBuilder = this.gameHistoryRepo.createQueryBuilder('game');
queryBuilder
  .where('game.createdAt >= :startDate', { startDate })
  .andWhere('game.createdAt <= :endDate', { endDate });
```

**אופטימיזציה:**
- שימוש ב-`addDateRangeConditions()` helper
- אינדקס על `created_at` ב-`game_history`
- אינדקס מורכב על `(user_id, created_at)` לשאילתות משולבות

### 2. שאילתות GROUP BY

**דפוס:**
```typescript
const queryBuilder = this.gameHistoryRepo.createQueryBuilder('game');
queryBuilder
  .select('game.topic', 'topic')
  .addSelect('CAST(COUNT(*) AS INTEGER)', 'count')
  .where('game.topic IS NOT NULL')
  .groupBy('game.topic')
  .orderBy('count', 'DESC');
```

**אופטימיזציה:**
- שימוש ב-`createGroupByQuery()` helper
- אינדקסים על `topic` ו-`difficulty` ב-`game_history`

### 3. שאילתות Search (ILIKE)

**דפוס:**
```typescript
const queryBuilder = this.userRepository.createQueryBuilder('user');
queryBuilder
  .where('user.username ILIKE :query OR user.firstName ILIKE :query OR user.lastName ILIKE :query', {
    query: `%${searchTerm}%`,
  });
```

**אופטימיזציה:**
- שימוש ב-`addSearchConditions()` helper
- אינדקסים על `username` ו-`email` ב-`users`

### 4. שאילתות Random

**דפוס:**
```typescript
const queryBuilder = this.triviaRepository.createQueryBuilder('trivia');
queryBuilder
  .where('trivia.topic = :topic', { topic })
  .andWhere('trivia.difficulty = :difficulty', { difficulty })
  .orderBy('RANDOM()')
  .limit(count);
```

**אופטימיזציה:**
- שימוש ב-`createRandomQuery()` helper
- אינדקס מורכב על `(topic, difficulty)` ב-`trivia`

## Best Practices

### 1. שימוש ב-Repository Methods vs QueryBuilder

**Repository Methods - לשאילתות פשוטות:**
```typescript
// ✅ טוב - שאילתה פשוטה
const user = await this.userRepository.findOne({ where: { id: userId } });
const games = await this.gameHistoryRepository.find({ where: { userId } });
```

**QueryBuilder - לשאילתות מורכבות:**
```typescript
// ✅ טוב - שאילתה מורכבת עם aggregations
const stats = await this.gameHistoryRepository
  .createQueryBuilder('game')
  .select('CAST(COUNT(*) AS INTEGER)', 'totalGames')
  .where('game.userId = :userId', { userId })
  .getRawOne();
```

### 2. שימוש ב-Query Helpers

**✅ טוב - שימוש ב-helper:**
```typescript
const { addDateRangeConditions } = require('../../common/queries');
addDateRangeConditions(queryBuilder, 'game', 'createdAt', startDate, endDate);
```

**❌ לא טוב - קוד כפול:**
```typescript
if (startDate) {
  queryBuilder.andWhere('game.createdAt >= :startDate', { startDate: new Date(startDate) });
}
if (endDate) {
  queryBuilder.andWhere('game.createdAt <= :endDate', { endDate: new Date(endDate) });
}
```

### 3. Type Safety

**✅ טוב - type safety עם getRawOne/getRawMany:**
```typescript
const result = await queryBuilder.getRawOne<{ totalGames: number; averageScore: number }>();
const totalGames = result?.totalGames ?? 0;
```

**❌ לא טוב - ללא type safety:**
```typescript
const result = await queryBuilder.getRawOne();
const totalGames = result.totalGames; // יכול להיות undefined
```

### 4. Null Safety

**✅ טוב - null safety:**
```typescript
const result = await queryBuilder.getRawOne<{ count: number }>();
const count = result?.count ?? 0;
```

**❌ לא טוב - ללא null safety:**
```typescript
const result = await queryBuilder.getRawOne<{ count: number }>();
const count = result.count; // יכול להיות undefined
```

### 5. אינדקסים

**✅ טוב - שימוש באינדקסים קיימים:**
```typescript
// משתמש ב-IDX_game_history_user_id_created_at
queryBuilder.where('game.userId = :userId', { userId }).andWhere('game.createdAt >= :date', { date });
```

**❌ לא טוב - שאילתה ללא אינדקס:**
```typescript
// לא משתמש באינדקס - איטי
queryBuilder.where('game.score > :score', { score: 100 });
```

## הפניות

- [TypeORM Documentation](https://typeorm.io/)
- [Query Builder](https://typeorm.io/select-query-builder)
- [Indexes](https://typeorm.io/indices)
- [Architecture](../ARCHITECTURE.md)
- [API Reference](./API_REFERENCE.md)

