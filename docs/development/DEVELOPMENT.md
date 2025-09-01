# מדריך פיתוח - EveryTriv

## סקירה כללית

מדריך זה מכסה את כל ההיבטים של פיתוח בפרויקט EveryTriv, כולל הגדרת סביבה, גיידליינים לפיתוח, API documentation, וכלים שימושיים.

## הגדרת סביבת פיתוח

### דרישות מערכת
- **Node.js**: גרסה 18 ומעלה
- **pnpm**: מנהל חבילות (מומלץ)
- **Git**: מערכת בקרת גרסאות
- **Docker**: (אופציונלי) לפריסה

### התקנה ראשונית

```bash
# שכפול הפרויקט
git clone https://github.com/IsraelRub/EveryTriv.git
cd EveryTriv

# התקנת תלויות
pnpm install

# הגדרת משתני סביבה
cp .env.example .env
# ערוך את קובץ .env עם הערכים הנכונים

# הפעלת מסד נתונים
docker-compose up -d postgres redis

# הרצת מיגרציות
cd server
pnpm run migration:run
```

### משתני סביבה נדרשים

#### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:3001
VITE_APP_NAME=EveryTriv
VITE_APP_VERSION=2.0.0
```

#### Backend (.env)
```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=everytriv
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# AI Providers
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
GOOGLE_AI_API_KEY=your-google-key
MISTRAL_API_KEY=your-mistral-key

# Stripe
STRIPE_SECRET_KEY=your-stripe-key
STRIPE_WEBHOOK_SECRET=your-webhook-secret
```

## גיידליינים לפיתוח

### TypeScript

#### הגדרות מומלצות
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": true
  }
}
```

#### גיידליינים לטיפוסים
```typescript
// ✅ טוב - טיפוסים מפורשים
interface UserProfile {
  id: string;
  name: string;
  email: string;
  points: number;
}

// ❌ רע - שימוש ב-any
const user: any = { id: 1, name: "John" };

// ✅ טוב - שימוש ב-unknown עם type guard
function processData(data: unknown): string {
  if (typeof data === 'string') {
    return data.toUpperCase();
  }
  throw new Error('Invalid data type');
}
```

### React Components

#### מבנה רכיב מומלץ
```typescript
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

interface ComponentProps {
  title: string;
  onAction?: (data: string) => void;
}

export const MyComponent: React.FC<ComponentProps> = ({ 
  title, 
  onAction 
}) => {
  const [state, setState] = useState<string>('');
  const dispatch = useDispatch();
  const data = useSelector((state: RootState) => state.data);

  useEffect(() => {
    // Side effects
  }, []);

  const handleClick = () => {
    if (onAction) {
      onAction(state);
    }
  };

  return (
    <div className="my-component">
      <h2>{title}</h2>
      <button onClick={handleClick}>פעולה</button>
    </div>
  );
};
```

#### גיידליינים לרכיבים
- השתמש ב-functional components עם hooks
- הפרד לוגיקה עסקית ל-custom hooks
- השתמש ב-React.memo לביצועים
- הימנע מ-prop drilling - השתמש ב-Context או Redux

### Redux Toolkit

#### מבנה slice מומלץ
```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface GameState {
  currentQuestion: Question | null;
  score: number;
  isPlaying: boolean;
}

const initialState: GameState = {
  currentQuestion: null,
  score: 0,
  isPlaying: false,
};

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    setQuestion: (state, action: PayloadAction<Question>) => {
      state.currentQuestion = action.payload;
    },
    updateScore: (state, action: PayloadAction<number>) => {
      state.score += action.payload;
    },
    setPlaying: (state, action: PayloadAction<boolean>) => {
      state.isPlaying = action.payload;
    },
  },
});

export const { setQuestion, updateScore, setPlaying } = gameSlice.actions;
export default gameSlice.reducer;
```

### NestJS Backend

#### מבנה מודול מומלץ
```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TriviaController } from './controllers/trivia.controller';
import { TriviaService } from './services/trivia.service';
import { TriviaEntity } from '../shared/entities/trivia.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TriviaEntity])],
  controllers: [TriviaController],
  providers: [TriviaService],
  exports: [TriviaService],
})
export class TriviaModule {}
```

