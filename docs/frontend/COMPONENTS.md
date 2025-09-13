# UI Components

תיעוד סטטי לרכיבי הממשק.

## קטגוריות
| קטגוריה | תיקייה | תיאור |
|---------|--------|-------|
| בסיסיים | components/ui | רכיבי יסוד (Button, Card, Modal) |
| פריסה | components/layout | ניווט ו-Layout כללי |
| משחק | components/game | לוח משחק, טיימר, תשובות |
| אנימציה | components/animation | רקעים ואפקטים |
| מצבים | components/feedback | הודעות, טעינה, ריק |

## עקרונות
- רכיבי Presentational ללא לוגיקה עסקית.
- קונפיגורציה דרך Props Typed.
- נגישות: aria-* חובה לרכיבים אינטראקטיביים.

## דוגמת Button (תמצית)
```typescript
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary'|'secondary'|'outline'|'ghost';
  size?: 'sm'|'md'|'lg';
  loading?: boolean;
}
```

## דוגמת Card
```typescript
interface CardProps { elevation?: 0|1|2; padding?: 'sm'|'md'|'lg'; }
```

## נגישות
| נושא | כלל |
|------|-----|
| Focus | טבעת מיקוד גלויה |
| Modal | Focus Trap + Esc Close |
| Icon | aria-label אם ללא טקסט |
| Animation | Respect reduced motion |

## בדיקות ויזואליות
- Storybook / Showcase פנימי (אם מופעל).
- בדיקת רספונסיביות (Mobile / Tablet / Desktop).
- עקביות מול טוקנים: ראה `../architecture/DESIGN_SYSTEM.md`.

## טעינה עצלה
- רכיבים כבדים ב-Views נטענים ב-dynamic import.

---
 
