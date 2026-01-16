# Leaderboard Feature - EveryTriv

## סקירה כללית

הלידרבאורד הוא חלק ממודול האנליזה ומספק את כל הפונקציונליות הקשורה לדירוג משתמשים ולטבלאות ציון, כולל לוח כללי, לוחות לפי תקופות זמן, ודירוג משתמשים בודדים.

**הערה:** הלידרבאורד משולב במודול האנליזה (`AnalyticsModule`) ולא מודול נפרד. ראה [Analytics Module](./ANALYTICS.md) למידע נוסף.

לקשר לדיאגרמות: [דיאגרמת מודולי Backend](../../DIAGRAMS.md#דיאגרמת-מודולי-backend)

## אחריות
- חישוב דירוגים (Rank) לפי ניקוד
- הצגת Top N משתמשים
- עדכון דירוגים אוטומטי או ידני
- לוחות לפי תקופות זמן (שבועי, חודשי, שנתי)
- ניהול מנהלי (מנהלים בלבד)

## מבנה בתוך Analytics Module

```
server/src/features/analytics/
├── dtos/
│   └── leaderboard/            # Leaderboard DTOs
│       ├── leaderboard.dto.ts
│       └── index.ts
├── leaderboard.controller.ts   # Leaderboard Controller
├── services/
│   └── ranking-analytics.service.ts  # RankingAnalyticsService
└── analytics.module.ts          # כולל LeaderboardController ו-RankingAnalyticsService
```

## API Endpoints

### GET /leaderboard/user/ranking

אחזור דירוג משתמש נוכחי.

**Response:**
```typescript
LeaderboardEntity | null
```

**דוגמת שימוש:**
```typescript
@Get('user/ranking')
@NoCache()
async getUserRanking(@CurrentUserId() userId: string) {
  const ranking = await this.leaderboardService.getUserRanking(userId);
  if (!ranking) {
    // Create initial ranking if doesn't exist
    const newRanking = await this.leaderboardService.updateUserRanking(userId);
    return newRanking;
  }
  return ranking;
}
```

### POST /leaderboard/user/update

עדכון דירוג משתמש נוכחי.

**Response:**
```typescript
LeaderboardEntity
```

**דוגמת שימוש:**
```typescript
@Post('user/update')
async updateUserRanking(@CurrentUserId() userId: string) {
  const ranking = await this.rankingAnalyticsService.updateUserRanking(userId);
  return ranking;
}
```

### GET /leaderboard/global

אחזור לוח תוצאות כללי (ציבורי).

**Request Query:**
```typescript
{
  limit?: number;    // מספר תוצאות (ברירת מחדל: 100, מקסימום: 1000)
  offset?: number;   // אופסט לדפדוף
}
```

**Response:**
```typescript
{
  leaderboard: LeaderboardEntity[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}
```

**דוגמת שימוש:**
```typescript
@Get('global')
@Public()
@Cache(CACHE_DURATION.LONG)
async getGlobalLeaderboard(@Query() query: GetLeaderboardDto) {
  const limitNum = query.limit || 100;
  const offsetNum = query.offset ?? 0;
  const leaderboard = await this.rankingAnalyticsService.getGlobalLeaderboard({
    limit: limitNum,
    offset: offsetNum,
  });
  return {
    leaderboard,
    pagination: {
      limit: limitNum,
      offset: offsetNum,
      total: leaderboard.length,
    },
  };
}
```

### GET /leaderboard/period/:period

אחזור לוח תוצאות לפי תקופת זמן (ציבורי).

**Path Parameters:**
- `period`: תקופת זמן (`weekly`, `monthly`, `yearly`)

**Request Query:**
```typescript
{
  limit?: number;    // מספר תוצאות (ברירת מחדל: 100, מקסימום: 1000)
}
```

**Response:**
```typescript
{
  period: 'weekly' | 'monthly' | 'yearly';
  leaderboard: LeaderboardEntity[];
  pagination: {
    limit: number;
    total: number;
  };
}
```

**דוגמת שימוש:**
```typescript
@Get('period/:period')
@Public()
@Cache(CACHE_DURATION.EXTENDED)
async getLeaderboardByPeriod(@Param('period') periodParam: string, @Query() query: GetLeaderboardDto) {
  const limitNum = query.limit || 100;
  const period = periodParam || query.type || 'weekly';
  const leaderboard = await this.leaderboardService.getLeaderboardByPeriod(period, limitNum);
  return {
    period,
    leaderboard,
    pagination: {
      limit: limitNum,
      total: leaderboard.length,
    },
  };
}
```

### DELETE /leaderboard/admin/clear-all (Admin)

מחיקת כל רשומות לוח התוצאות (מנהלים בלבד).

**Response:**
```typescript
{
  cleared: boolean;
  deletedCount: number;
  message: string;
}
```

**דוגמת שימוש:**
```typescript
@Delete('admin/clear-all')
@Roles(UserRole.ADMIN)
async clearAllLeaderboard(@CurrentUserId() userId: string) {
  const result = await this.rankingAnalyticsService.clearAllLeaderboard();
  return result;
}
```

## Service Methods

### RankingAnalyticsService

השירות מנוהל על ידי `RankingAnalyticsService` בתוך מודול האנליזה.

```typescript
@Injectable()
export class RankingAnalyticsService {
  constructor(
    @InjectRepository(LeaderboardEntity)
    private readonly leaderboardRepository: Repository<LeaderboardEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(GameHistoryEntity)
    private readonly gameHistoryRepository: Repository<GameHistoryEntity>,
    @InjectRepository(UserStatsEntity)
    private readonly userStatsRepository: Repository<UserStatsEntity>,
    private readonly cacheService: CacheService
  ) {}

  /**
   * Update user ranking
   */
  async updateUserRanking(userId: string): Promise<LeaderboardEntity> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get user game history
    const gameHistory = await this.gameHistoryRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    // Calculate statistics
    const stats = this.calculateUserStats(gameHistory);

    // Calculate total score
    const totalScore = this.calculateTotalScore(
      user,
      gameHistory,
      stats.overallSuccessRate,
      { current: stats.currentStreak, best: stats.longestStreak }
    );

    // Get or create leaderboard entry
    let leaderboard = await this.leaderboardRepository.findOne({
      where: { userId },
    });

    if (!leaderboard) {
      leaderboard = this.leaderboardRepository.create({
        userId,
        score: totalScore,
        rank: 0,
      });
    } else {
      leaderboard.score = totalScore;
    }

    // Save leaderboard entry
    const savedLeaderboard = await this.leaderboardRepository.save(leaderboard);

    // Update user stats
    const userStats = await this.userStatsRepository.findOne({ where: { userId } });
    if (userStats) {
      userStats.totalGames = stats.totalGames;
      userStats.totalQuestions = stats.totalQuestions;
      userStats.correctAnswers = stats.correctAnswers;
      userStats.overallSuccessRate = stats.overallSuccessRate;
      userStats.currentStreak = stats.currentStreak;
      userStats.longestStreak = stats.longestStreak;
      userStats.weeklyScore = stats.weeklyScore;
      userStats.monthlyScore = stats.monthlyScore;
      userStats.yearlyScore = stats.yearlyScore;
      await this.userStatsRepository.save(userStats);
    }

    // Recalculate ranks
    await this.recalculateRanks();

    // Invalidate cache
    await this.cacheService.delete(`leaderboard:user:${userId}`);
    await this.cacheService.delete(`leaderboard:global:*`);
    await this.cacheService.delete(`leaderboard:period:*`);

    return savedLeaderboard;
  }

  /**
   * Get user ranking
   */
  async getUserRanking(userId: string): Promise<LeaderboardEntity | null> {
    const cacheKey = `leaderboard:user:${userId}`;

    return await this.cacheService.getOrSet<LeaderboardEntity | null>(
      cacheKey,
      async () => {
        const ranking = await this.leaderboardRepository.findOne({
          where: { userId },
          relations: ['user', 'userStats'],
        });

        return ranking;
      },
      CACHE_DURATION.MEDIUM
    );
  }

  /**
   * Get global leaderboard
   */
  async getGlobalLeaderboard(limit: number = 100, offset: number = 0): Promise<LeaderboardEntity[]> {
    const cacheKey = `leaderboard:global:${limit}:${offset}`;

    return await this.cacheService.getOrSet<LeaderboardEntity[]>(
      cacheKey,
      async () => {
        const leaderboard = await this.leaderboardRepository.find({
          relations: ['user', 'userStats'],
          order: { score: 'DESC' },
          take: limit,
          skip: offset,
        });

        return leaderboard;
      },
      CACHE_DURATION.LONG
    );
  }

  /**
   * Get leaderboard by time period
   */
  async getLeaderboardByPeriod(
    period: 'weekly' | 'monthly' | 'yearly',
    limit: number = 100
  ): Promise<LeaderboardEntity[]> {
    const cacheKey = `leaderboard:${period}:${limit}`;

    return await this.cacheService.getOrSet<LeaderboardEntity[]>(
      cacheKey,
      async () => {
        // Type-safe mapping for period to score field
        const scoreFieldMap: Record<string, keyof UserStatsEntity> = {
          weekly: 'weeklyScore',
          monthly: 'monthlyScore',
          yearly: 'yearlyScore',
        };

        const scoreField = scoreFieldMap[period];
        if (!scoreField) {
          throw new Error(`Invalid period: ${period}. Valid periods are: weekly, monthly, yearly`);
        }

        const leaderboard = await this.leaderboardRepository
          .createQueryBuilder('leaderboard')
          .leftJoinAndSelect('leaderboard.user', 'user')
          .leftJoinAndSelect('leaderboard.userStats', 'userStats')
          .orderBy(`userStats.${scoreField}`, 'DESC')
          .limit(limit)
          .getMany();

        return leaderboard;
      },
      CACHE_DURATION.LONG
    );
  }

  /**
   * Clear all leaderboard entries (admin)
   */
  async clearAllLeaderboard(): Promise<{ message: string; deletedCount: number }> {
    const result = await this.leaderboardRepository.delete({});
    
    // Invalidate all cache
    await this.cacheService.delete(`leaderboard:*`);

    return {
      message: 'All leaderboard entries cleared successfully',
      deletedCount: result.affected || 0,
    };
  }

  /**
   * Recalculate all ranks
   */
  private async recalculateRanks(): Promise<void> {
    const leaderboard = await this.leaderboardRepository.find({
      order: { score: 'DESC' },
    });

    for (let i = 0; i < leaderboard.length; i++) {
      leaderboard[i].rank = i + 1;
    }

    await this.leaderboardRepository.save(leaderboard);
  }

  /**
   * Calculate user statistics from game history
   */
  private calculateUserStats(gameHistory: GameHistoryEntity[]) {
    const totalGames = gameHistory.length;
    const totalQuestions = gameHistory.reduce((sum, game) => sum + game.totalQuestions, 0);
    const correctAnswers = gameHistory.reduce((sum, game) => sum + game.correctAnswers, 0);
    const successRate = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

    // Calculate streak
    const streakData = this.calculateStreak(gameHistory);

    // Calculate time-based scores
    const timeScores = this.calculateTimeBasedScores(gameHistory);

    // Calculate topic and difficulty stats
    const topicStats = this.calculateTopicStats(gameHistory);
    const difficultyStats = this.calculateDifficultyStats(gameHistory);

    return {
      totalGames,
      totalQuestions,
      correctAnswers,
      incorrectAnswers: totalQuestions - correctAnswers,
      overallSuccessRate: successRate,
      currentStreak: streakData.current,
      longestStreak: streakData.best,
      lastPlayDate: gameHistory[0]?.createdAt,
      weeklyScore: timeScores.weekly,
      monthlyScore: timeScores.monthly,
      yearlyScore: timeScores.yearly,
      topicStats,
      difficultyStats,
    };
  }

  /**
   * Calculate streak from game history
   */
  private calculateStreak(gameHistory: GameHistoryEntity[]) {
    if (gameHistory.length === 0) {
      return { current: 0, best: 0 };
    }

    // Sort by date (newest first)
    const sortedHistory = [...gameHistory].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < sortedHistory.length; i++) {
      const gameDate = new Date(sortedHistory[i].createdAt);
      gameDate.setHours(0, 0, 0, 0);

      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - i);

      if (gameDate.getTime() === expectedDate.getTime()) {
        tempStreak++;
        if (i === 0) {
          currentStreak = tempStreak;
        }
      } else {
        bestStreak = Math.max(bestStreak, tempStreak);
        tempStreak = 0;
      }
    }

    bestStreak = Math.max(bestStreak, tempStreak);

    return { current: currentStreak, best: bestStreak };
  }

  /**
   * Calculate time-based scores
   */
  private calculateTimeBasedScores(gameHistory: GameHistoryEntity[]) {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    const weeklyGames = gameHistory.filter(game => game.createdAt >= oneWeekAgo);
    const monthlyGames = gameHistory.filter(game => game.createdAt >= oneMonthAgo);
    const yearlyGames = gameHistory.filter(game => game.createdAt >= oneYearAgo);

    return {
      weekly: weeklyGames.reduce((sum, game) => sum + game.score, 0),
      monthly: monthlyGames.reduce((sum, game) => sum + game.score, 0),
      yearly: yearlyGames.reduce((sum, game) => sum + game.score, 0),
    };
  }
}
```

## Cache Strategy

| סוג נתון | Key Pattern | TTL | הערה |
|----------|-------------|-----|------|
| דירוג משתמש | `leaderboard:user:{userId}` | 300s | עדכון בעת שינוי |
| לוח כללי | `leaderboard:global:{limit}:{offset}` | 600s | עדכון אוטומטי |
| לוח לפי תקופה | `leaderboard:{period}:{limit}` | 900s | עדכון אוטומטי |

## ביצועים
- שימוש ב-Cache ל-Top N
- Index על שדה score
- Recalculation אוטומטי של דירוגים
- Batch updates לסטטיסטיקות

## אינטגרציות

- **User Repository**: גישה לנתוני משתמשים
- **Game History Repository**: חישוב סטטיסטיקות ממשחקים
- **User Stats Repository**: עדכון סטטיסטיקות משתמשים
- **Cache Service**: ניהול מטמון

## אבטחה
- לוחות ציבוריים נגישים לכולם
- עדכון דירוג דורש אימות
- פעולות מנהליות דורשות תפקיד admin

## קישורים רלוונטיים

- מבנה Backend: `../../README.md#backend`
- API Reference: `../API_REFERENCE.md`
- Internal Structure: `../internal/README.md`
- דיאגרמות: [דיאגרמת מודולי Backend](../../DIAGRAMS.md#דיאגרמת-מודולי-backend)

---
 