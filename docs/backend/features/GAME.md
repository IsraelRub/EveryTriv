# Game Module - EveryTriv

## סקירה כללית

מודול המשחק מספק את הלוגיקה המרכזית ליצירת שאלות טריוויה, ניהול משחקים, חישוב ניקוד, והיסטוריית משחקים.

לקשר לדיאגרמות: 
- [דיאגרמת זרימת משחק מלא](../../DIAGRAMS.md#דיאגרמת-זרימת-משחק-מלא)
- [דיאגרמת זרימת נתונים - יצירת שאלה](../../DIAGRAMS.md#דיאגרמת-זרימת-נתונים---יצירת-שאלה)
- [דיאגרמת זרימת נתונים - תשובה לשאלה](../../DIAGRAMS.md#דיאגרמת-זרימת-נתונים---תשובה-לשאלה)
- [דיאגרמת זרימת Custom Difficulty](../../DIAGRAMS.md#דיאגרמת-זרימת-custom-difficulty)

## אחריות

- ניהול מצב סשן משחק
- יצירת שאלות טריוויה באמצעות AI providers
- אחזור שאלות ממטמון
- חישוב תוצאות ושיוך נקודות
- רישום היסטוריית משחק
- ניהול קושי מותאם אישית

## מבנה מודול

```
server/src/features/game/
├── dtos/                       # Data Transfer Objects
│   ├── customDifficulty.dto.ts # DTO לקושי מותאם
│   ├── submitAnswer.dto.ts     # DTO לשליחת תשובה
│   ├── triviaRequest.dto.ts    # DTO לבקשת טריוויה
│   └── index.ts
├── logic/                      # לוגיקת יצירת טריוויה
│   ├── triviaGeneration.service.ts # שירות יצירת טריוויה
│   ├── providers/              # AI Providers
│   │   ├── implementations/    # מימושים ספציפיים
│   │   │   ├── anthropic.provider.ts
│   │   │   ├── base.provider.ts
│   │   │   ├── google.provider.ts
│   │   │   ├── mistral.provider.ts
│   │   │   ├── openai.provider.ts
│   │   │   └── index.ts
│   │   ├── management/         # ניהול providers
│   │   │   ├── providers.controller.ts
│   │   │   ├── providers.service.ts
│   │   │   └── index.ts
│   │   ├── prompts/            # Prompts ל-AI
│   │   │   ├── prompts.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   └── index.ts
├── types/                      # טיפוסים ספציפיים
│   ├── trivia.types.ts
│   └── index.ts
├── game.controller.ts          # Controller
├── game.service.ts             # Service
├── game.module.ts              # Module
└── index.ts
```

## API Endpoints

### POST /game/trivia

יצירת שאלות טריוויה חדשות.

**Request Body:**
```typescript
{
  topic: string;           // נושא השאלות
  difficulty: string;      // רמת קושי (easy, medium, hard, custom:*)
  questionCount: number;   // מספר שאלות (1-50)
}
```

**Response:**
```typescript
{
  questions: TriviaQuestion[];
  fromCache: boolean;
}
```

**דוגמת שימוש:**
```typescript
@Post('trivia')
@NoCache()
async getTriviaQuestions(@CurrentUserId() userId: string, @Body(TriviaRequestPipe) body: TriviaRequestDto) {
  const result = await this.gameService.getTriviaQuestion(
    body.topic,
    body.difficulty,
    body.questionCount,
    userId
  );
  return result;
}
```

### POST /game/answer

שליחת תשובה לשאלה.

**Request Body:**
```typescript
{
  questionId: string;      // מזהה השאלה
  answer: number;          // אינדקס התשובה הנבחרת
  timeSpent?: number;      // זמן שעבר בשניות
}
```

**Response:**
```typescript
{
  isCorrect: boolean;
  correctAnswer: number;
  pointsEarned: number;
  explanation?: string;
}
```

**דוגמת שימוש:**
```typescript
@Post('answer')
@UsePipes(GameAnswerPipe)
async submitAnswer(@CurrentUserId() userId: string, @Body() body: SubmitAnswerDto) {
  const result = await this.gameService.submitAnswer(
    body.questionId,
    body.answer,
    userId,
    body.timeSpent
  );
  return result;
}
```

### GET /game/trivia/:id

אחזור שאלה לפי מזהה.

**Response:**
```typescript
{
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  topic: string;
  difficulty: DifficultyLevel;
  explanation?: string;
}
```

**דוגמת שימוש:**
```typescript
@Get('trivia/:id')
@Cache(CACHE_DURATION.MEDIUM)
async getQuestionById(@Param('id') id: string) {
  const result = await this.gameService.getQuestionById(id);
  return result;
}
```

### GET /game/history

אחזור היסטוריית משחקים למשתמש.

**Response:**
```typescript
{
  games: GameHistoryEntry[];
  totalGames: number;
  totalScore: number;
  averageScore: number;
}
```

**דוגמת שימוש:**
```typescript
@Get('history')
@Cache(CACHE_DURATION.LONG)
async getGameHistory(@CurrentUserId() userId: string) {
  const result = await this.gameService.getUserGameHistory(userId);
  return result;
}
```

### POST /game/validate-custom-difficulty

אימות קושי מותאם אישית.

**Request Body:**
```typescript
{
  text: string;  // טקסט הקושי
}
```

**Response:**
```typescript
{
  isValid: boolean;
  errors: string[];
}
```

**דוגמת שימוש:**
```typescript
@Post('validate-custom-difficulty')
@Public()
@UsePipes(CustomDifficultyPipe)
async validateCustomDifficulty(@Body() body: ValidateCustomDifficultyDto) {
  const result = await this.gameService.validateCustomDifficulty(body.text);
  return result;
}
```

## Service Methods

### GameService

```typescript
@Injectable()
export class GameService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(GameHistoryEntity)
    private readonly gameHistoryRepository: Repository<GameHistoryEntity>,
    @InjectRepository(TriviaEntity)
    private readonly triviaRepository: Repository<TriviaEntity>,
    private readonly analyticsService: AnalyticsService,
    private readonly leaderboardService: LeaderboardService,
    private readonly cacheService: CacheService,
    private readonly storageService: ServerStorageService,
    private readonly triviaGenerationService: TriviaGenerationService,
    private readonly validationService: ValidationService,
    private readonly pointCalculationService: PointCalculationService
  ) {}

  /**
   * Get trivia question
   */
  async getTriviaQuestion(
    topic: string,
    difficulty: GameDifficulty,
    questionCount: number = 1,
    userId?: string
  ): Promise<{ questions: TriviaQuestion[]; fromCache: boolean }> {
    const validation = await this.validationService.validateTriviaRequest(topic, difficulty, questionCount);
    if (!validation.isValid) {
      throw new BadRequestException(validation.errors.join(', '));
    }

    const maxQuestions = SERVER_GAME_CONSTANTS.MAX_QUESTIONS_PER_REQUEST;
    const actualQuestionCount = Math.min(questionCount, maxQuestions);

    const cacheKey = `trivia:${topic}:${difficulty}:${actualQuestionCount}`;
    const cachedResult = await this.cacheService.get<TriviaQuestion[]>(cacheKey, isTriviaQuestionArray);
    const fromCache = cachedResult.success && cachedResult.data !== null && cachedResult.data !== undefined;

    const questions = fromCache
      ? cachedResult.data
      : await this.cacheService.getOrSet<TriviaQuestion[]>(
          cacheKey,
          async () => {
            const generatedQuestions = [];
            for (let i = 0; i < actualQuestionCount; i++) {
              const question = await this.triviaGenerationService.generateQuestion(topic, difficulty);
              generatedQuestions.push(question);
            }
            return generatedQuestions;
          },
          CACHE_TTL.TRIVIA_QUESTIONS,
          isTriviaQuestionArray
        );

    if (!fromCache && userId) {
      await this.analyticsService.trackEvent(userId, {
        eventType: 'game',
        userId,
        timestamp: new Date(),
        action: 'question_requested',
        properties: { topic, difficulty, questionCount: actualQuestionCount },
      });
    }

    return {
      questions: questions || [],
      fromCache,
    };
  }

  /**
   * Submit answer
   */
  async submitAnswer(
    questionId: string,
    answer: number,
    userId: string,
    timeSpent?: number
  ): Promise<AnswerResult> {
    const question = await this.triviaRepository.findOne({ where: { id: questionId } });
    if (!question) {
      throw new NotFoundException('Question not found');
    }

    const isCorrect = answer === question.correctAnswerIndex;
    const difficulty = toDifficultyLevel(question.difficulty);
    const pointsEarned = isCorrect
      ? this.pointCalculationService.calculatePoints(difficulty, timeSpent || 30)
      : 0;

    if (isCorrect && userId) {
      await this.analyticsService.trackEvent(userId, {
        eventType: 'game',
        userId,
        timestamp: new Date(),
        action: 'answer_correct',
        properties: { questionId, pointsEarned, timeSpent },
      });
    }

    return {
      isCorrect,
      correctAnswer: question.correctAnswerIndex,
      pointsEarned,
      explanation: question.explanation,
    };
  }

  /**
   * Get user game history
   */
  async getUserGameHistory(userId: string): Promise<{
    games: GameHistoryEntry[];
    totalGames: number;
    totalScore: number;
    averageScore: number;
  }> {
    const games = await this.gameHistoryRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 20,
    });

    const totalGames = games.length;
    const totalScore = games.reduce((sum, game) => sum + game.score, 0);
    const averageScore = totalGames > 0 ? totalScore / totalGames : 0;

    return {
      games,
      totalGames,
      totalScore,
      averageScore,
    };
  }

  /**
   * Get question by ID
   */
  async getQuestionById(id: string): Promise<TriviaQuestion> {
    const question = await this.triviaRepository.findOne({ where: { id } });
    if (!question) {
      throw new NotFoundException('Question not found');
    }

    return {
      id: question.id,
      question: question.question,
      options: question.options,
      correctAnswer: question.correctAnswerIndex,
      topic: question.topic,
      difficulty: question.difficulty,
      explanation: question.explanation,
      createdAt: question.createdAt,
      updatedAt: question.updatedAt,
    };
  }

  /**
   * Validate custom difficulty
   */
  async validateCustomDifficulty(text: string): Promise<BaseValidationResult> {
    return validateCustomDifficultyText(text);
  }
}
```

## Cache Strategy

| סוג נתון | Key Pattern | TTL | הערה |
|----------|-------------|-----|------|
| שאלות טריוויה | `trivia:{topic}:{difficulty}:{count}` | 3600s | הפחתת עלות יצירת תוכן |
| שאלה לפי ID | `question:{id}` | 300s | אחזור מהיר |

## אינטגרציות

- **Analytics Service**: מעקב אחרי פעילות משחק
- **Leaderboard Service**: עדכון דירוגים
- **Points Service**: חישוב נקודות
- **Cache Service**: ניהול מטמון
- **Validation Service**: ולידציית בקשות
- **Trivia Generation Service**: יצירת שאלות

## אבטחה

- אימות חובה לכל פעולה (Guard)
- בדיקת בעלות Session (User Id ⇆ Session Owner)
- ולידציית קלט ב-Pipes
- Rate limiting ליצירת שאלות

## ביצועים

- Caching לשאלות חוזרות
- Timeout ליצירת שאלות (30 שניות)
- Fallback לשאלות ברירת מחדל
- Batch generation למספר שאלות

## קישורים רלוונטיים

- מבנה Backend: `../../README.md#backend`
- API Reference: `../API_REFERENCE.md`
- Internal Structure: `../internal/README.md`
- דיאגרמות: 
  - [דיאגרמת זרימת משחק מלא](../../DIAGRAMS.md#דיאגרמת-זרימת-משחק-מלא)
  - [דיאגרמת זרימת נתונים - יצירת שאלה](../../DIAGRAMS.md#דיאגרמת-זרימת-נתונים---יצירת-שאלה)
  - [דיאגרמת זרימת נתונים - תשובה לשאלה](../../DIAGRAMS.md#דיאגרמת-זרימת-נתונים---תשובה-לשאלה)
  - [דיאגרמת זרימת Custom Difficulty](../../DIAGRAMS.md#דיאגרמת-זרימת-custom-difficulty)