#### מבנה controller מומלץ
```typescript
import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TriviaService } from '../services/trivia.service';
import { CreateQuestionDto } from '../dtos/create-question.dto';
import { AuthGuard } from '../../auth/guards/auth.guard';

@ApiTags('trivia')
@Controller('trivia')
@UseGuards(AuthGuard)
export class TriviaController {
  constructor(private readonly triviaService: TriviaService) {}

  @Post('question')
  @ApiOperation({ summary: 'יצירת שאלה חדשה' })
  @ApiResponse({ status: 201, description: 'שאלה נוצרה בהצלחה' })
  async createQuestion(@Body() createQuestionDto: CreateQuestionDto) {
    return this.triviaService.createQuestion(createQuestionDto);
  }
}
```

## מערכת הטיפוסים

### מבנה הטיפוסים המאוחד

#### Shared Types (`shared/types/`)
- **מקור יחיד לאמת** עבור טיפוסים המשמשים ב-client ו-server
- מכיל טיפוסים מאורגנים לפי נושאים:
  - `api.types.ts` - טיפוסי API, תגובות, שגיאות
  - `game.types.ts` - טיפוסי משחק, שאלות, היסטוריה
  - `user.types.ts` - טיפוסי משתמש, פרופיל, העדפות
  - `validation.types.ts` - טיפוסי אימות, סכמות
  - `analytics.types.ts` - טיפוסי אנליטיקה, מדדים
  - `auth.types.ts` - טיפוסי אימות, הרשאות
  - `payment.types.ts` - טיפוסי תשלומים, מנויים
  - `points.types.ts` - טיפוסי נקודות, עסקאות
  - `ai.types.ts` - טיפוסי AI, ספקים
  - `logging.types.ts` - טיפוסי לוגים, רמות
  - `storage.types.ts` - טיפוסי אחסון, מטמון
  - `error.types.ts` - טיפוסי שגיאות
  - `http.types.ts` - טיפוסי HTTP, בקשות
  - `response.types.ts` - טיפוסי תגובות
  - `data.types.ts` - טיפוסי נתונים בסיסיים
  - `metadata.types.ts` - טיפוסי מטא-דאטה
  - `subscription.types.ts` - טיפוסי מנויים
  - `cache.types.ts` - טיפוסי מטמון
  - `ui.types.ts` - טיפוסי ממשק משתמש
  - `typeorm.types.ts` - טיפוסי TypeORM
  - `component.types.ts` - טיפוסי רכיבים
  - `language.types.ts` - טיפוסי שפה, אימות שפה
- **אל תכפיל טיפוסים אלה במקומות אחרים**

#### Client-Specific Types (`client/src/types/`)
- `component.types.ts` - ממשקי props של רכיבים
- `redux.types.ts` - ניהול state של Redux
- `user.types.ts` - טיפוסים הקשורים למשתמש
- `game.types.ts` - טיפוסים של לוגיקת המשחק
- `audio.types.ts` - מערכת אודיו
- `validation.types.ts` - אימות טפסים

#### Server-Specific Types (`server/src/shared/types/`)
- `game.types.ts` - טיפוסים של משחק בשרת
- `user.types.ts` - טיפוסים של משתמש בשרת
- `api.types.ts` - טיפוסים של API

### הנחיות שימוש

#### ייבוא טיפוסים
```typescript
// ייבוא מה-index הראשי (מומלץ)
import { GameTimerProps, UserState, GameMode } from '../../types';

// ייבוא מקבצים ספציפיים (למקרים ספציפיים)
import { GameTimerProps } from '../../types/component.types';
import { UserState } from '../../types/redux.types';
import { GameMode } from 'everytriv-shared/types/game.types';
```

#### Props של רכיבים
```typescript
// שימוש בטיפוסים מאוחדים
import { GameTimerProps } from '../../types';

export default function GameTimer(props: GameTimerProps) {
  // מימוש הרכיב
}
```

