# Analytics Module - EveryTriv

## סקירה כללית

מודול האנליטיקה מספק את כל הפונקציונליות הקשורה למעקב אחר התנהגות משתמשים, הפקת דוחות, ניתוח מגמות, ומדדי ביצועים.

לקשר לדיאגרמות: 
- [דיאגרמת זרימת Analytics](../../DIAGRAMS.md#דיאגרמת-זרימת-analytics)
- [דיאגרמת זרימת Admin Dashboard](../../DIAGRAMS.md#דיאגרמת-זרימת-admin-dashboard)
- [דיאגרמת מודולי Backend](../../DIAGRAMS.md#דיאגרמת-מודולי-backend)

## אחריות
- איסוף אירועים (Events) מהמשחק
- הפקת דוחות שימוש
- ניתוח מגמות
- מדדי ביצועים ומערכת
- תובנות וממליצים מותאמים אישית
- **לידרבאורד ודירוגים**: חישוב דירוגים, לוחות תוצאות לפי תקופות זמן, וניהול דירוגי משתמשים

## מבנה מודול

```
server/src/features/analytics/
├── dtos/                         # Data Transfer Objects
│   ├── difficultyAnalyticsQuery.dto.ts
│   ├── topicAnalyticsQuery.dto.ts
│   ├── trackEvent.dto.ts
│   ├── userActivityQuery.dto.ts
│   ├── userComparisonQuery.dto.ts
│   ├── userIdParam.dto.ts
│   ├── userSummaryQuery.dto.ts
│   ├── userTrendQuery.dto.ts
│   ├── leaderboard/              # Leaderboard DTOs
│   │   ├── leaderboard.dto.ts
│   │   └── index.ts
│   └── index.ts
├── services/                      # Analytics Services
│   ├── analytics-tracker.service.ts
│   ├── business-analytics.service.ts
│   ├── global-analytics.service.ts
│   ├── ranking-analytics.service.ts  # Leaderboard & Rankings
│   ├── system-analytics.service.ts
│   └── user-analytics.service.ts
├── analytics.controller.ts        # Analytics Controller
├── leaderboard.controller.ts     # Leaderboard Controller
├── analytics.module.ts           # Module (includes both controllers)
└── index.ts
```

## API Endpoints

### POST /analytics/track

רישום אירוע אנליטיקה.

**Request Body:**
```typescript
{
  eventType: string;
  userId?: string;
  timestamp?: Date;
  action?: string;
  properties?: Record<string, BasicValue>;
}
```

**Response:**
```typescript
{
  tracked: boolean;
}
```

**דוגמת שימוש:**
```typescript
@Post('track')
async trackEvent(@Body() eventData: TrackEventDto) {
  await this.analyticsService.trackEvent(eventData.userId || '', eventData);
  return { tracked: true };
}
```

### GET /analytics/user

אחזור אנליטיקה של משתמש נוכחי.

**Response:**
```typescript
CompleteUserAnalytics
```

**דוגמת שימוש:**
```typescript
@Get('user')
@Cache(CACHE_DURATION.LONG)
async getAuthenticatedUserAnalytics(@CurrentUserId() userId: string) {
  const result = await this.analyticsService.getUserAnalytics(userId);
  return result;
}
```

### GET /analytics/user-stats/:userId (Admin only)

אחזור סטטיסטיקות משתמש (מנהלים בלבד).

**Response:**
```typescript
AnalyticsResponse<UserAnalyticsRecord>
```

**דוגמת שימוש:**
```typescript
@Get('user-stats/:userId')
@Roles(UserRole.ADMIN)
@Cache(CACHE_DURATION.MEDIUM)
async getUserStats(@Param() params: UserIdParamDto) {
  const result = await this.analyticsService.getUserStatistics(params.userId);
  return result;
}
```

### GET /analytics/user-performance/:userId (Admin only)

אחזור מדדי ביצועים של משתמש (מנהלים בלבד).

**Response:**
```typescript
AnalyticsResponse<UserPerformanceMetrics>
```

### GET /analytics/user-progress/:userId (Admin only)

אחזור ניתוח התקדמות משתמש (מנהלים בלבד).

**Request Query:**
```typescript
{
  startDate?: Date;
  endDate?: Date;
  period?: 'daily' | 'weekly' | 'monthly';
}
```

**Response:**
```typescript
AnalyticsResponse<UserProgressAnalytics>
```

### GET /analytics/user-activity/:userId (Admin only)

אחזור פעילות מפורטת של משתמש (מנהלים בלבד).

**Request Query:**
```typescript
{
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}
```

**Response:**
```typescript
AnalyticsResponse<ActivityEntry[]>
```

### GET /analytics/user-insights/:userId (Admin only)

אחזור תובנות מותאמות אישית למשתמש (מנהלים בלבד).

**Response:**
```typescript
AnalyticsResponse<UserInsightsData>
```

### GET /analytics/user-recommendations/:userId (Admin only)

אחזור המלצות מותאמות אישית למשתמש (מנהלים בלבד).

**Response:**
```typescript
AnalyticsResponse<SystemRecommendation[]>
```

### GET /analytics/user-achievements/:userId (Admin only)

אחזור הישגים של משתמש (מנהלים בלבד).

**Response:**
```typescript
AnalyticsResponse<Achievement[]>
```

### GET /analytics/user-trends/:userId (Admin only)

אחזור מגמות משתמש לאורך זמן (מנהלים בלבד).

**Request Query:**
```typescript
{
  startDate?: Date;
  endDate?: Date;
  period?: 'daily' | 'weekly' | 'monthly';
}
```

**Response:**
```typescript
AnalyticsResponse<UserTrendPoint[]>
```

### GET /analytics/user-comparison/:userId (Admin only)

השוואת ביצועי משתמש עם משתמש אחר או ממוצעים גלובליים (מנהלים בלבד).

**Request Query:**
```typescript
{
  target?: 'user' | 'global';
  targetUserId?: string;
}
```

**Response:**
```typescript
AnalyticsResponse<UserComparisonData>
```

### GET /analytics/user-summary/:userId (Admin only)

אחזור סיכום משתמש (מנהלים בלבד).

**Request Query:**
```typescript
{
  includeActivity?: boolean;
}
```

**Response:**
```typescript
AnalyticsResponse<UserSummaryData>
```

### GET /analytics/topics/popular

אחזור נושאים פופולריים.

**Request Query:**
```typescript
{
  limit?: number;
  startDate?: Date;
  endDate?: Date;
}
```

**Response:**
```typescript
AnalyticsResponse<TopicStatsData>
```

### GET /analytics/difficulty/stats

אחזור סטטיסטיקות קושי.

**Request Query:**
```typescript
{
  startDate?: Date;
  endDate?: Date;
}
```

**Response:**
```typescript
AnalyticsResponse<DifficultyStatsData>
```

### DELETE /analytics/admin/stats/clear-all (Admin)

מחיקת כל סטטיסטיקות משתמשים (מנהלים בלבד).

**Response:**
```typescript
{
  cleared: boolean;
  deletedCount: number;
  message: string;
}
```

## Leaderboard Endpoints

הלידרבאורד הוא חלק ממודול האנליזה. ראה [Leaderboard Feature](./LEADERBOARD.md) למידע מפורט על כל ה-endpoints של הלידרבאורד.

**Endpoints עיקריים:**
- `GET /leaderboard/user/ranking` - דירוג משתמש נוכחי
- `GET /leaderboard/global` - לוח תוצאות כללי
- `GET /leaderboard/period/:period` - לוח תוצאות לפי תקופה
- `GET /leaderboard/stats` - סטטיסטיקות לידרבאורד
- `POST /leaderboard/user/update` - עדכון דירוג משתמש
- `DELETE /leaderboard/admin/clear-all` - מחיקת כל הלידרבאורד (Admin)

## Service Methods

### Analytics Services

המודול כולל מספר שירותים:

- **AnalyticsTrackerService** - מעקב אחר אירועים
- **UserAnalyticsService** - אנליטיקה של משתמשים
- **GlobalAnalyticsService** - אנליטיקה גלובלית
- **BusinessAnalyticsService** - אנליטיקה עסקית
- **SystemAnalyticsService** - אנליטיקה של המערכת
- **RankingAnalyticsService** - דירוגים ולידרבאורד (ראה [Leaderboard Feature](./LEADERBOARD.md))

### AnalyticsService

```typescript
@Injectable()
export class AnalyticsService implements OnModuleInit {
  /**
   * Track analytics event
   */
  async trackEvent(userId: string, eventData: AnalyticsEventData): Promise<void> {
    await this.saveEventToDatabase(userId, eventData);
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId: string): Promise<UserAnalyticsRecord> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw createNotFoundError('User');
    }

    const stats = await this.calculateUserStats(userId);

    return {
      userId,
      totalGames: stats.totalGames,
      totalQuestions: stats.totalQuestions,
      successRate: stats.successRate,
      averageScore: stats.averageScore,
      bestScore: stats.bestScore,
      totalPlayTime: stats.totalPlayTime,
      correctAnswers: stats.correctAnswers,
      favoriteTopic: stats.favoriteTopic,
      averageTimePerQuestion: stats.averageTimePerQuestion ?? 0,
      totalScore: stats.totalScore,
      topicsPlayed: stats.topicsPlayed,
      difficultyBreakdown: stats.difficultyBreakdown,
      recentActivity: stats.recentActivity,
    };
  }

  /**
   * Get topic statistics
   */
  async getTopicStats(query: GameAnalyticsQuery): Promise<AnalyticsResponse<TopicStatsData>> {
    const topics = await this.getTopicsFromDatabase(query);

    return {
      data: {
        topics: topics,
        totalTopics: topics.length,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get difficulty statistics
   */
  async getDifficultyStats(query: GameAnalyticsQuery): Promise<AnalyticsResponse<DifficultyStatsData>> {
    const stats = await this.calculateDifficultyStats(query);

    const totalQuestions = Object.values(stats).reduce((sum: number, diff) => sum + diff.total, 0);

    return {
      data: {
        difficulties: stats,
        totalQuestions,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get user analytics (complete)
   */
  async getUserAnalytics(userId: string): Promise<CompleteUserAnalytics> {
    const [stats, performance, progress, insights, recommendations] = await Promise.all([
      this.getUserStats(userId),
      this.getUserPerformance(userId),
      this.getUserProgress(userId),
      this.getUserInsights(userId),
      this.getUserRecommendations(userId),
    ]);

    return {
      stats: stats,
      performance: performance.data,
      progress: progress.data,
      insights: insights.data,
      recommendations: recommendations.data,
    };
  }

  /**
   * Get user performance metrics
   */
  async getUserPerformance(userId: string): Promise<AnalyticsResponse<UserPerformanceMetrics>> {
    const metrics = await this.calculateUserPerformanceMetrics(userId);

    return {
      data: metrics,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get user progress analytics
   */
  async getUserProgress(userId: string, query?: TrendQueryOptions): Promise<AnalyticsResponse<UserProgressAnalytics>> {
    const progress = await this.calculateUserProgress(userId, query);

    return {
      data: progress,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get user activity
   */
  async getUserActivity(userId: string, query?: ActivityQueryOptions): Promise<AnalyticsResponse<ActivityEntry[]>> {
    const activity = await this.getUserActivityFromDatabase(userId, query);

    return {
      data: activity,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get user insights
   */
  async getUserInsights(userId: string): Promise<AnalyticsResponse<UserInsightsData>> {
    const insights = await this.calculateUserInsights(userId);

    return {
      data: insights,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get user recommendations
   */
  async getUserRecommendations(userId: string): Promise<AnalyticsResponse<SystemRecommendation[]>> {
    const recommendations = await this.generateUserRecommendations(userId);

    return {
      data: recommendations,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get user achievements
   */
  async getUserAchievements(userId: string): Promise<AnalyticsResponse<Achievement[]>> {
    const achievements = await this.calculateUserAchievements(userId);

    return {
      data: achievements,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get user trends
   */
  async getUserTrends(userId: string, query?: TrendQueryOptions): Promise<AnalyticsResponse<UserTrendPoint[]>> {
    const trends = await this.calculateUserTrends(userId, query);

    return {
      data: trends,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Compare user performance
   */
  async compareUserPerformance(
    userId: string,
    query: UserComparisonQuery
  ): Promise<AnalyticsResponse<UserComparisonData>> {
    const comparison = await this.calculateUserComparison(userId, query);

    return {
      data: comparison,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get user summary
   */
  async getUserSummary(userId: string, includeActivity: boolean): Promise<AnalyticsResponse<UserSummaryData>> {
    const summary = await this.calculateUserSummary(userId, includeActivity);

    return {
      data: summary,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(): Promise<SystemPerformanceMetrics> {
    await this.updatePerformanceMetrics();
    return this.performanceData;
  }

  /**
   * Get business metrics
   */
  async getBusinessMetrics(): Promise<BusinessMetrics> {
    const businessMetrics = await this.calculateBusinessMetrics();
    return businessMetrics;
  }

  /**
   * Get security metrics
   */
  async getSecurityMetrics(): Promise<SecurityMetrics> {
    const securityMetrics = await this.calculateSecurityMetrics();
    return securityMetrics;
  }

  /**
   * Get system recommendations
   */
  async getSystemRecommendations(): Promise<SystemRecommendation[]> {
    const recommendations = await this.generateSystemRecommendations();
    return recommendations;
  }

  /**
   * Clear all user stats (admin)
   */
  async clearAllUserStats(): Promise<{ message: string; deletedCount: number }> {
    const result = await this.userStatsRepo.delete({});
    
    return {
      message: 'All user stats cleared successfully',
      deletedCount: result.affected || 0,
    };
  }
}
```

## Cache Strategy

| סוג נתון | Key Pattern | TTL | הערה |
|----------|-------------|-----|------|
| סטטיסטיקות משתמש | `analytics:user:{userId}` | 600s | עדכון בעת שינוי |
| ביצועים משתמש | `analytics:performance:{userId}` | 300s | עדכון אוטומטי |
| התקדמות משתמש | `analytics:progress:{userId}` | 300s | עדכון אוטומטי |
| נושאים פופולריים | `analytics:topics:popular` | 1800s | עדכון אוטומטי |
| סטטיסטיקות קושי | `analytics:difficulty:stats` | 1800s | עדכון אוטומטי |
| דירוג משתמש | `leaderboard:user:{userId}` | 300s | עדכון בעת שינוי |
| לוח כללי | `leaderboard:global:{limit}:{offset}` | 600s | עדכון אוטומטי |
| לוח לפי תקופה | `leaderboard:{period}:{limit}` | 900s | עדכון אוטומטי |

## אבטחה
- קבלת אירועים רק ממשתמשים מאומתים
- פעולות מנהליות דורשות תפקיד admin
- הגבלת גישה לנתונים אישיים

## ביצועים
- שימוש ב-Cache לכל הסטטיסטיקות
- חישובים אסינכרוניים למטריקות כבדות
- Batch updates לנתונים

## אינטגרציות

- **Game History Repository**: אחזור נתוני משחקים
- **User Stats Repository**: עדכון סטטיסטיקות משתמשים
- **Cache Service**: ניהול מטמון
- **Logging Service**: רישום אירועים

## קישורים רלוונטיים

- מבנה Backend: `../../README.md#backend`
- API Reference: `../API_REFERENCE.md`
- Internal Structure: `../internal/README.md`
- דיאגרמות: 
  - [דיאגרמת זרימת Analytics](../../DIAGRAMS.md#דיאגרמת-זרימת-analytics)
  - [דיאגרמת זרימת Admin Dashboard](../../DIAGRAMS.md#דיאגרמת-זרימת-admin-dashboard)

---
 