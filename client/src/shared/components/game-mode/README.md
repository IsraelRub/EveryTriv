# EveryTriv Game Mode Architecture

## שכבות הארכיטקטורה החדשה

הארכיטקטורה החדשה מבוססת על הפרדה ברורה בין שכבות, תוך שימוש בתבנית Container/Presentational ו-Redux לניהול המצב.

### שכבת ניהול המצב (State Management)

- **Redux**: מנהל את מצב המשחק הגלובלי
  - `gameModeSlice.ts`: מגדיר את מצב המשחק, פעולות, ו-reducers
  - State מופרד לפי תחומי אחריות

### שכבת הלוגיקה (Logic Layer)

- **Custom Hooks**: מכילים את הלוגיקה העסקית
  - `useGameLogic.ts`: 
    - `useGameTimer`: ניהול שעון המשחק
    - `useGameMode`: ניהול מצבי משחק
    - `useGameNavigation`: ניהול מעבר בין שאלות

### שכבת הרכיבים (Component Layer)

- **Container Components**: אחראים על הלוגיקה וקישור למצב
  - `GameContainer`: אחראי על לוגיקת המשחק
  - `GameModeSelectionContainer`: אחראי על בחירת מצב המשחק

- **Presentational Components**: אחראים רק על התצוגה
  - `GameView`: מציג את המשחק
  - `GameTimerView`: מציג את השעון
  - `GameModeSelectionView`: מציג את ממשק בחירת מצב המשחק

## זרימת המידע

```
Redux Store
    ↕️
Container Components
    ↕️
Presentational Components
```

## מצבי משחק

1. **Time Limited**: משחק מוגבל בזמן
   - כמה שיותר שאלות בזמן מוגבל
   - שעון יורד מוצג למשתמש

2. **Question Limited**: משחק מוגבל במספר שאלות
   - מספר שאלות קבוע
   - סיום כשענית על כל השאלות

3. **Unlimited**: משחק ללא הגבלה
   - משחק עד שהמשתמש עוצר
   - שעון מציג זמן מצטבר

## יתרונות הארכיטקטורה החדשה

1. **הפרדת אחריות**: כל רכיב אחראי רק לחלק מוגדר של המערכת
2. **תחזוקה קלה**: קל יותר לתחזק ולהרחיב את המערכת
3. **בדיקות פשוטות**: ניתן לבדוק כל שכבה בנפרד
4. **גמישות**: קל להוסיף מצבי משחק חדשים או לשנות קיימים
5. **ביצועים**: שימוש ב-memoization וצמצום render מיותרים

## דיאגרמה של הרכיבים

```
HomeViewContainer
    ├── TriviaForm
    │     └── GameModeSelectionContainer
    │          └── GameModeSelectionView
    │
    └── GameContainer
         ├── GameView
         │    └── TriviaGame
         └── GameTimerContainer
              └── GameTimerView
```
