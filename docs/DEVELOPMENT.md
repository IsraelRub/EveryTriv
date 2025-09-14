# מדריך פיתוח מקיף - EveryTriv

## סקירה כללית

מדריך מקיף זה מכסה את כל ההיבטים של פיתוח בפרויקט EveryTriv, כולל הגדרת סביבה, כלי פיתוח, Docker, גיידליינים לפיתוח, API documentation, בדיקות, debugging, וביצועים.

---

## חלק 1: הגדרת סביבת פיתוח

### דרישות מערכת

- **Node.js**: גרסה 18 ומעלה
- **pnpm**: מנהל חבילות (מומלץ)
- **Git**: מערכת בקרת גרסאות
- **Docker**: גרסה 20.10 ומעלה (לפיתוח מקומי)
- **Docker Compose**: גרסה 2.0 ומעלה

### התקנה ראשונית

```bash
# שכפול הפרויקט
git clone https://github.com/IsraelRub/EveryTriv.git
cd EveryTriv

# התקנת תלויות
pnpm install

# הגדרת משתני סביבה
cp .env.example .env
cp server/.env.example server/.env
# ערוך את קבצי .env עם הערכים הנכונים

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

---

## חלק 2: הגדרת Docker

### קונפיגורציית Docker Compose

#### docker-compose.yaml
```yaml
version: '3.8'

services:
  # מסד נתונים PostgreSQL
  postgres:
    image: postgres:15-alpine
    container_name: everytriv-postgres
    environment:
      POSTGRES_DB: everytriv
      POSTGRES_USER: everytriv_user
      POSTGRES_PASSWORD: EvTr!v_DB_P@ssw0rd_2025_S3cur3!
      POSTGRES_INITDB_ARGS: "--encoding=UTF-8 --lc-collate=C --lc-ctype=C"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"
    networks:
      - everytriv-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U everytriv_user -d everytriv"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: everytriv-redis
    command: redis-server --appendonly yes --requirepass EvTr!v_R3d!s_P@ssw0rd_2025_S3cur3!
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    networks:
      - everytriv-network
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Backend Server
  server:
    build:
      context: ./server
      dockerfile: Dockerfile
      target: development
    container_name: everytriv-server
    environment:
      NODE_ENV: development
      DATABASE_HOST: postgres
      DATABASE_PORT: 5432
      DATABASE_NAME: everytriv
      DATABASE_USERNAME: everytriv_user
      DATABASE_PASSWORD: EvTr!v_DB_P@ssw0rd_2025_S3cur3!
      REDIS_HOST: redis
      REDIS_PORT: 6379
      REDIS_PASSWORD: EvTr!v_R3d!s_P@ssw0rd_2025_S3cur3!
      JWT_SECRET: your-super-secret-jwt-key-change-in-production
      JWT_EXPIRES_IN: 24h
      PORT: 3001
    volumes:
      - ./server:/app
      - /app/node_modules
    ports:
      - "3001:3001"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - everytriv-network
    command: pnpm run start:dev

  # Frontend Client
  client:
    build:
      context: ./client
      dockerfile: Dockerfile
      target: development
    container_name: everytriv-client
    environment:
      VITE_API_BASE_URL: http://localhost:3001
      VITE_APP_NAME: EveryTriv
      VITE_APP_VERSION: 2.0.0
    volumes:
      - ./client:/app
      - /app/node_modules
    ports:
      - "3000:3000"
    depends_on:
      - server
    networks:
      - everytriv-network
    command: pnpm run dev

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local

networks:
  everytriv-network:
    driver: bridge
```

### פקודות Docker שימושיות

#### פיתוח
```bash
# הפעלת סביבת פיתוח מלאה
docker-compose up -d

# צפייה בלוגים
docker-compose logs -f

# צפייה בלוגים של שירות ספציפי
docker-compose logs -f server

# עצירת שירותים
docker-compose down

# בנייה מחדש של שירות
docker-compose build server

# הפעלה מחדש של שירות
docker-compose restart server
```

#### תחזוקה
```bash
# ניקוי תמונות לא בשימוש
docker image prune -f

# ניקוי containers לא פעילים
docker container prune -f

# ניקוי volumes לא בשימוש
docker volume prune -f

# ניקוי מלא
docker system prune -a -f

