# ארכיטקטורת השרת - EveryTriv

## סקירה כללית

אפליקציית משחק טריוויה מבוססת NestJS עם ניהול משתמשים, אימות ותכונות משחק בזמן אמת. המערכת מאורגנת בארכיטקטורה מודולרית עם הפרדת אחריות ברורה.

> הערת סנכרון תרשימים: ייצוג מודולים מסוימים (Trivia, Game History, Logger, AI) בתרשימים הוא מושגי ומאוחד בפועל בתוך `GameModule` ושירותי Shared. טבלת סטטוס מלאה: `../DIAGRAMS.md#diagram-sync-status`. תרשים זרימת ליבת NestJS: `../DIAGRAMS.md#nestjs-core-flow`.

## מבנה הפרויקט

האפליקציה מאורגנת במספר תיקיות ראשיות, כל אחת משרתת מטרה ספציפית:

### תיקיית Core (/)

השורש הראשי של האפליקציה שקושר יחד את כל התכונות, הקוד המשותף וההגדרות:

- `app.module.ts` - מודול NestJS הראשי
- `main.ts` - נקודת הכניסה לאפליקציה
- `app.controller.ts` - בקר האפליקציה הראשי

### תיקיית Config (/config)

מכילה קבצי הגדרות ומודולים לאפליקציה:

- `app.config.ts` - הגדרות האפליקציה הראשיות
- `database.config.ts` - הגדרות מסד נתונים (TypeORM)
- `redis.config.ts` - הגדרות Redis
- `redis.module.ts` / `redis.service.ts` - אינטגרציה של Redis
- `global-exception.filter.ts` - טיפול שגיאות גלובלי

### תיקיית Features (/features)

מכילה את כל התכונות העסקיות הראשיות של האפליקציה, מאורגנות לפי תחום:

