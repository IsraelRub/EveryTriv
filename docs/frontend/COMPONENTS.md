# רכיבי UI - Frontend

תיעוד רכיבי UI ב-Frontend, כולל רכיבי משחק, UI בסיסיים, פריסה וניווט.

## סקירה כללית

המערכת משתמשת ברכיבי React מאורגנים לפי תחום. כל רכיב מאורגן בתיקייה המתאימה.

## מבנה הרכיבים

```
client/src/components/
├── animations/           # אנימציות
├── game/                 # רכיבי משחק
├── home/                 # רכיבי דף הבית
├── layout/               # רכיבי פריסה
├── navigation/           # רכיבי ניווט
├── stats/                # רכיבי סטטיסטיקות
├── user/                 # רכיבי משתמש
├── ui/                   # רכיבי UI בסיסיים
├── AudioControls.tsx     # בקרת אודיו
├── FeatureErrorBoundary.tsx # Error boundary לתכונות
├── GameMode.tsx          # בחירת מצב משחק
├── IconLibrary.tsx       # ספריית אייקונים
├── Leaderboard.tsx       # לוח מובילים
├── ProtectedRoute.tsx    # רכיב הגנה על נתיבים
├── SubscriptionPlans.tsx # תוכניות מנוי
└── ValidatedForm.tsx     # טופס עם ולידציה
```

## רכיבי משחק

### Game.tsx
הרכיב הראשי של המשחק:
- ניהול מצב המשחק
- הצגת שאלות
- טיפול בתשובות
- עדכון ניקוד

### GameTimer.tsx
טיימר המשחק עם תמיכה במצבי משחק שונים:
```typescript
import GameTimer from '@components/game/GameTimer';
import type { GameTimerProps, GameConfig } from '@types';

const timer = {
  isRunning: true,
  timeElapsed: 45000,  // milliseconds
  timeRemaining: 15000 // milliseconds (רק למצב time-limited)
};

const gameMode: GameConfig = {
  mode: GameMode.TIME_LIMITED,
  topic: 'history',
  difficulty: DifficultyLevel.MEDIUM,
  timeLimit: 60000,
  questionLimit: 10,
  settings: {}
};

<GameTimer timer={timer} gameMode={gameMode} className="mb-4" />
```

**Props:**
- `timer`: `{ isRunning: boolean, timeElapsed: number, timeRemaining?: number }`
- `gameMode`: `GameConfig` - הגדרות מצב משחק
- `className`: `string` - CSS classes נוספים

**תכונות:**
- תצוגה דינמית לפי מצב משחק (time-limited, question-limited, unlimited)
- ספירה לאחור במצב time-limited
- ספירה קדימה במצבים אחרים
- התראה ויזואלית כשהזמן נגמר
- אנימציות עם framer-motion

### TriviaForm.tsx
טופס שאלות טריוויה:
- בחירת נושא
- בחירת קושי
- שליחת בקשה

### TriviaGame.tsx
משחק טריוויה מלא עם טיימר וציון:
```typescript
import TriviaGame from '@components/game/TriviaGame';
import { TriviaQuestion } from '@shared/types';
import type { TriviaGameProps } from '@types';

const question: TriviaQuestion = {
  id: 'q_123',
  question: 'מי כתב את המלט?',
  answers: [
    { text: 'שייקספיר', isCorrect: true, order: 0 },
    { text: 'דיקנס', isCorrect: false, order: 1 },
    { text: 'טולסטוי', isCorrect: false, order: 2 },
    { text: 'המינגווי', isCorrect: false, order: 3 }
  ],
  correctAnswerIndex: 0,
  topic: 'ספרות',
  difficulty: 'medium',
  createdAt: new Date(),
  updatedAt: new Date()
};

<TriviaGame
  question={question}
  onComplete={(isCorrect: boolean, points: number) => {
    console.log('Answer:', isCorrect, 'Points:', points);
  }}
  timeLimit={30}
/>
```

**Props:**
- `question`: `TriviaQuestion` - שאלת טריוויה
- `onComplete`: `(isCorrect: boolean, points: number) => void` - callback בסיום
- `timeLimit`: `number` - מגבלת זמן בשניות (ברירת מחדל: 30)

**תכונות:**
- טיימר אוטומטי עם ספירה לאחור
- הצגת שאלה ותשובות
- בדיקת נכונות תשובה
- חישוב נקודות לפי קושי וזמן
- עדכון Redux state עם נקודות
- אנימציות עם framer-motion
- צלילי feedback (נכון/שגוי/טיימאוט)
- לוגים עם clientLogger

