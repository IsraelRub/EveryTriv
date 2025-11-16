# מערכת האנימציות - EveryTriv

> **הערת ארגון**: תיעוד זה מספק פירוט יישומי (Implementation-Level) למערכת האנימציות. העקרונות הוויזואליים / טוקנים / וריאנטים מרוכזים ב-[מערכת העיצוב](./DESIGN_SYSTEM.md), והקישורים להוקסים מתקדמים נמצאים ב-[ארכיטקטורת Hooks](./HOOKS.md). טוקנים וקבועים מנוהלים במקום יחיד.

## סקירה כללית

מערכת האנימציות של EveryTriv עברה שדרוג מקיף לגרסה 2.0, עם דגש על ביצועים, נגישות ותחזוקה.

## 🚀 תכונות עיקריות

### ביצועים מיטביים
- **Hardware acceleration** עם CSS transforms
- **Framer Motion** לאנימציות יעילות
- **CSS animations** לאנימציות בסיסיות מהירות
- **Optimized rendering** עם React optimizations

### נגישות מתקדמת
- **prefers-reduced-motion** תמיכה מלאה
- **Keyboard navigation** עם focus indicators
- **High contrast mode** תמיכה
- **Screen reader** תאימות

### ארכיטקטורה משופרת
- **constants** תחת קובץ אחד
- **Framer Motion variants** לאנימציות מתקדמות
- **CSS animations** לאנימציות בסיסיות
- **Type safety** מלא עם TypeScript

## 📁 מבנה הקבצים

```
client/src/
├── components/animations/
│   ├── AnimationLibrary.tsx      # וריאנטים של Framer Motion
│   └── index.ts                  # ייצוא מאוחד
├── constants/ui/
│   └── animation.constants.ts    # קבועים מאוחדים
└── styles/
    └── global.css                # CSS אנימציות בסיסיות
```

## 🎯 שימוש בסיסי

### Framer Motion Variants

```tsx
import { motion } from 'framer-motion';
import { fadeInUp, scaleIn, hoverScale, createStaggerContainer } from '../components/animations';

function AnimatedList() {
  const staggerVariants = createStaggerContainer(0.1);

  return (
    <motion.div variants={staggerVariants} initial="hidden" animate="visible">
      <motion.h1 variants={fadeInUp}>
        כותרת ראשית
      </motion.h1>
      
      <motion.p variants={scaleIn}>
        פסקה ראשונה
      </motion.p>
      
      <motion.button variants={hoverScale} whileHover="hover">
        כפתור אינטראקטיבי
      </motion.button>
    </motion.div>
  );
}
```

### CSS Animations

```tsx
function MyComponent() {
  return (
    <div className="animate-fade-in">
      <div className="animate-slide-up">תוכן מופיע מלמטה</div>
      <div className="animate-scale-in">תוכן מתרחב</div>
      <div className="animate-spin">איקון מסתובב</div>
      <div className="animate-pulse">תוכן מנצנץ</div>
    </div>
  );
}
```

## ⚙️ הגדרות ביצועים

### הגדרות אנימציות

```typescript
export const ANIMATION_CONFIG = {
  DURATION: {
    NORMAL: 0.6,
    SLOW: 1.0,
  },
  EASING: {
    EASE_OUT: [0.4, 0, 0.2, 1],
  },
};

export const ACCESSIBILITY_CONFIG = {
  REDUCED_MOTION: {
    ENABLED: true,
    SCALE_FACTOR: 0.01,
  },
};
```

## 🎨 CSS אנימציות

### שימוש בסיסי

```css
/* אנימציה בסיסית */
.animate-fade-in {
  animation: fadeIn 0.8s cubic-bezier(0.4, 0, 0.2, 1) both;
  composes: animate-hardware-accelerated;
}

/* אנימציה עם hardware acceleration */
.animate-hardware-accelerated {
  will-change: transform, opacity;
  transform: translateZ(0);
  backface-visibility: hidden;
}
```

### תמיכה ב-reduced motion

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## 🔧 אופטימיזציות

### ביצועים

- **Hardware acceleration** עם CSS transforms
- **Optimized rendering** עם useMemo ו-useCallback
- **Framer Motion** לאנימציות יעילות
- **CSS animations** לאנימציות בסיסיות מהירות

## ♿ נגישות

### תמיכה ב-reduced motion

```typescript
// בדיקה אוטומטית של העדפות המשתמש
const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// התאמת אנימציות בהתאם
if (isReducedMotion) {
  // אנימציות מהירות מאוד או ללא אנימציות
}
```

### תמיכה ב-keyboard navigation

```css
.focus-visible:focus-visible {
  outline: 2px solid var(--color-primary-500);
  outline-offset: 2px;
}
```

## 📱 תמיכה במכשירים

### Mobile optimizations

```css
@media (max-width: 768px) {
  .animate-fade-in,
  .animate-slide-up {
    animation-duration: 0.4s; /* מהיר יותר במובייל */
  }
}
```

### High refresh rate displays

```css
@media (min-resolution: 120dpi) {
  .animate-hardware-accelerated {
    will-change: transform, opacity;
    transform: translateZ(0);
  }
}
```

## 🧪 בדיקות

### בדיקת ביצועים

```typescript
// בדיקת FPS
const fps = 1000 / (timestamp - lastTimestamp);

// בדיקת זיכרון
const memoryUsage = performance.memory?.usedJSHeapSize || 0;

// בדיקת זמן אנימציה
const animationTime = performance.now() - startTime;
```

### בדיקת נגישות

```typescript
// בדיקת reduced motion
const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const isReducedMotion = mediaQuery.matches;

// בדיקת high contrast
const highContrast = window.matchMedia('(prefers-contrast: high)').matches;
```

## 📚 משאבים נוספים

- [Framer Motion Documentation](https://www.framer.com/motion/)
- [React Spring Documentation](https://react-spring.dev/)
- [Web Animations API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API)
- [CSS Animations Best Practices](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Animations/Using_CSS_animations)

## 🤝 תרומה

לשיפור מערכת האנימציות:

1. בדוק ביצועים עם DevTools Performance
2. בדוק נגישות עם Lighthouse
3. בדוק תאימות במכשירים שונים
4. הוסף unit tests לאנימציות חדשות
5. תיעד שינויים ב-API