#### תכונת Auth (/features/auth)
מטפלת בלוגיקת אימות והרשאות:
- `controllers/` - נקודות קצה API של אימות (התחברות, רישום וכו')
- `services/` - לוגיקה עסקית לאימות
- `guards/` - שומרי נתיבים להגנה על נקודות קצה
- `strategies/` - אסטרטגיות אימות (JWT, Google OAuth)
- `auth.module.ts` - מודול NestJS לתכונת האימות

#### תכונת User (/features/user)
מטפלת בניהול משתמשים:
- `controllers/` - נקודות קצה API של משתמשים (פרופיל וכו')
- `services/` - לוגיקה עסקית לניהול משתמשים
- `user.module.ts` - מודול NestJS לתכונת המשתמשים

#### תכונת Trivia (/features/trivia)
מטפלת בלוגיקת משחק הטריוויה:
- `controllers/` - נקודות קצה API של טריוויה (שאלות, היסטוריה, לוח תוצאות וכו')
- `services/` - לוגיקה עסקית לטריוויה
- `providers/` - ספקי AI (OpenAI, Anthropic, Google)
- `data-structures/` - מבני נתונים מתקדמים (Trie, Circular Buffer)
- `trivia.module.ts` - מודול NestJS לתכונת הטריוויה
- `queue.module.ts` - לוגיקת תור לעיבוד טריוויה

#### תכונת Points (/features/points)
מטפלת במערכת הנקודות:
- `controllers/` - נקודות קצה API לנקודות
- `services/` - לוגיקה עסקית לחישוב נקודות
- `points.module.ts` - מודול NestJS למערכת הנקודות

#### תכונת Payment (/features/payment)
מטפלת בתשלומים:
- `controllers/` - נקודות קצה API לתשלומים
- `services/` - לוגיקה עסקית לתשלומים
- `stripe.service.ts` - אינטגרציה עם Stripe
- `subscription.service.ts` - ניהול מנויים
- `payment.module.ts` - מודול NestJS לתשלומים

#### תכונת Game History (/features/game-history)
מטפלת בהיסטוריית משחקים:
- `controllers/` - נקודות קצה API להיסטוריה
- `services/` - לוגיקה עסקית להיסטוריה
- `game-history.module.ts` - מודול NestJS להיסטוריה

### תיקיית Shared (/shared)

מכילה קוד משותף בין מספר תכונות:

- `entities/` - ישויות TypeORM (UserEntity, TriviaEntity, GameHistoryEntity)
- `middleware/` - middleware גלובלי או לשימוש חוזר (הגבלת קצב, אימות)
- `types/` - סוגי TypeScript ו-DTOs משותפים (re-exports מ-shared)
- `utils/` - פונקציות עזר משותפות
- `services/` - שירותים משותפים (Logger, Cache, AI)
- `constants/` - קבועים משותפים (re-exports מ-shared)

### תיקיית Common (/common)

מכילה קוד משותף לכל האפליקציה:

- `decorators/` - דקורטורים מותאמים אישית
- `filters/` - פילטרים לטיפול בשגיאות
- `guards/` - שומרי נתיבים גלובליים
- `interceptors/` - interceptors
- `pipes/` - pipes לוולידציה

## זרימת בקשה (Request Lifecycle)

```
Request → Middleware Chain → Guards → Interceptors (pre) → Controller → Interceptors (post) → Response → Filters (on error)
```

### סדר עיבוד (ממוזג)
| שלב | רכיב | תפקיד |
|-----|-------|-------|
| 1 | LoggingMiddleware | רישום בקשה נכנסת |
| 2 | DecoratorAwareMiddleware | איסוף/הזרקת Metadata |
| 3 | RateLimitMiddleware | בדיקות קצב |
| 4 | CountryCheckMiddleware | בדיקות מיקום |
| 5 | AuthMiddleware | אימות טוקן / public bypass |
| 6 | RoleCheckMiddleware | הרשאות תפקיד / הרשאות מפורטות |
| 7 | BodyValidationMiddleware | ולידציית גוף |
| 8 | BulkOperationsMiddleware | אופטימיזציות batch |
| 9 | Guards (DecoratorMetadataGuard) | יישום מדיניות דקורטורים |
| 10 | CacheInterceptor | קריאה/כתיבה למטמון תשובה |
| 11 | ResponseFormattingInterceptor | עיצוב אחיד לתגובה |
| 12 | PerformanceMonitoringInterceptor | מדידת זמני פעולה |
| 13 | Controller | ביצוע לוגיקה עסקית |
| 14 | Exception Filters | טיפול שגיאות גלובלי |

### דקורטורים מאורגנים
```
common/decorators/
├── auth/ (@Public, @Roles, @Permissions, @RequireAuth)
├── cache/ (@Cache, @CacheAdvanced, @NoCache, @CacheTags)
├── validation/ (@RateLimit, @ApiResponse, @ValidateSchema)
├── param/ (@ClientIP, @UserAgent, @CurrentUser, @UserRole)
```

### Metadata מאוחד (דוגמה)
```typescript
interface DecoratorMetadata {
  isPublic: boolean;
  roles: string[];
  permissions: string[];
  rateLimit?: RateLimitConfig;
  cache?: CacheConfig;
  cacheTags?: string[];
  validationSchema?: string | object;
  apiResponse?: ApiResponseConfig | ApiResponseConfig[];
}
```

### יתרונות
- קריאה אחת של metadata → שימוש חוזר לאורך הצינור.
- הפרדת אחריות מוחלטת בין שכבות.
- הרחבה קלה: הוספת Decorator = הרחבת Guard/Interceptor מתאים.

## תכונות מפתח

### 1. אימות והרשאות
- רישום והתחברות משתמשים
- אימות מבוסס JWT
- בקרת גישה מבוססת תפקידים
- פונקציונליות איפוס סיסמה
- אינטגרציה עם Google OAuth

### 2. ניהול משתמשים
- פרופילי משתמשים
- מעקב אחר ניקוד
- ניהול נתוני משתמשים
- העדפות משתמש

### 3. משחק טריוויה
- יצירת שאלות דינמית עם ספקי LLM (OpenAI, Anthropic, Google)
- מעקב אחר ניקוד והיסטוריה
- מערכת לוח תוצאות
- תור עדיפויות לעיבוד שאלות
- קאש Redis לביצועים
- ולידציה מתקדמת של שאלות

### 4. מערכת נקודות
- חישוב נקודות דינמי
- בונוסים על רצפים
- מערכת הישגים
- סטטיסטיקות מתקדמות

### 5. תשלומים
- אינטגרציה עם Stripe
- ניהול מנויים
- היסטוריית תשלומים
- webhook handling

### 6. תשתית
- קאש Redis
- מסד נתונים PostgreSQL
- הגבלת קצב
- ניטור בריאות
- טיפול שגיאות גלובלי
- לוגים מובנים

## הנחיות פיתוח

### 1. מבנה מודולרי
- כל תכונה היא עצמאית עם המודול, הבקרים והשירותים שלה
- קוד משותף מרוכז בתיקיית shared
- כל מודול מייצא רק את השירותים הנדרשים

### 2. Dependency Injection
```typescript
@Injectable()
export class TriviaService {
  constructor(
    private readonly triviaRepository: Repository<TriviaEntity>,
    private readonly cacheService: CacheService,
    private readonly aiService: AIService
  ) {}
}
```

### 3. Error Handling
```typescript
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: exception.message,
    });
  }
}
```

### 4. Validation
```typescript
export class CreateQuestionDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  topic: string;

  @IsString()
  @IsIn(['easy', 'medium', 'hard'])
  difficulty: string;

  @IsOptional()
  @IsString()
  customDifficulty?: string;
}
```

### 5. Logging
```typescript
@Injectable()
export class TriviaService {
  private readonly logger = new Logger(TriviaService.name);

  async createQuestion(dto: CreateQuestionDto) {
    logger.log(`Creating question for topic: ${dto.topic}`);
    
    try {
      const question = await this.generateQuestion(dto);
      logger.log(`Question created successfully: ${question.id}`);
      return question;
    } catch (error) {
      logger.error('Failed to create question', error.stack);
      throw error;
    }
  }
}
```

## מבנה מסד הנתונים

### ישויות עיקריות

#### UserEntity
```typescript
@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  username: string;

  @Column()
  passwordHash: string;

  @Column({ default: 0 })
  points: number;

  @Column({ type: 'jsonb', nullable: true })
  preferences: UserPreferences;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

#### TriviaEntity
```typescript
@Entity('trivia_questions')
export class TriviaEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  topic: string;

  @Column()
  difficulty: string;

  @Column('text')
  question: string;

  @Column('jsonb')
  answers: TriviaAnswer[];

  @Column()
  correctAnswerIndex: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: QuestionMetadata;

  @CreateDateColumn()
  createdAt: Date;
}
```

#### GameHistoryEntity
```typescript
@Entity('game_history')
export class GameHistoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => UserEntity)
  user: UserEntity;

  @Column()
  score: number;

  @Column()
  totalQuestions: number;

  @Column()
  correctAnswers: number;

  @Column()
  topic: string;

  @Column()
  difficulty: string;

  @Column()
  gameMode: string;

  @Column()
  timeSpent: number;

  @CreateDateColumn()
  createdAt: Date;
}
```

## שירותי AI

### BaseProvider
```typescript
export abstract class BaseAIProvider {
  abstract generateQuestion(params: GenerateQuestionParams): Promise<TriviaQuestion>;
  abstract validateQuestion(question: TriviaQuestion): Promise<ValidationResult>;
  
