# אסטרטגיית בדיקות - EveryTriv

מסמך זה מפרט את אסטרטגיית הבדיקות של הפרויקט EveryTriv.

## מטרות

- אימות לוגיקה קריטית
- הגנה על חוזים (Contracts) בין שכבות
- זיהוי רגרסיות מוקדם

## סוגי בדיקות

| סוג | מטרה | כלים |
|-----|------|------|
| Unit | פונקציות / Services מבודדים | Jest (Backend), Vitest (Frontend) |
| Integration | אינטראקציה בין מודולים (DB/Cache Mock) | Jest + Test Module |
| E2E | זרימות HTTP מלאות | Supertest + Nest App |
| Frontend Component | רינדור UI בסיסי | React Testing Library |
| Frontend Hooks | התנהגות לוגית | React Testing Library + act |

## מבנה Backend

```
server/
├── test/
│   ├── setup.ts
│   └── app.e2e-spec.ts
└── src/
    └── features/
        └── [feature]/
            └── *.spec.ts
```

## מבנה Frontend

```
client/
├── test/
│   ├── setup.ts
│   └── jest.setup.ts
└── src/
    └── [components|hooks|services]/
        └── *.test.tsx
```

## דוגמת Unit (Service)

```typescript
describe('PointsService', () => {
  it('calculates medium difficulty base', () => {
    const s = new PointsService();
    expect(s.calculate({ difficulty:'medium', timeMs:1500 })).toBeGreaterThan(0);
  });
});
```

## דוגמת E2E

```typescript
describe('AuthController (e2e)', () => {
  it('/auth/login (POST)', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email:'a@b.com', password:'secret123' })
      .expect(201);
  });
});
```

## Frontend Component Example

```typescript
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders button with text', () => {
    render(<Button>Play</Button>);
    expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
  });
});
```

## עקרונות Mock

- Mock רק גבולות (IO) ולא לוגיקה פנימית
- שימוש ב-InMemory במקום DB אמיתי ב-Unit
- Mock של API calls ב-Frontend tests

## כיסוי (Coverage)

| שכבה | יעד |
|------|-----|
| Services לוגיים | ≥ 80% Lines |
| Utilities קריטיים | ≥ 90% |
| Controllers | Smoke בלבד |
| Components | ≥ 70% Lines |

## הרצת סט מקומי

```bash
# כל הבדיקות
pnpm run test:all

# בדיקות שרת בלבד
pnpm run test:server

# בדיקות לקוח בלבד
pnpm run test:client

# בדיקות watch mode
cd server && pnpm run test:watch
cd client && pnpm run test:watch

# בדיקות עם coverage
cd server && pnpm run test:cov
cd client && pnpm run test:coverage
```

## Fail Fast

- עצירה מהירה בשגיאת קונפיגורציה
- בדיקת טיפוסים לפני הרצת בדיקות
- וידוא dependencies מותקנות

## Non-Goals

- אין Snapshot כבדים
- אין בדיקות עומס במסגרת זו
- אין בדיקות visual regression

## הפניות

- [מדריך פיתוח](./DEVELOPMENT.md)
- [ארכיטקטורה כללית](./ARCHITECTURE.md)
