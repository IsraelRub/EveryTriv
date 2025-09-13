# Testing Strategy

מסמך: אסטרטגיית בדיקות.

## מטרות
- אימות לוגיקה קריטית.
- הגנה על חוזים (Contracts) בין שכבות.
- זיהוי רגרסיות מוקדם.

## סוגי בדיקות
| סוג | מטרה | כלים |
|-----|------|------|
| Unit | פונקציות / Services מבודדים | Jest |
| Integration | אינטראקציה בין מודולים (DB/Cache Mock) | Jest + Test Module |
| E2E | זרימות HTTP מלאות | Supertest + Nest App |
| Frontend Component | רינדור UI בסיסי | React Testing Library |
| Frontend Hooks | התנהגות לוגית | RTL + act |

## מבנה Backend טיפוסי
```
server/test/
  setup.ts
  app.e2e-spec.ts
  feature/*.spec.ts
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
request(app.getHttpServer())
  .post('/auth/login')
  .send({ email:'a@b.com', password:'secret123' })
  .expect(201);
```

## Frontend Component Example
```typescript
render(<Button>Play</Button>);
expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
```

## עקרונות Mock
- Mock רק גבולות (IO) ולא לוגיקה פנימית.
- שימוש ב-InMemory במקום DB אמיתי ב-Unit.

## כיסוי (Coverage)
| שכבה | יעד |
|------|-----|
| Services לוגיים | ≥ 80% Lines |
| Utilities קריטיים | ≥ 90% |
| Controllers | Smoke בלבד |

## הרצת סט מקומי
```bash
pnpm run test        # כל הבדיקות
pnpm run test:unit   # יחידה בלבד
pnpm run test:e2e    # E2E
```

## Fail Fast
- עצירה מהירה בשגיאת קונפיגורציה.

## Non-Goals
- אין Snapshot כבדים.
- אין בדיקות עומס במסגרת זו.

---
 