  protected abstract formatPrompt(params: GenerateQuestionParams): string;
  protected abstract parseResponse(response: string): TriviaQuestion;
}
```

### OpenAI Provider
```typescript
@Injectable()
export class OpenAIProvider extends BaseAIProvider {
  constructor(
    private readonly openai: OpenAI,
    private readonly configService: ConfigService
  ) {
    super();
  }

  async generateQuestion(params: GenerateQuestionParams): Promise<TriviaQuestion> {
    const prompt = this.formatPrompt(params);
    
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });

    return this.parseResponse(response.choices[0].message.content);
  }
}
```

## מערכת מטמון

### Redis Cache Service
```typescript
@Injectable()
export class CacheService {
  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly logger: Logger
  ) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await this.redis.setex(key, ttl, serialized);
      } else {
        await this.redis.set(key, serialized);
      }
    } catch (error) {
      logger.error(`Cache set error for key ${key}:`, error);
    }
  }
}
```

## Middleware

### Rate Limiting
```typescript
@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  constructor(private readonly cacheService: CacheService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const key = `rate_limit:${req.ip}`;
    const limit = 100; // requests per window
    const window = 900; // 15 minutes

    const current = await this.cacheService.get<number>(key) || 0;
    
    if (current >= limit) {
      return res.status(429).json({
        message: 'Rate limit exceeded',
        retryAfter: window,
      });
    }

    await this.cacheService.set(key, current + 1, window);
    next();
  }
}
```

### Authentication
```typescript
@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly jwtService: JwtService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      req['user'] = payload;
      next();
    } catch (error) {
      return res.status(401).json({ message: 'Invalid token' });
    }
  }
}
```

## Testing

### Unit Tests
```typescript
describe('TriviaService', () => {
  let service: TriviaService;
  let mockRepository: jest.Mocked<Repository<TriviaEntity>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TriviaService,
        {
          provide: getRepositoryToken(TriviaEntity),
          useValue: {
            find: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TriviaService>(TriviaService);
    mockRepository = module.get(getRepositoryToken(TriviaEntity));
  });

  it('should create a question', async () => {
    const dto = { topic: 'History', difficulty: 'medium' };
    const expectedQuestion = { id: '1', ...dto };

    mockRepository.save.mockResolvedValue(expectedQuestion);

    const result = await service.createQuestion(dto);

    expect(result).toEqual(expectedQuestion);
    expect(mockRepository.save).toHaveBeenCalled();
  });
});
```

### E2E Tests
```typescript
describe('TriviaController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/trivia/question (POST)', () => {
    return request(app.getHttpServer())
      .post('/trivia/question')
      .send({ topic: 'History', difficulty: 'medium' })
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('id');
        expect(res.body.topic).toBe('History');
      });
  });
});
```

## Deployment

### Docker Configuration
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

EXPOSE 3001

CMD ["pnpm", "run", "start:prod"]
```

