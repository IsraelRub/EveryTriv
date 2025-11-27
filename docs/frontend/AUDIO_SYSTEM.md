# מערכת האודיו והצלילים - EveryTriv

> **הערת ארגון**: תיעוד זה מדגיש היבטי יישום (טעינה, ניהול זיכרון, מבנה קבצים). היבטי UI / עיצוב / נגישות משלימים מופיעים ב-[מערכת העיצוב](./DESIGN_SYSTEM.md). קבועים גלובליים (מפת מפתחות, קטגוריות) מנוהלים במקום יחיד.

## סקירה כללית

מערכת האודיו ב-EveryTriv מספקת ניהול מרכזי לכל הצלילים, המוזיקה והאודיו במערכת. המערכת מתוכננת להיות יעילה, מהירה ונוחה לשימוש.

## ארכיטקטורה

### רכיבים עיקריים

1. **AudioService** (`client/src/services/audio.service.ts`)
   - ניהול מרכזי של כל קבצי האודיו
   - טעינה על דרישה (lazy loading)
   - ניהול נפח היררכי: master volume, category volumes, ו-individual sound volumes
   - תמיכה בקטגוריות שונות של צלילים
   - שמירת מצב השתקה ב-localStorage

2. **AudioContext** (`client/src/hooks/contexts/AudioContext.tsx`)
   - ניהול מצב האודיו ברמת האפליקציה
   - שמירת העדפות משתמש
   - ניטור ביצועים

3. **AudioControls** (`client/src/components/audio/AudioControls.tsx`)
   - ממשק משתמש לשליטה באודיו
   - כפתור השתקה/הפעלה
   - סליידר נפח

### קטגוריות צלילים

```typescript
export enum AudioCategory {
	UI = 'UI',           // צלילי ממשק משתמש
	GAME = 'GAME',       // צלילי משחק כלליים
	MUSIC = 'MUSIC',     // מוזיקת רקע
	EFFECTS = 'EFFECTS', // אפקטים מיוחדים
	GAMEPLAY = 'GAMEPLAY', // צלילי משחק ספציפיים
	ACHIEVEMENT = 'ACHIEVEMENT', // צלילי הישגים
}
```

## קבצי אודיו

### מבנה תיקיות

```
client/public/assets/sounds/
├── ui/                # צלילי ממשק משתמש
│   ├── click.wav      # לחיצה על כפתור
│   ├── hover.wav      # מעבר עכבר
│   ├── pop.wav        # הצלחה/הודעה
│   ├── swipe.wav      # החלקה/אזהרה
│   └── whoosh.wav     # שינוי עמוד/תפריט
├── gameplay/          # צלילי משחק
│   ├── beep.wav       # צליל התראה
│   ├── correct-answer.wav # תשובה נכונה
│   └── wrong-answer.wav  # תשובה שגויה
├── music/             # מוזיקת רקע
│   ├── general.mp3    # מוזיקה כללית
│   └── game.mp3       # מוזיקת משחק
└── achievements/      # צלילי הישגים
    └── win.wav        # הישג/ניצחון
```

### הנחיות לקבצים

#### צלילי ממשק משתמש
- **משך**: קצר מאוד (0.1-0.5 שניות)
- **פורמט**: WAV
- **איכות**: גבוהה
- **סגנון**: עדין, לא פולשני

#### צלילי משחק
- **משך**: 0.5-2 שניות
- **פורמט**: WAV
- **איכות**: גבוהה
- **סגנון**: ברור, מובחן, מתגמל

#### מוזיקת רקע
- **משך**: 2-3 דקות (קבצים יסתובבו)
- **פורמט**: MP3
- **איכות**: 128-192 kbps
- **סגנון**: אמביינט, לא מסיח דעת

#### צלילי הישגים
- **משך**: 1-3 שניות
- **פורמט**: WAV
- **איכות**: גבוהה
- **סגנון**: חגיגי, מעודד, מתגמל

## שימוש בקוד

### הוספת צליל חדש

1. הוסף את הקובץ לתיקייה המתאימה
2. עדכן את `AudioKey` enum ב-`audio.constants.ts`
3. הוסף את הנתיב ל-`AUDIO_PATHS`
4. הוסף את הקטגוריה ל-`AUDIO_CATEGORIES`
5. הגדר תצורה ב-`AUDIO_CONFIG`

### דוגמה לשימוש

