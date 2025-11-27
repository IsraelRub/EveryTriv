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
- אחזור שאלות קיימות ממסד הנתונים לפני יצירת חדשות
- מניעת כפילויות - שאלות שהמשתמש כבר ראה לא יוצגו שוב
- מניעת כפילויות במסד הנתונים - בדיקה לפני שמירת שאלה חדשה
- חישוב תוצאות ושיוך נקודות
- רישום היסטוריית משחק
- ניהול קושי מותאם אישית

## טיפוסים

טיפוסים ספציפיים לשרת נמצאים ב-`@internal/types`:
- `TriviaQuestionMetadata` - metadata עבור שאלות שנוצרו
- `ServerTriviaQuestionInput` - קלט שאלה עבור השרת
- `QuestionCacheEntry` - ערך cache עבור שאלות
- `QuestionCacheMap` - מפה של מפתחות שאלות לערכי cache

טיפוסים משותפים נמצאים ב-`@shared/types`:
- `TriviaQuestion` - שאלת טריוויה
- `TriviaQuestionInput` - קלט שאלה
- `TriviaQuestionDetailsMetadata` - metadata מפורט (כולל `TriviaQuestionSource` ו-`TriviaQuestionReviewStatus`)

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
│   │   ├── implementations/    # מימושים ספציפיים (מסודרים לפי priority)
│   │   │   ├── groq.provider.ts      # Priority 1 - חינמי
│   │   │   ├── gemini.provider.ts    # Priority 2 - $0.075/M
│   │   │   ├── chatgbt.provider.ts   # Priority 3 - $0.15/M
│   │   │   ├── claude.provider.ts    # Priority 4 - $0.25/M
│   │   │   ├── base.provider.ts
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
├── game.controller.ts          # Controller
├── game.service.ts             # Service
├── game.module.ts              # Module
└── index.ts
```

## API Endpoints

### POST /game/trivia

יצירת שאלות טריוויה. המערכת בודקת תחילה אם יש שאלות קיימות במסד הנתונים עם הנושא והרמה המבוקשים, ומשתמשת בהן לפני יצירת שאלות חדשות. המערכת גם מונעת מהמשתמש לקבל שאלות שכבר ראה במשחקים קודמים.

**Request Body:**
```typescript
{
  topic: string;           // נושא השאלות
  difficulty: string;      // רמת קושי (easy, medium, hard, custom:*)
  requestedQuestions: number;   // מספר שאלות מבוקשות (1-50)
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
    body.requestedQuestions,
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
  scoreEarned: number;
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
   * 
   * Process flow:
   * 1. Validates the trivia request (topic, difficulty, requestedQuestions)
   * 2. Retrieves questions the user has already seen from game history
   * 3. Checks if questions exist in database for the requested topic and difficulty
   * 4. Attempts to retrieve existing questions from database first (excluding user's seen questions)
   * 5. If not enough questions exist, generates new questions using AI
   * 6. When generating new questions, checks if question already exists in database before saving
   * 7. Prevents duplicate questions within the same request batch
   * 8. Ensures user never receives the same question across different game sessions
   */
  async getTriviaQuestion(
    topic: string,
    difficulty: GameDifficulty,
    requestedQuestions: number = 1,
    userId?: string
  ): Promise<{ questions: TriviaQuestion[]; fromCache: boolean }> {
    const validation = await this.validationService.validateTriviaRequest(topic, difficulty, requestedQuestions);
    if (!validation.isValid) {
      throw new BadRequestException(validation.errors.join(', '));
    }

    const maxQuestions = SERVER_GAME_CONSTANTS.MAX_QUESTIONS_PER_REQUEST;
    const normalizedRequestedQuestions = Math.min(requestedQuestions, maxQuestions);

    // Get user's seen questions from game history
    const userSeenQuestions = userId ? await this.getUserSeenQuestions(userId) : new Set<string>();
    const excludeQuestionTexts = Array.from(userSeenQuestions);

    // Check if questions exist in database
    const hasExistingQuestions = await this.triviaGenerationService.hasQuestionsForTopicAndDifficulty(topic, difficulty);

    // Try to get existing questions first (excluding user's seen questions)
    let availableQuestions: TriviaEntity[] = [];
    if (hasExistingQuestions) {
      availableQuestions = await this.triviaGenerationService.getAvailableQuestions(
        topic,
        difficulty,
        normalizedRequestedQuestions * 2,
        excludeQuestionTexts
      );
    }

    const questions: TriviaQuestion[] = [];
    const excludeQuestions: string[] = [...excludeQuestionTexts];

    // Use existing questions first
    for (const questionEntity of availableQuestions) {
      if (questions.length >= normalizedRequestedQuestions) break;
      questions.push(questionEntity);
      excludeQuestions.push(questionEntity.question);
    }

    // Generate new questions if we don't have enough
    const remainingCount = normalizedRequestedQuestions - questions.length;
    if (remainingCount > 0) {
      for (let i = 0; i < remainingCount; i++) {
        const questionEntity = await this.triviaGenerationService.generateQuestion(
          topic, 
          difficulty, 
          userId, 
          excludeQuestions
        );
        
        // Check for duplicates in current batch
        const questionText = questionEntity.question.toLowerCase().trim();
        if (!excludeQuestions.some(existing => existing.toLowerCase().trim() === questionText)) {
          questions.push(questionEntity);
          excludeQuestions.push(questionEntity.question);
        }
      }
    }

    if (userId) {
      await this.analyticsService.trackEvent(userId, {
        eventType: 'game',
        userId,
        timestamp: new Date(),
        action: 'question_requested',
        properties: { topic, difficulty, requestedQuestions: normalizedRequestedQuestions },
      });
    }

    return {
      questions: questions || [],
      fromCache: false,
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
    const scoreEarned = isCorrect
      ? this.pointCalculationService.calculatePoints(difficulty, timeSpent || 30)
      : 0;

    if (isCorrect && userId) {
      await this.analyticsService.trackEvent(userId, {
        eventType: 'game',
        userId,
        timestamp: new Date(),
        action: 'answer_correct',
        properties: { questionId, scoreEarned, timeSpent },
      });
    }

    return {
      isCorrect,
      correctAnswer: question.correctAnswerIndex,
      scoreEarned,
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

## AI Providers

המערכת תומכת ב-4 AI providers מסודרים לפי priority (עלות), כאשר priority נמוך יותר = עדיפות גבוהה יותר (נבחר ראשון):

| Provider | Priority | עלות | מודל | Rate Limit |
|----------|----------|------|------|------------|
| **Groq** | 1 | חינמי ($0) | Llama 3.1 8B Instant | 30 req/min |
| **Gemini** | 2 | $0.075/M tokens | Gemini 1.5 Flash | 60 req/min |
| **ChatGPT** | 3 | $0.15/M tokens | GPT-4o-mini | 60 req/min |
| **Claude** | 4 | $0.25/M tokens | Claude 3.5 Haiku | 60 req/min |

### Provider Selection

המערכת משתמשת ב-round-robin selection עם fallback אוטומטי:
1. **Selection**: Providers נבחרים לפי סדר priority (Groq → Gemini → ChatGPT → Claude)
2. **Fallback**: במקרה של שגיאה, המערכת עוברת אוטומטית לפרובידר הבא
3. **Error Handling**: Rate limits (429) ו-auth errors (401) מובילים לדילוג על הפרובידר הנוכחי
4. **Cost Optimization**: הפרובידר הזול ביותר נבחר קודם לחיסכון בעלויות

### Environment Variables

```env
# Priority 1 - Groq (free tier)
GROQ_API_KEY=your-groq-api-key

# Priority 2 - Gemini
GEMINI_API_KEY=your-google-api-key

# Priority 3 - ChatGPT
CHATGBT_API_KEY=your-openai-key

# Priority 4 - Claude
CLAUDE_API_KEY=your-anthropic-key
```

### Provider Configuration

כל provider מכיל:
- `priority`: מספר עדיפות (1-4)
- `costPerToken`: עלות per token
- `rateLimit`: הגבלות קצב (requests/minute, tokens/minute)
- `model`: שם המודל בשימוש
- `maxTokens`: מקסימום tokens לשאילתה

## Question Retrieval Strategy

המערכת משתמשת באסטרטגיה חכמה לאחזור שאלות:

1. **בדיקת שאלות שהמשתמש כבר ראה** - אוסף שאלות מהיסטוריית המשחקים של המשתמש
2. **אחזור שאלות קיימות** - בודק אם יש שאלות במסד הנתונים עם הנושא והרמה המבוקשים
3. **שימוש בשאלות קיימות תחילה** - משתמש בשאלות קיימות לפני יצירת חדשות (חיסכון בעלויות AI)
4. **יצירת שאלות חדשות** - רק אם אין מספיק שאלות קיימות
5. **מניעת כפילויות** - בודק אם שאלה כבר קיימת במסד הנתונים לפני שמירה
6. **מניעת כפילויות בבאצ'** - בודק שאלות לא חוזרות על עצמן באותו בקשה

## Cache Strategy

| סוג נתון | Key Pattern | TTL | הערה |
|----------|-------------|-----|------|
| שאלה לפי ID | `question:{id}` | 300s | אחזור מהיר |

**הערה:** שאלות טריוויה לא נשמרות במטמון יותר, אלא נאחזרות ישירות ממסד הנתונים תוך התחשבות בשאלות שהמשתמש כבר ראה.

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

- אחזור שאלות קיימות ממסד הנתונים לפני יצירת חדשות (חיסכון בעלויות AI)
- Timeout ליצירת שאלות (30 שניות)
- Retry logic עם עד 3 נסיונות לכל שאלה
- מניעת כפילויות ברמת SQL (סינון שאלות שהמשתמש כבר ראה)
- מניעת כפילויות במסד הנתונים (בדיקה לפני שמירה)
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