### Environment Configuration
```env
# Production Environment
NODE_ENV=production
PORT=3001

# Database
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_NAME=everytriv_prod
DATABASE_USERNAME=everytriv_user
DATABASE_PASSWORD=secure_password

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# JWT
JWT_SECRET=super_secret_jwt_key
JWT_EXPIRES_IN=24h

# AI Providers
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
GOOGLE_AI_API_KEY=your_google_key

# Stripe
STRIPE_SECRET_KEY=your_stripe_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
```

## Monitoring ו-Logging

### Health Checks
```typescript
@Controller('health')
export class HealthController {
  constructor(
    private readonly database: DataSource,
    private readonly redis: Redis
  ) {}

  @Get()
  async check() {
    const dbStatus = await this.checkDatabase();
    const redisStatus = await this.checkRedis();

    return {
      status: dbStatus && redisStatus ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        database: dbStatus ? 'up' : 'down',
        redis: redisStatus ? 'up' : 'down',
      },
    };
  }

  private async checkDatabase(): Promise<boolean> {
    try {
      await this.database.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }

  private async checkRedis(): Promise<boolean> {
    try {
      await this.redis.ping();
      return true;
    } catch {
      return false;
    }
  }
}
```

### Metrics
```typescript
@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);

  recordApiCall(endpoint: string, duration: number, status: number) {
    logger.log('API Call', {
      endpoint,
      duration,
      status,
      timestamp: new Date().toISOString(),
    });
  }

  recordQuestionGeneration(topic: string, difficulty: string, duration: number) {
    logger.log('Question Generation', {
      topic,
      difficulty,
      duration,
      timestamp: new Date().toISOString(),
    });
  }
}
```
 