# בדיקת שימוש במשאבים
docker stats
```

---

## חלק 3: כלי פיתוח

### כלים מותקנים

#### Prettier
- **תיאור**: מעצב קוד אוטומטי המבטיח עקביות בפורמט
- **גרסה**: 3.1.0
- **קבצי הגדרה**: `.prettierrc`, `.prettierignore`
- **תפקיד**: עיצוב קוד אוטומטי ב-JavaScript, TypeScript, JSON, Markdown

#### ESLint
- **תיאור**: כלי לניתוח סטטי של קוד לזיהוי שגיאות ובעיות
- **גרסה**: 8.57.0
- **קבצי הגדרה**: `.eslintrc.js`
- **Plugins**: `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser`
- **תפקיד**: זיהוי שגיאות, אכיפת סגנון קוד, אופטימיזציות

#### TypeScript
- **תיאור**: שפת תכנות מוטיפית המבוססת על JavaScript
- **גרסה**: 5.0+
- **קבצי הגדרה**: `tsconfig.json`, `tsconfig.build.json`
- **תפקיד**: טיפוסים חזקים, זיהוי שגיאות בזמן קומפילציה

#### Jest
- **תיאור**: מסגרת בדיקות ל-JavaScript
- **גרסה**: 29.0+
- **קבצי הגדרה**: `jest.config.js`
- **תפקיד**: בדיקות יחידה, בדיקות אינטגרציה

### פקודות זמינות

#### עיצוב קוד (Code Formatting)
```bash
# עיצוב כל הקבצים בפרויקט
pnpm run format

# בדיקה שהקוד מעוצב כראוי (ללא שינוי)
pnpm run format:check

# עיצוב קבצים ספציפיים
pnpm prettier --write "src/**/*.{ts,tsx,js,jsx}"
```

#### ניתוח קוד (Code Linting)
```bash
# בדיקת שגיאות ובעיות בכל הפרויקט
pnpm run lint

# תיקון אוטומטי של בעיות שניתן לתקן
pnpm run lint:fix

# בדיקת קבצים ספציפיים
pnpm eslint "src/**/*.{ts,tsx}"
```

#### בדיקות (Testing)
```bash
# הרצת כל הבדיקות
pnpm run test

# הרצת בדיקות עם coverage
pnpm run test:coverage

# הרצת בדיקות e2e
pnpm run test:e2e

# הרצת בדיקות במצב watch
pnpm run test:watch
```

#### בנייה (Building)
```bash
# בניית הפרויקט לייצור
pnpm run build

# בניית הפרויקט לפיתוח
pnpm run build:dev

# בדיקת טיפוסים TypeScript
pnpm run type-check
```

### קבצי הגדרה

#### .prettierrc
```json
{
  "semi": true,
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "trailingComma": "es5",
  "bracketSpacing": true,
  "arrowParens": "avoid",
  "endOfLine": "lf"
}
```

#### .eslintrc.js
```javascript
module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'prettier'
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-explicit-any': 'error'
  }
};
```

#### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["DOM", "DOM.Iterable", "ES6"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"],
  "exclude": ["node_modules"]
}
```

### אינטגרציה עם IDE

#### VS Code
מומלץ להתקין את התוספים הבאים:
- **Prettier - Code formatter**
- **ESLint**
- **TypeScript Importer**
- **Auto Rename Tag**
- **Bracket Pair Colorizer**

הגדרות מומלצות ב-`settings.json`:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.suggest.autoImports": true,
  "editor.tabSize": 2,
  "editor.insertSpaces": true
}
```

#### Cursor
Cursor תומך באופן מובנה ב-Prettier ו-ESLint. הגדרות דומות ל-VS Code.

---

## חלק 4: גיידליינים לפיתוח

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
import { GameController } from './controllers/game.controller';
import { GameService } from './services/game.service';
import { GameEntity } from '../internal/entities/game.entity';

@Module({
  imports: [TypeOrmModule.forFeature([GameEntity])],
  controllers: [GameController],
  providers: [GameService],
  exports: [GameService],
})
export class GameModule {}
```

