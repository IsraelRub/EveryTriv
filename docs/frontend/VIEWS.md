# דפי האפליקציה - Frontend

תיעוד דפי האפליקציה ב-Frontend, כולל דפי משחק, פרופיל, תשלומים ועוד.

## סקירה כללית

המערכת כוללת דפים מאורגנים בתיקיית `views/`. כל דף כולל את הרכיבים והלוגיקה שלו.

## מבנה הדפים

```
client/src/views/
├── admin/          # דף מנהל
├── analytics/      # דף אנליטיקה
├── game/           # דפי משחק
├── gameHistory/    # היסטוריית משחקים
├── home/           # דף הבית והמשחק
├── leaderboard/    # לוח תוצאות
├── login/          # דף התחברות
├── payment/        # תשלומים
├── points/         # נקודות
├── registration/   # דף רישום
├── settings/       # הגדרות
├── unauthorized/   # דף לא מורשה
└── user/           # פרופיל משתמש
```

## דפים ציבוריים

### HomeView
דף הבית והמשחק - הממשק הראשי של המשחק:
```typescript
import HomeView from '@views/home/HomeView';

// השימוש ב-AppRoutes
<Route path="/" element={<HomeView />} />
```

**תכונות:**
- בחירת נושא וקושי
- בחירת מצב משחק (question-limited, time-limited, unlimited)
- יצירת שאלות טריוויה
- ניהול מצב משחק עם Context API
- עדכון ניקוד בזמן אמת
- שמירת היסטוריית משחקים
- תמיכה בקושי מותאם אישית
- ניהול נקודות
- לוגים ואנליטיקה

**רכיבים משולבים:**
- `TriviaForm` - טופס יצירת שאלות
- `Game` - משחק טריוויה
- `GameTimer` - טיימר המשחק
- `Leaderboard` - לוח תוצאות
- `ScoringSystem` - מערכת ניקוד
- `FavoriteTopics` - נושאים מועדפים
- `CustomDifficultyHistory` - היסטוריית קושי מותאם

### LoginView
דף התחברות עם OAuth:
```typescript
import LoginView from '@views/login/LoginView';

// השימוש ב-AppRoutes
<Route path="/login" element={<LoginView />} />
```

**תכונות:**
- טופס התחברות עם email/password
- OAuth עם Google
- ולידציה של נתונים
- טיפול בשגיאות
- קישור לרישום
- שמירת token ב-Redux state

### RegistrationView
דף רישום עם ולידציה:
```typescript
import RegistrationView from '@views/registration/RegistrationView';

// השימוש ב-AppRoutes
<Route path="/register" element={<RegistrationView />} />
```

**תכונות:**
- טופס רישום עם ולידציה
- בדיקת זמינות username/email
- אימות סיסמה
- קישור להתחברות
- טיפול בשגיאות
- OAuth עם Google

### LeaderboardView
לוח תוצאות עם דירוגים:
```typescript
import LeaderboardView from '@views/leaderboard/LeaderboardView';

// השימוש ב-AppRoutes
<Route path="/leaderboard" element={<LeaderboardView />} />
```

**תכונות:**
- דירוג גלובלי, שבועי, חודשי, שנתי
- מיקום המשתמש
- טבלת דירוגים עם pagination
- פילטרים לפי תקופה
- עדכון אוטומטי

## דפים מוגנים

### UserProfileView
פרופיל משתמש:
```typescript
import UserProfileView from '@views/user/UserProfile';

// השימוש ב-AppRoutes (מוגן)
<Route path="/user/profile" element={<ProtectedRoute><UserProfileView /></ProtectedRoute>} />
```

**תכונות:**
- הצגת פרטי משתמש
- עדכון פרופיל (firstName, lastName, bio)
- עדכון העדפות משתמש
- ניהול תמונת פרופיל
- הצגת סטטיסטיקות בסיסיות
- ניהול חשבון

### GameSessionView
משחק פעיל - ממשק המשחק המלא:
```typescript
import GameSessionView from '@views/game/GameSessionView';

// השימוש ב-AppRoutes (מוגן)
<Route path="/game/session" element={<ProtectedRoute><GameSessionView /></ProtectedRoute>} />
```

**תכונות:**
- הצגת שאלות טריוויה
- שליחת תשובות
- עדכון ניקוד בזמן אמת
- טיימר המשחק
- היסטוריית שאלות
- סיום משחק

### GameSummaryView
סיכום משחק - תוצאות המשחק:
```typescript
import GameSummaryView from '@views/game/GameSummaryView';

// השימוש ב-AppRoutes (מוגן)
<Route path="/game/summary" element={<ProtectedRoute><GameSummaryView /></ProtectedRoute>} />
```

**תכונות:**
- תוצאות המשחק (ניקוד סופי, שאלות נכונות, זמן)
- הישגים חדשים
- השוואה לסטטיסטיקות קודמות
- שיתוף תוצאות
- המשך למשחק הבא