```typescript
import { useAudio } from '@/hooks';
import { AudioKey } from '@/constants';

const MyComponent = () => {
	const audioService = useAudio();
	
	const handleSuccess = () => {
		audioService.play(AudioKey.SUCCESS);
	};
	
	return <button onClick={handleSuccess}>הצלחה!</button>;
};
```

## ניהול נפח

המערכת משתמשת במערכת נפח היררכית:

1. **Master Volume** - נפח כללי לכל האודיו (0-1)
2. **Category Volume** - נפח לכל קטגוריה (UI, MUSIC, EFFECTS וכו')
3. **Sound Volume** - נפח ספציפי לכל צליל

הנפח הסופי מחושב כך: `soundVolume * categoryVolume * masterVolume`

### API לשליטה בנפח

```typescript
// הגדרת נפח כללי (master volume)
audioService.setMasterVolume(0.7); // או setVolume(0.7)

// השתקה/הפעלה
audioService.mute();
audioService.unmute();
audioService.toggleMute(); // מחזיר את מצב ההשתקה החדש

// בדיקת מצב
const isEnabled = audioService.isEnabled; // true אם לא מושתק
const currentVolume = audioService.volume; // מחזיר 0 אם מושתק, אחרת masterVolume
```

### שמירת מצב

המצב של האודיו נשמר ב-localStorage:
- `AUDIO_MUTED` - מצב השתקה
- `AUDIO_VOLUME` - נפח כללי

## ביצועים וייעול

### אסטרטגיות טעינה

1. **טעינה מראש של צלילים בסיסיים**
   - צלילי לחיצה בסיסיים
   - צלילי מעבר עכבר
   - מוזיקת רקע
   - משתמש ב-`preload='metadata'` לטעינה מהירה

2. **טעינה על דרישה**
   - צלילי משחק ספציפיים
   - צלילי הישגים
   - צלילי התראה

### ניהול זיכרון

- ניקוי אוטומטי של צלילים שסיימו לנגן (cloned elements)
- שימוש ב-cloning לצלילים חופפים (sound effects)
- מוזיקה משתמשת ב-element יחיד ומתחילה מההתחלה
- ניטור שימוש בזיכרון

## מקורות מומלצים

### מוזיקה
- [Pixabay Music](https://pixabay.com/music/) - מוזיקה חופשית, ללא צורך בייחוס
- [Free Music Archive](https://freemusicarchive.org/) - מוזיקה ברישיון Creative Commons
- [Incompetech](https://incompetech.com/music/royalty-free/music.html) - מוזיקה חופשית

### אפקטי קול
- [Freesound](https://freesound.org/) - ספרייה גדולה של אפקטי קול
- [OpenGameArt](https://opengameart.org/) - אפקטי קול בסגנון משחק
- [Pixabay Sound Effects](https://pixabay.com/sound-effects/) - אפקטי קול חופשיים
- [Zapsplat](https://www.zapsplat.com/) - אפקטי קול מקצועיים

## שיקולי רישיון

וודא שכל קבצי האודיו בפרויקט הם:
- נחלת הכלל (Public Domain)
- מורשים לשימוש מסחרי (אם זה פרויקט מסחרי)
- מיוחסים כראוי אם הרישיון דורש זאת

## תחזוקה ועדכונים

### בדיקות תקופתיות

1. **איכות קול**: וודא שכל הצלילים נשמעים ברור
2. **גודל קבצים**: שמור על קבצים יעילים בגודל
3. **תאימות**: בדוק תמיכה בדפדפנים שונים

### עדכון מערכת

1. **גיבוי**: שמור גיבוי של כל קבצי האודיו
2. **תיעוד**: עדכן תיעוד זה עם שינויים
3. **בדיקות**: בדוק שהכל עובד לאחר שינויים

## פתרון בעיות

### בעיות נפוצות

1. **צלילים לא נשמעים**
   - בדוק שהמשתמש לחץ על האתר
   - וודא שהאודיו לא מושתק
   - בדוק שהקבצים קיימים בנתיב הנכון

2. **עיכובים בהשמעה**
   - בדוק גודל קבצים
   - וודא טעינה מראש של צלילים בסיסיים
   - בדוק ביצועי הדפדפן

3. **בעיות זיכרון**
   - בדוק ניקוי אוטומטי של צלילים
   - וודא שימוש יעיל ב-cloning
   - ניטור שימוש בזיכרון