#### מבנה controller מומלץ
```typescript
import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GameService } from '../services/game.service';
import { CreateGameDto } from '../dtos/create-game.dto';
import { AuthGuard } from '../../common/guards/auth.guard';

@ApiTags('game')
@Controller('game')
@UseGuards(AuthGuard)
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Post('create')
  @ApiOperation({ summary: 'יצירת משחק חדש' })
  @ApiResponse({ status: 201, description: 'משחק נוצר בהצלחה' })
  async createGame(@Body() createGameDto: CreateGameDto) {
    return this.gameService.createGame(createGameDto);
  }
}
```

---

## חלק 5: מערכת הטיפוסים

### מבנה הטיפוסים המאוחד

#### Shared Types (`shared/types/`)
- **מקור מרכזי** עבור טיפוסים המשמשים ב-client ו-server
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

#### Server-Specific Types (`server/src/internal/types/`)
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
import { GameMode } from '../../shared/types/game.types';
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
1. **מקור מרכזי**: כל הטיפוסים מרוכזים במקום אחד
2. **עקביות**: טיפוסים זהים בין client ו-server
3. **תחזוקה קלה**: שינויים נעשים במקום אחד בלבד
4. **Type Safety**: בדיקות טיפוסים מדויקות
5. **תיעוד טוב יותר**: מבנה ברור ומובן

---

## חלק 6: מערכת הקבועים המאוחדת

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

---

## חלק 7: API Documentation

### נקודות קצה עיקריות

#### אימות (Auth)
```http
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
GET  /api/auth/profile
```