## רכיבי UI בסיסיים

### Button.tsx
כפתורים עם וריאנטים וגודל:
```typescript
import { Button } from '@components/ui';
import { ButtonVariant, ComponentSize } from '@constants';

// כפתור ראשי
<Button variant={ButtonVariant.PRIMARY} size={ComponentSize.MD}>
  לחץ כאן
</Button>

// כפתור משני
<Button variant={ButtonVariant.SECONDARY} size={ComponentSize.LG}>
  ביטול
</Button>

// כפתור accent
<Button variant={ButtonVariant.ACCENT} size={ComponentSize.SM}>
  שמור
</Button>

// כפתור ghost
<Button variant={ButtonVariant.GHOST}>
  העדפות
</Button>

// כפתור עם glass effect
<Button isGlassy={true} withGlow={true}>
  מיוחד
</Button>

// כפתור עם אנימציה
<Button withAnimation={true} onClick={handleClick}>
  לחץ
</Button>
```

**Props:**
- `variant`: `ButtonVariant.PRIMARY` | `ButtonVariant.SECONDARY` | `ButtonVariant.ACCENT` | `ButtonVariant.GHOST`
- `size`: `ComponentSize.SM` | `ComponentSize.MD` | `ComponentSize.LG`
- `isGlassy`: `boolean` - אפקט זכוכית
- `withGlow`: `boolean` - אפקט זוהר
- `withAnimation`: `boolean` - אנימציה
- `onClick`: `(e: MouseEvent<HTMLButtonElement>) => void`

### Card.tsx
כרטיסים עם תמיכה ב-header ו-footer:
```typescript
import { Card } from '@components/ui';

// כרטיס בסיסי
<Card className="p-6">
  <h3 className="text-xl font-bold mb-2">כותרת</h3>
  <p>תוכן הכרטיס</p>
</Card>

// כרטיס עם header
<Card>
  <Card.Header>
    <h3>כותרת הכרטיס</h3>
  </Card.Header>
  <Card.Body>
    <p>תוכן הכרטיס</p>
  </Card.Body>
</Card>

// כרטיס עם footer
<Card>
  <Card.Header>
    <h3>כותרת</h3>
  </Card.Header>
  <Card.Body>
    <p>תוכן</p>
  </Card.Body>
  <Card.Footer>
    <Button>פעולה</Button>
  </Card.Footer>
</Card>
```

**Props:**
- `className`: `string` - CSS classes נוספים
- `isGlassy`: `boolean` - אפקט זכוכית
- `children`: `ReactNode` - תוכן הכרטיס

**תכונות:**
- תמיכה ב-header, body, footer
- אפקט זכוכית אופציונלי
- אנימציות עם framer-motion

### Modal.tsx
חלונות מודאליים עם גדלים שונים:
```typescript
import { Modal } from '@components/ui';
import { ModalSize } from '@constants';
import { useState } from 'react';

const [open, setOpen] = useState(false);

<Modal 
  open={open}
  onClose={() => setOpen(false)}
  size={ModalSize.MD}
  isGlassy={true}
  disableEscapeKeyDown={false}
  disableBackdropClick={false}
>
  <div className="p-6">
    <h2 className="text-2xl font-bold mb-4">כותרת</h2>
    <p>תוכן המודאל</p>
  </div>
</Modal>
```

**Props:**
- `open`: `boolean` - האם המודאל פתוח
- `onClose`: `() => void` - callback לסגירה
- `size`: `ModalSize.SM` | `ModalSize.MD` | `ModalSize.LG` | `ModalSize.XL` | `ModalSize.FULL`
- `isGlassy`: `boolean` - אפקט זכוכית (ברירת מחדל: true)
- `disableEscapeKeyDown`: `boolean` - מניעת סגירה ב-Escape
- `disableBackdropClick`: `boolean` - מניעת סגירה בלחיצה על הרקע

**תכונות:**
- Portal ל-body
- סגירה ב-Escape
- סגירה בלחיצה על רקע
- מניעת scroll ל-body כשפתוח
- אנימציות fade-in

### Input.tsx
שדות קלט עם ולידציה:
```typescript
import { Input, ValidatedInput } from '@components/ui';
import { useState } from 'react';

// Input בסיסי
const [value, setValue] = useState('');

<Input
  type="text"
  value={value}
  onChange={(e) => setValue(e.target.value)}
  placeholder="הכנס שם משתמש"
  className="mb-4"
/>

// ValidatedInput עם ולידציה
<ValidatedInput
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  validation={(val) => val.includes('@')}
  errorMessage="אימייל לא תקין"
  label="אימייל"
/>
```