### CustomDifficultyView
קושי מותאם - יצירה וניהול קשיים מותאמים:
```typescript
import CustomDifficultyView from '@views/game/CustomDifficultyView';

// השימוש ב-AppRoutes (מוגן)
<Route path="/game/custom-difficulty" element={<ProtectedRoute><CustomDifficultyView /></ProtectedRoute>} />
```

**תכונות:**
- יצירת קושי מותאם אישית
- היסטוריית קשיים שנוצרו
- שימוש בקושי במשחקים
- עריכה ומחיקה של קשיים
- ולידציה של טקסט קושי

### GameHistoryView
היסטוריית משחקים:
```typescript
import GameHistoryView from '@views/gameHistory/GameHistory';

// השימוש ב-AppRoutes (מוגן)
<Route path="/game/history" element={<ProtectedRoute><GameHistoryView /></ProtectedRoute>} />
```

**תכונות:**
- רשימת כל המשחקים
- פילטרים לפי נושא, קושי, תאריך
- סטטיסטיקות מפורטות
- מחיקת משחקים בודדים
- ניקוי כל ההיסטוריה
- ייצוא נתונים

### PaymentView
תשלומים:
```typescript
import PaymentView from '@views/payment/PaymentView';

// השימוש ב-AppRoutes (מוגן)
<Route path="/payment" element={<ProtectedRoute><PaymentView /></ProtectedRoute>} />
```

**תכונות:**
- תוכניות מנוי זמינות
- רכישת נקודות (חבילות נקודות)
- היסטוריית תשלומים
- ניהול כרטיסי אשראי
- ביטול מנויים
- אינטגרציה עם Stripe

### PointsView
נקודות:
```typescript
import PointsView from '@views/points/PointsView';

// השימוש ב-AppRoutes (מוגן)
<Route path="/points" element={<ProtectedRoute><PointsView /></ProtectedRoute>} />
```

**תכונות:**
- הצגת מאזן נקודות (totalPoints, freeQuestions, purchasedPoints)
- היסטוריית עסקות נקודות
- רכישת נקודות
- חבילות נקודות זמינות
- מגבלות יומיות
- זמן איפוס הבא

### AnalyticsView
אנליטיקה - דשבורד סטטיסטיקות:
```typescript
import AnalyticsView from '@views/analytics/AnalyticsView';

// השימוש ב-AppRoutes (מוגן)
<Route path="/analytics" element={<ProtectedRoute><AnalyticsView /></ProtectedRoute>} />
```

**תכונות:**
- סטטיסטיקות משתמש מפורטות
- מטריקות ביצועים
- דוחות לפי תקופה
- גרפים וייצוגים ויזואליים
- ניתוח לפי נושאים וקשיים
- ייצוא נתונים

### SettingsView
הגדרות:
```typescript
import SettingsView from '@views/settings/SettingsView';

// השימוש ב-AppRoutes (מוגן)
<Route path="/settings" element={<ProtectedRoute><SettingsView /></ProtectedRoute>} />
```

**תכונות:**
- עדכון פרטים אישיים
- העדפות משתמש (notifications, privacy, game)
- הגדרות אודיו (enable/disable, volume)
- הגדרות UI (theme, language)
- ניהול חשבון (מחיקה, השבתה)

### AdminDashboard
דף מנהל:
```typescript
import AdminDashboard from '@views/admin/AdminDashboard';

// השימוש ב-AppRoutes (מוגן - רק למנהלים)
<Route path="/admin" element={<ProtectedRoute roles={[UserRole.ADMIN]}><AdminDashboard /></ProtectedRoute>} />
```

**תכונות:**
- ניהול משתמשים (צפייה, עריכה, השעיה)
- סטטיסטיקות כלליות של המערכת
- ניהול מערכת (מחיקת נתונים, איפוס)
- ניהול שאלות טריוויה
- ניהול AI providers

## דפים נוספים

### UnauthorizedView
דף לא מורשה:
- הודעת שגיאה
- קישור לדף הבית

## ניתוב

### AppRoutes.tsx
הגדרת הנתיבים:
- Routes ציבוריים
- Routes מוגנים
- Protected routes
- Public routes

לדיאגרמות מפורטות, ראו: 
- [דיאגרמת Views מלאה](../DIAGRAMS.md#דיאגרמת-views-מלאה)
- [דיאגרמת Routes/Navigation](../DIAGRAMS.md#דיאגרמת-routesnavigation)
- [דיאגרמת מבנה Frontend](../DIAGRAMS.md#דיאגרמת-מבנה-frontend)

## הפניות

- [ארכיטקטורה כללית](../ARCHITECTURE.md)
- [רכיבי UI](./COMPONENTS.md)
- [ניתוב](./ROUTING.md)
- [דיאגרמת Views מלאה](../DIAGRAMS.md#דיאגרמת-views-מלאה)
- [דיאגרמת Routes/Navigation](../DIAGRAMS.md#דיאגרמת-routesnavigation)