#### משחק (Game)
```http
POST /api/game/create
POST /api/game/answer
GET  /api/game/history
GET  /api/game/leaderboard
GET  /api/game/stats
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

#### יצירת משחק חדש
```typescript
const response = await fetch('/api/game/create', {
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

const game = await response.json();
```

#### שליחת תשובה
```typescript
const response = await fetch('/api/game/answer', {
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

---

## חלק 8: בדיקות (Testing)

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
import { GameService } from './game.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GameEntity } from '../internal/entities/game.entity';

describe('GameService', () => {
  let service: GameService;
  let mockRepository: any;

  beforeEach(async () => {
    mockRepository = {
      find: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameService,
        {
          provide: getRepositoryToken(GameEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<GameService>(GameService);
  });

  it('יוצר משחק חדש', async () => {
    const createGameDto = {
      topic: 'היסטוריה',
      difficulty: 'בינוני',
      language: 'he'
    };

    mockRepository.save.mockResolvedValue({
      id: '123',
      ...createGameDto
    });

    const result = await service.createGame(createGameDto);

    expect(result.id).toBe('123');
    expect(mockRepository.save).toHaveBeenCalled();
  });
});
```

---

## חלק 9: כלים לפיתוח

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

---

## חלק 10: Debugging

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

export class GameService {
  private readonly logger = new Logger(GameService.name);

  async createGame(dto: CreateGameDto) {
    logger.log(`יוצרת משחק חדש: ${dto.topic}`);
    
    try {
      const game = await this.generateGame(dto);
      logger.log(`משחק נוצר בהצלחה: ${game.id}`);
      return game;
    } catch (error) {
      logger.error('שגיאה ביצירת משחק', error.stack);
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

---

## חלק 11: ביצועים ואופטימיזציה

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
export class GameEntity {
  // ...
}

// Query optimization
const questions = await this.gameRepository
  .createQueryBuilder('game')
  .where('game.topic = :topic', { topic })
  .andWhere('game.difficulty = :difficulty', { difficulty })
  .orderBy('RANDOM()')
  .limit(1)
  .getOne();
```

#### Caching
```typescript
// Redis caching
@Injectable()
export class GameService {
  constructor(
    private readonly cacheService: CacheService,
    private readonly gameRepository: Repository<GameEntity>
  ) {}

  async getQuestion(topic: string, difficulty: string) {
    const cacheKey = `question:${topic}:${difficulty}`;
    
    let question = await this.cacheService.get(cacheKey);
    
    if (!question) {
      question = await this.gameRepository.findOne({
        where: { topic, difficulty }
      });
      
      await this.cacheService.set(cacheKey, question, 3600); // 1 hour
    }
    
    return question;
  }
}
```

---

## חלק 12: זרימת עבודה מומלצת

### לפני כל commit
```bash
# עיצוב קוד
pnpm run format

# תיקון בעיות ESLint
pnpm run lint:fix

# בדיקת טיפוסים
pnpm run type-check

# הרצת בדיקות
pnpm run test
```

### במהלך פיתוח
- השתמש ב-format on save ב-IDE
- בדוק שגיאות ESLint באופן רציף
- השתמש ב-TypeScript strict mode
- כתוב בדיקות לכל פונקציונליות חדשה

### בדיקה רציפה
```bash
# בדיקת עיצוב
pnpm run format:check

# בדיקת linting
pnpm run lint

# בדיקת טיפוסים
pnpm run type-check

# הרצת בדיקות
pnpm run test
```

---

## חלק 13: פתרון בעיות נפוצות

### Prettier לא עובד
```bash
# בדוק שהכלי מותקן
pnpm prettier --version

# התקן מחדש אם צריך
pnpm add prettier --save-dev

# בדוק הגדרות
pnpm prettier --config .prettierrc --check "src/**/*.ts"
```

### ESLint מציג שגיאות רבות
```bash
# תיקון אוטומטי
pnpm run lint:fix

# בדיקת הגדרות
pnpm eslint --print-config src/index.ts

# התקנה מחדש של plugins
pnpm add @typescript-eslint/eslint-plugin @typescript-eslint/parser --save-dev
```

### TypeScript שגיאות
```bash
# בדיקת טיפוסים
pnpm tsc --noEmit

# ניקוי cache
rm -rf node_modules/.cache

# התקנה מחדש של dependencies
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### בעיות Docker

#### מסד נתונים לא מתחבר
```bash
# בדיקת סטטוס PostgreSQL
docker-compose ps postgres

# בדיקת לוגים
docker-compose logs postgres

# התחברות למסד נתונים
docker exec -it everytriv-postgres psql -U everytriv_user -d everytriv
```

#### Redis לא מתחבר
```bash
# בדיקת סטטוס Redis
docker-compose ps redis

# בדיקת לוגים
docker-compose logs redis

# התחברות ל-Redis
docker exec -it everytriv-redis redis-cli -a EvTr!v_R3d!s_P@ssw0rd_2025_S3cur3!
```

#### שרת לא עולה
```bash
# בדיקת לוגים
docker-compose logs server

# בדיקת תלויות
docker-compose ps

# הפעלה מחדש
docker-compose restart server
```

---

## חלק 14: כלי אבחון

### Frontend
```bash
# בדיקת bundle size
pnpm run build -- --analyze

# בדיקת dependencies
pnpm audit

# בדיקת TypeScript
pnpm tsc --noEmit

# בדיקת ביצועים
pnpm run build && pnpm lighthouse http://localhost:5173
```

### Backend
```bash
# בדיקת health
curl http://localhost:3001/health

# בדיקת logs
docker logs everytriv-app

# בדיקת database
docker exec -it everytriv-postgres psql -U postgres -d everytriv

# בדיקת memory usage
docker stats everytriv-app
```

### כלי אבחון מתקדמים

#### React Profiler
```typescript
import { Profiler } from 'react';

function onRenderCallback(
  id: string,
  phase: string,
  actualDuration: number,
  baseDuration: number,
  startTime: number,
  commitTime: number
) {
  console.log(`Component ${id} took ${actualDuration}ms to render`);
}

<Profiler id="GameComponent" onRender={onRenderCallback}>
  <GameComponent />
</Profiler>
```

#### Node.js Profiler
```bash
# הפעלת profiler
node --prof server.js

# ניתוח התוצאות
node --prof-process isolate-*.log > processed.txt
```

---

## סיכום

מדריך זה מכסה את כל ההיבטים של פיתוח בפרויקט EveryTriv. הקפד על:

1. **הגדרת סביבה נכונה** - Docker, Node.js, pnpm
2. **שימוש בכלי פיתוח** - Prettier, ESLint, TypeScript
3. **עקיבה אחר גיידליינים** - TypeScript, React, NestJS
4. **כתיבת בדיקות** - Frontend ו-Backend
5. **אופטימיזציה** - ביצועים, caching, code splitting
6. **debugging** - כלים מתקדמים לזיהוי בעיות

לשאלות נוספות, עיין בתיעוד הספציפי לכל רכיב או פנה לצוות הפיתוח.