**Props (Input):**
- `type`: `string` - סוג input
- `value`: `string` - ערך
- `onChange`: `(e: ChangeEvent<HTMLInputElement>) => void`
- `placeholder`: `string` - טקסט מקום
- `disabled`: `boolean` - האם מושבת
- `className`: `string` - CSS classes נוספים

**Props (ValidatedInput):**
- כל ה-props של Input
- `validation`: `(value: string) => boolean` - פונקציית ולידציה
- `errorMessage`: `string` - הודעת שגיאה
- `label`: `string` - תווית

### Select.tsx
רשימות נפתחות:
- Select בסיסי
- Select עם חיפוש
- Select מרובה בחירות

### Avatar.tsx
תמונות פרופיל:
- Avatar עגול
- Avatar מרובע
- Avatar עם fallback

### ErrorBoundary.tsx
טיפול בשגיאות:
- Error boundary בסיסי
- Error boundary עם fallback UI
- Error boundary עם error reporting

## רכיבי פריסה

### Footer.tsx
Footer של האפליקציה:
- קישורים חשובים
- מידע על האפליקציה
- רשתות חברתיות

### GridLayout.tsx
פריסת Grid:
- Grid responsive
- Grid עם columns מותאמים

### NotFound.tsx
דף 404:
- הודעת שגיאה
- קישור לדף הבית

### SocialShare.tsx
שיתוף חברתי:
- שיתוף בפייסבוק
- שיתוף בטוויטר
- שיתוף ב-WhatsApp

## רכיבי ניווט

### Navigation.tsx
תפריט ניווט:
- לינקים לדפים עיקריים
- מצב אימות
- פרופיל משתמש

## רכיבי סטטיסטיקות

### ScoringSystem.tsx
מערכת ניקוד:
- הצגת ניקוד
- חישוב נקודות
- היסטוריית ניקוד

### CustomDifficultyHistory.tsx
היסטוריית קושי מותאם:
- רשימת קשיים מותאמים
- סטטיסטיקות לפי קושי

## רכיבי משתמש

### CompleteProfile.tsx
השלמת פרופיל:
- שדות נדרשים
- ולידציה
- שמירה

### FavoriteTopics.tsx
נושאים מועדפים:
- רשימת נושאים
- הוספה והסרה
- שמירה

### OAuthCallback.tsx
Callback של OAuth:
- טיפול ב-OAuth callback
- שמירת token
- הפניה לדף הבית

## רכיבי אנימציה

### AnimationLibrary.tsx
ספריית אנימציות:
- Fade in/out
- Slide in/out
- Scale in/out
- Rotate

## רכיבי אודיו

### AudioControls.tsx
בקרת אודיו:
- הפעלה/עצירה
- ווליום
- סאונדים שונים

## רכיבים נוספים

### FeatureErrorBoundary.tsx
Error boundary לתכונות ספציפיות:
- טיפול בשגיאות ברמת תכונה
- Fallback UI מותאם
- שמירת שגיאות לניתוח

### GameMode.tsx
בחירת מצב משחק:
- בחירת מצב (question-limited, time-limited, unlimited)
- הגדרות מצב מותאמות
- ולידציה של קלט

### IconLibrary.tsx
ספריית אייקונים:
- אייקונים מותאמים אישית
- תמיכה בגדלים שונים
- אייקונים לפי הקשר

### Leaderboard.tsx
לוח מובילים:
- הצגת דירוגים
- פילטרים לפי תקופה
- מיקום המשתמש

### ProtectedRoute.tsx
רכיב הגנה על נתיבים:
- בדיקת אימות
- בדיקת תפקידים
- הפניה לדף התחברות אם לא מורשה

### SubscriptionPlans.tsx
תוכניות מנוי:
- הצגת תוכניות זמינות
- השוואה בין תוכניות
- בחירת תוכנית

### ValidatedForm.tsx
טופס עם ולידציה:
- ולידציה משולבת
- טיפול בשגיאות
- הצגת הודעות ולידציה

## הפניות

- [ארכיטקטורה כללית](../ARCHITECTURE.md)
- [דיאגרמת Components מלאה](../DIAGRAMS.md#דיאגרמת-components-מלאה)
- [דיאגרמת מבנה Frontend](../DIAGRAMS.md#דיאגרמת-מבנה-frontend)
- [דפי האפליקציה](./VIEWS.md)