#### State של Redux
```typescript
// שימוש בטיפוסים מאוחדים של Redux
import { UserState, ScoreUpdatePayload } from '../../types/redux.types';

const userSlice = createSlice({
  name: 'user',
  initialState: {} as UserState,
  reducers: {
    updateScore: (state, action: PayloadAction<ScoreUpdatePayload>) => {
      // מימוש
    }
  }
});
```

### יתרונות המערכת המאוחדת
1. **מקור יחיד לאמת**: כל הטיפוסים מרוכזים במקום אחד
2. **עקביות**: טיפוסים זהים בין client ו-server
3. **תחזוקה קלה**: שינויים נעשים במקום אחד בלבד
4. **Type Safety**: בדיקות טיפוסים מדויקות
5. **תיעוד טוב יותר**: מבנה ברור ומובן

### ממשקים חדשים שנוספו לאחרונה
כחלק מהשיפורים שבוצעו, נוספו ממשקים חדשים לשיפור הטיפוסיות:

#### ממשקי תגובה (Response Interfaces)
- `CanPlayResponse` - תגובה לבדיקת יכולת משחק
- `PurchaseResponse` - תגובה לפעולות רכישה
- `DifficultyStats` - סטטיסטיקות קושי
- `UserRank` - מידע על דירוג משתמש
- `UserStats` - סטטיסטיקות משתמש מפורטות

#### ממשקי בקשה (Request Interfaces)
- `DeductPointsRequest` - בקשת ניכוי נקודות
- `ValidateCustomDifficultyRequest` - בקשת אימות קושי מותאם
- `ValidateLanguageRequest` - בקשת אימות שפה

#### שיפורים בטיפוסיות
- הוספת `extends Record<string, unknown>` לממשקי בקשה
- החלפת `as unknown` casts בממשקים ספציפיים
- שיפור התיעוד עם `@used_by` מדויק
- סימון ממשקים מיושנים כ-`@deprecated`

## מערכת הקבועים המאוחדת

### מבנה הקבועים

#### קבועים משותפים (`shared/constants/`)
- `game.constants.ts` - קבועי משחק (רמות קושי, מכפילים, הגדרות תור)
- `validation.constants.ts` - קבועי אימות (כללים, תבניות, הודעות שגיאה)
- `api.constants.ts` - קבועי API (נקודות קצה, קודי סטטוס, timeouts)
- `info.constants.ts` - קבועי אפליקציה (מידע על האפליקציה, מדינות, נושאים)
- `error.constants.ts` - קבועי שגיאות, הודעות שגיאה
- `payment.constants.ts` - קבועי תשלומים, מחירים
- `storage.constants.ts` - קבועי אחסון, מטמון
- `navigation.constants.ts` - קבועי ניווט, נתיבים
- `logging.constants.ts` - קבועי לוגים, רמות
- `language.constants.ts` - קבועי שפה, תמיכה בשפות
- `tech.constants.ts` - קבועי טכנולוגיה, גרסאות
- `social.constants.ts` - קבועי רשתות חברתיות
- `infrastructure.constants.ts` - קבועי תשתית, URLs
- `http.constants.ts` - קבועי HTTP, סטטוסים

#### קבועים ספציפיים ל-Client
- `audio.constants.ts` - קבועי אודיו
- קבועי UI עם עיצוב, קישורי ניווט, הגדרות אנימציה

#### קבועים ספציפיים ל-Server
- `database.constants.ts` - קבועי מסד נתונים
- `redis.constants.ts` - קבועי Redis
- הגדרות שרת, timeout, retry policy, connection pools

### שימוש בקבועים

#### ייבוא קבועים משותפים
```typescript
// בצד הלקוח
import { VALIDATION_RULES, API_ENDPOINTS } from '../../../../shared/constants';

// בצד השרת
import { VALIDATION_RULES, API_ENDPOINTS } from '../../../shared/constants';
```

