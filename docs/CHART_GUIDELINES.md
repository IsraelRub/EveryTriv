# Chart Guidelines - EveryTriv

## מתודולוגיה לבחירת סוג תרשים

### מתי להשתמש בכל סוג תרשים?

#### 🥧 PieChart (עוגה) - התפלגות וחלוקה
**מתי להשתמש:**
- הצגת התפלגות של קטגוריות (נושאים, רמות קושי)
- הצגת חלוקה יחסית (אחוזים)
- כאשר רוצים להדגיש את היחס בין חלקים לשלם
- עד 8-10 קטגוריות (יותר מזה - להשתמש ב-Bar Chart)

**דוגמאות:**
- TopicsDistributionChart - התפלגות נושאים
- DifficultyDistributionChart - התפלגות רמות קושי
- MetricsPieChart - מטריקות כלליות (Success Rate, Consistency)

**Layout**: אין צירים - עוגה מעגלית
- **מרכז**: מציג סיכום (למשל: "Total Games", "Avg Success")
- **פרוסות**: כל פרוסה = קטגוריה עם ערך

#### 📊 DistributionChart (Bar Chart) - השוואה בין קטגוריות
**מתי להשתמש:**
- השוואת ערכים מספריים בין קטגוריות
- הצגת דירוג/מיון (Top 10, Best/Worst)
- כאשר יש יותר מ-10 קטגוריות
- כאשר חשוב לראות את הערכים המדויקים
- הצגת אחוזים או ערכים מוחלטים

**דוגמאות:**
- Success Rate by Difficulty - אחוז הצלחה לפי רמת קושי
- Top Topics by Games Played - נושאים לפי כמות משחקים
- כל השוואה בין קטגוריות עם ערכים מספריים

**Layout: `vertical`** - עמודות אופקיות (משמאל לימין)

#### 📊 StackedBarChart (עמודות מוערמות) - חלוקה פנימית
**מתי להשתמש:**
- הצגת חלוקה פנימית של כל קטגוריה
- השוואה בין שני ערכים בכל קטגוריה (Success vs Failure)
- כאשר רוצים לראות גם את הסכום הכולל וגם את החלוקה הפנימית

**דוגמאות:**
- Success vs Failure by Difficulty - הצלחה לעומת כישלון לפי רמת קושי
- כל מקרה שבו כל קטגוריה מחולקת לחלקים

**Layout: `vertical`** - עמודות אופקיות (משמאל לימין)

#### 📈 TrendChart (Line Chart) - מגמות לאורך זמן
**מתי להשתמש:**
- הצגת שינויים לאורך זמן
- מגמות, התפתחות, ביצועים היסטוריים
- השוואה בין שני מדדים לאורך זמן (Score + Success Rate)

**דוגמאות:**
- Performance Trends Over Time - מגמות ביצועים
- Platform Trends - מגמות פלטפורמה
- כל נתון שיש לו ממד זמן

**Layout: `horizontal`** (ברירת מחדל) - קו אנכי (מלמטה למעלה)

---

## מתודולוגיה טכנית לכיוון תרשימים

### Bar Charts (עמודות) - DistributionChart & StackedBarChart

#### ציר X (XAxis)
- **סוג**: `type='number'` - ערכים מספריים
- **תפקיד**: מציג את הערכים (כמות, אחוז, וכו')
- **Label**: `xAxisLabel` - תיאור הערכים (למשל: "Games Played", "Success Rate (%)")
- **מיקום**: `position='bottom'` - מחוץ לתרשים למטה

#### ציר Y (YAxis)
- **סוג**: `type='category'`, `dataKey='name'` - קטגוריות
- **תפקיד**: מציג את הקטגוריות (נושאים, רמות קושי, וכו')
- **Label**: `yAxisLabel` - תיאור הקטגוריות (למשל: "Topic", "Difficulty")
- **מיקום**: `position='left'` - מחוץ לתרשים משמאל

#### דוגמה:
```tsx
<DistributionChart
  data={topicsChartData}
  xAxisLabel='Games Played'  // XAxis = מספרים (כמות משחקים)
  yAxisLabel='Topic'         // YAxis = קטגוריות (נושאים)
/>
```

### Line Charts (קווים) - TrendChart

#### ציר X (XAxis)
- **סוג**: `dataKey='date'` - תאריכים
- **תפקיד**: מציג את התאריכים
- **Label**: `xAxisLabel` - תיאור התאריכים (אופציונלי)
- **מיקום**: `position='insideBottom'` - בתוך התרשים למטה

#### ציר Y (YAxis)
- **סוג**: `type='number'` - ערכים מספריים
- **תפקיד**: מציג את הערכים (ציון, אחוז הצלחה, וכו')
- **Label**: `scoreLabel` / `successRateLabel` - תיאור הערכים
- **מיקום**: `position='left'` / `position='right'` - מחוץ לתרשים

### Pie Charts (עוגות) - PieChart

**Layout**: אין צירים - עוגה מעגלית
- **מרכז**: מציג סיכום (למשל: "Total Games", "Avg Success")
- **פרוסות**: כל פרוסה = קטגוריה עם ערך
- **Label**: `valueLabel` - תיאור הערכים (ברירת מחדל: "Count")

---

## כללים כלליים

### 1. בחירת סוג תרשים
- **PieChart** → התפלגות, חלוקה יחסית, עד 10 קטגוריות
- **DistributionChart** → השוואה, דירוג, ערכים מדויקים, מעל 10 קטגוריות
- **StackedBarChart** → חלוקה פנימית, שני ערכים לכל קטגוריה
- **TrendChart** → מגמות לאורך זמן, שינויים היסטוריים

### 2. כיוון תרשימים
- **Bar Charts** - תמיד `layout='vertical'` (עמודות אופקיות)
  - XAxis = מספרים (ערכים) ← למטה
  - YAxis = קטגוריות (names) ← משמאל
- **Line Charts** - תמיד `layout='horizontal'` (ברירת מחדל)
  - XAxis = תאריכים ← למטה
  - YAxis = מספרים (ערכים) ← משמאל/מימין

### 3. Labels
- `xAxisLabel` - תיאור ציר X (ערכים/תאריכים)
- `yAxisLabel` - תיאור ציר Y (קטגוריות)
- `valueLabel` - תיאור הערכים (לשימוש ב-tooltip)
- `scoreLabel` / `successRateLabel` - תיאור ערכים ב-TrendChart

### 4. מיקום Labels
- **Bar Charts**: Labels מחוץ לצירים (`position='bottom'` / `position='left'`)
- **Line Charts**: YAxis labels מחוץ לצירים (`position='left'` / `position='right'`)
- **Margins**: מספיק מקום ל-labels (bottom: 30px, left/right: 50px)

### 5. עקביות
- כל Bar Charts משתמשים באותה מתודולוגיה
- כל Line Charts משתמשים באותה מתודולוגיה
- Labels תמיד תואמים לציר הנכון
- גבהים עקביים: SMALL (250px), DEFAULT (300px), LARGE (350px), EXTRA_LARGE (400px)

### 6. תרשימים קטנים
- תרשימים קטנים (SMALL) יכולים להיות בשורה אחת במסכים גדולים
- השתמש ב-`grid grid-cols-1 lg:grid-cols-2` לתרשימים קטנים
- תרשימים גדולים (LARGE+) תמיד במרכז בגודל מלא