#### ייבוא קבועים ספציפיים
```typescript
// קבועי אודיו (רק בצד הלקוח)
import { AUDIO_PATHS, AudioKey } from '../constants/audio.constants';

// קבועי מסד נתונים (רק בצד השרת)
import { DATABASE_CONSTANTS } from '../constants/database.constants';
```

### יתרונות האיחוד
1. **מניעת כפילות**: אין צורך לשמור את אותם קבועים בשני מקומות
2. **עקביות**: שינויים בקבועים משותפים מתעדכנים אוטומטית בשני הצדדים
3. **תחזוקה קלה**: פחות קבצים לתחזק ולעדכן
4. **Type Safety**: TypeScript יכול לזהות אי התאמות בין הצדדים
5. **ארגון טוב יותר**: הפרדה ברורה בין קבועים משותפים לספציפיים

## API Documentation

### נקודות קצה עיקריות

#### אימות (Auth)
```http
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
GET  /api/auth/profile
```

#### טריוויה (Trivia)
```http
POST /api/trivia/question
POST /api/trivia/answer
GET  /api/trivia/history
GET  /api/trivia/leaderboard
GET  /api/trivia/stats
```

#### משתמשים (Users)
```http
GET  /api/users/profile
PUT  /api/users/profile
GET  /api/users/stats
GET  /api/users/achievements
```

#### תשלומים (Payments)
```http
POST /api/payments/create-session
POST /api/payments/webhook
GET  /api/payments/history
```

### דוגמאות בקשות

#### יצירת שאלה חדשה
```typescript
const response = await fetch('/api/trivia/question', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    topic: 'היסטוריה',
    difficulty: 'בינוני',
    language: 'he'
  })
});

const question = await response.json();
```

#### שליחת תשובה
```typescript
const response = await fetch('/api/trivia/answer', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    questionId: '123',
    answer: 'תשובה נבחרת',
    timeSpent: 15
  })
});

const result = await response.json();
```

## בדיקות (Testing)

### Frontend Testing

#### בדיקות רכיבים עם React Testing Library
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '../redux/store';
import { GameComponent } from './GameComponent';

describe('GameComponent', () => {
  it('מציג שאלה כאשר המשחק פעיל', () => {
    render(
      <Provider store={store}>
        <GameComponent />
      </Provider>
    );

    expect(screen.getByText(/שאלה:/)).toBeInTheDocument();
  });

  it('מעדכן ניקוד כאשר עונים נכון', () => {
    render(
      <Provider store={store}>
        <GameComponent />
      </Provider>
    );

    const correctButton = screen.getByText('תשובה נכונה');
    fireEvent.click(correctButton);

    expect(screen.getByText(/ניקוד: 10/)).toBeInTheDocument();
  });
});
```

#### בדיקות Hooks
```typescript
import { renderHook, act } from '@testing-library/react';
import { useGameLogic } from '../hooks/layers/business/useGameLogic';

describe('useGameLogic', () => {
  it('מתחיל משחק חדש', () => {
    const { result } = renderHook(() => useGameLogic());

    act(() => {
      result.current.startGame('היסטוריה', 'בינוני');
    });

    expect(result.current.isPlaying).toBe(true);
    expect(result.current.currentTopic).toBe('היסטוריה');
  });
});
```

### Backend Testing

#### בדיקות שירותים
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { TriviaService } from './trivia.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TriviaEntity } from '../shared/entities/trivia.entity';

describe('TriviaService', () => {
  let service: TriviaService;
  let mockRepository: any;

  beforeEach(async () => {
    mockRepository = {
      find: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TriviaService,
        {
          provide: getRepositoryToken(TriviaEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<TriviaService>(TriviaService);
  });

  it('יוצר שאלה חדשה', async () => {
    const createQuestionDto = {
      topic: 'היסטוריה',
      difficulty: 'בינוני',
      language: 'he'
    };

    mockRepository.save.mockResolvedValue({
      id: '123',
      ...createQuestionDto
    });

    const result = await service.createQuestion(createQuestionDto);

    expect(result.id).toBe('123');
    expect(mockRepository.save).toHaveBeenCalled();
  });
});
```

## כלים לפיתוח

### Frontend Tools

#### Vite Dev Server
```bash
# הפעלת שרת פיתוח
pnpm run dev

# בנייה לייצור
pnpm run build

# תצוגה מקדימה של בנייה
pnpm run preview
```

#### ESLint ו-Prettier
```bash
# בדיקת קוד
pnpm run lint

# תיקון אוטומטי
pnpm run lint:fix

# עיצוב קוד
pnpm run format
```

### Backend Tools

#### NestJS CLI
```bash
# יצירת מודול חדש
nest generate module feature-name

# יצירת controller חדש
nest generate controller feature-name

# יצירת service חדש
nest generate service feature-name
```

#### TypeORM CLI
```bash
# יצירת מיגרציה
pnpm run migration:generate -- -n CreateUsersTable

# הרצת מיגרציות
pnpm run migration:run

# ביטול מיגרציה אחרונה
pnpm run migration:revert
```

## Debugging

### Frontend Debugging

#### React DevTools
- התקן את React Developer Tools
- השתמש ב-Profiler לבדיקת ביצועים
- בדוק את Redux DevTools לניהול מצב

#### Console Logging
```typescript
// שימוש ב-logger service
import { logger } from '../services/logger.service';

logger.info('משחק התחיל', { topic: 'היסטוריה', difficulty: 'בינוני' });
logger.error('שגיאה במשחק', error);
```

### Backend Debugging

#### NestJS Logging
```typescript
import { Logger } from '@nestjs/common';

export class TriviaService {
  private readonly logger = new Logger(TriviaService.name);

  async createQuestion(dto: CreateQuestionDto) {
    this.logger.log(`יוצרת שאלה חדשה: ${dto.topic}`);
    
    try {
      const question = await this.generateQuestion(dto);
      this.logger.log(`שאלה נוצרה בהצלחה: ${question.id}`);
      return question;
    } catch (error) {
      this.logger.error('שגיאה ביצירת שאלה', error.stack);
      throw error;
    }
  }
}
```

#### Database Debugging
```typescript
// הפעלת לוגים של TypeORM
{
  "typeorm": {
    "logging": ["query", "error", "warn"]
  }
}
```

## ביצועים ואופטימיזציה

### Frontend Optimization

#### Code Splitting
```typescript
// Lazy loading של רכיבים
const UserProfile = React.lazy(() => import('./views/user/UserProfile'));
const Leaderboard = React.lazy(() => import('./views/leaderboard/Leaderboard'));

// Suspense wrapper
<Suspense fallback={<LoadingSpinner />}>
  <UserProfile />
</Suspense>
```

#### Memoization
```typescript
// React.memo לביצועים
const ExpensiveComponent = React.memo(({ data }) => {
  return <div>{/* רכיב יקר */}</div>;
});

// useMemo לחישובים יקרים
const expensiveValue = useMemo(() => {
  return heavyCalculation(data);
}, [data]);
```

### Backend Optimization

#### Database Optimization
```typescript
// אינדקסים למסד נתונים
@Entity()
@Index(['topic', 'difficulty'])
@Index(['createdAt'])
export class TriviaEntity {
  // ...
}

// Query optimization
const questions = await this.triviaRepository
  .createQueryBuilder('trivia')
  .where('trivia.topic = :topic', { topic })
  .andWhere('trivia.difficulty = :difficulty', { difficulty })
  .orderBy('RANDOM()')
  .limit(1)
  .getOne();
```

#### Caching
```typescript
// Redis caching
@Injectable()
export class TriviaService {
  constructor(
    private readonly cacheService: CacheService,
    private readonly triviaRepository: Repository<TriviaEntity>
  ) {}

  async getQuestion(topic: string, difficulty: string) {
    const cacheKey = `question:${topic}:${difficulty}`;
    
    let question = await this.cacheService.get(cacheKey);
    
    if (!question) {
      question = await this.triviaRepository.findOne({
        where: { topic, difficulty }
      });
      
      await this.cacheService.set(cacheKey, question, 3600); // 1 hour
    }
    
    return question;
  }
}
```
 
