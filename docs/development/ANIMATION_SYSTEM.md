# מערכת האנימציות - EveryTriv

> הערת ארגון: מסמך זה מספק פירוט יישומי (Implementation-Level) למערכת האנימציות. העקרונות הוויזואליים / טוקנים / וריאנטים מרוכזים ב-`../architecture/DESIGN_SYSTEM.md`, והקישורים להוקסים מתקדמים נמצאים ב-`../architecture/HOOKS_ARCHITECTURE.md`. אין לשכפל טוקנים או קבועים כאן – הפניה בלבד.

## סקירה כללית

מערכת האנימציות של EveryTriv עברה שדרוג מקיף לגרסה 2.0, עם דגש על ביצועים, נגישות ותחזוקה.

## 🚀 תכונות עיקריות

### ביצועים מיטביים
- **requestAnimationFrame** במקום setInterval
- **Throttling** ל-60fps קבוע
- **Hardware acceleration** עם CSS transforms
- **Memory management** עם ניקוי אוטומטי
- **Lazy loading** לאנימציות כבדות

### נגישות מתקדמת
- **prefers-reduced-motion** תמיכה מלאה
- **Keyboard navigation** עם focus indicators
- **High contrast mode** תמיכה
- **Screen reader** תאימות

### ארכיטקטורה משופרת
- **Unified constants** תחת קובץ אחד
- **Custom hooks** לאנימציות מותאמות אישית
- **Performance monitoring** עם useOperationTimer
- **Type safety** מלא עם TypeScript

## 📁 מבנה הקבצים

```
client/src/
├── components/animations/
│   ├── AnimationLibrary.tsx      # קומפוננטים ראשיים
│   ├── AnimationEffects.tsx      # אפקטים מיוחדים
│   ├── AnimatedBackground.tsx    # רקע מונפש
│   └── index.ts                  # ייצוא מאוחד
├── hooks/layers/ui/
│   ├── useOptimizedAnimations.ts # Hook אנימציות מיטבי
│   └── useCustomAnimations.ts    # Hook אנימציות מותאמות אישית
├── constants/
│   └── animation.constants.ts    # קבועים מאוחדים
└── styles/
    └── animations.css            # CSS אנימציות משופר
```

## 🎯 שימוש בסיסי

### Hook אנימציות מיטבי

```tsx
import { useOptimizedAnimations } from '../hooks';

function MyComponent() {
  const { 
    particles, 
    addParticleBurst, 
    clearParticles,
    particleCount,
    maxParticles 
  } = useOptimizedAnimations(score, {
    enableParticles: true,
    particleLimit: 50
  });

  const handleSuccess = () => {
    addParticleBurst(mouseX, mouseY, {
      count: 15,
      colors: ['#10b981', '#34d399'],
      size: 4
    });
  };

  return (
    <div>
      {particles.map(particle => (
        <div key={particle.id} className="particle" />
      ))}
    </div>
  );
}
```

### קומפוננטי אנימציות

```tsx
import { 
  FadeInUp, 
  ScaleIn, 
  HoverScale,
  createStaggerContainer 
} from '../components/animations';

function AnimatedList() {
  const staggerVariants = createStaggerContainer(0.1);

  return (
    <motion.div variants={staggerVariants} initial="hidden" animate="visible">
      <FadeInUp delay={0.1}>
        <h1>כותרת ראשית</h1>
      </FadeInUp>
      
      <ScaleIn delay={0.2}>
        <p>פסקה ראשונה</p>
      </ScaleIn>
      
      <HoverScale>
        <button>כפתור אינטראקטיבי</button>
      </HoverScale>
    </motion.div>
  );
}
```

### Hook אנימציות מותאמות אישית

```tsx
import { useCustomAnimations } from '../hooks';

function CustomAnimationComponent() {
  const { 
    createAnimationLoop, 
    createStaggerAnimation,
    isReducedMotion 
  } = useCustomAnimations();

  useEffect(() => {
    const cleanup = createAnimationLoop((timestamp) => {
      // לוגיקת אנימציה מותאמת אישית
    }, { fps: 30 });

    return cleanup;
  }, [createAnimationLoop]);

  if (isReducedMotion) {
    return <div>גרסה ללא אנימציות</div>;
  }

  return <div>תוכן עם אנימציות</div>;
}
```

## ⚙️ הגדרות ביצועים

### קבועי ביצועים

```typescript
export const PERFORMANCE_CONFIG = {
  FPS: {
    TARGET: 60,
    THROTTLE_MS: 16, // 1000ms / 60fps
  },
  PARTICLES: {
    MAX_COUNT: 100,
    DEFAULT_LIMIT: 50,
    BATCH_SIZE: 10,
  },
  MEMORY: {
    CLEANUP_INTERVAL: 5000, // 5 שניות
    MAX_ANIMATION_DURATION: 10000, // 10 שניות
  },
};
```

### הגדרות אנימציות

```typescript
export const ANIMATION_CONFIG = {
  DURATION: {
    FAST: 0.2,
    NORMAL: 0.6,
    SLOW: 1.0,
  },
  EASING: {
    EASE_OUT: [0.4, 0, 0.2, 1],
    SPRING: { type: 'spring', stiffness: 300, damping: 15 },
  },
  STAGGER: {
    FAST: 0.05,
    NORMAL: 0.1,
    SLOW: 0.2,
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

### ניהול זיכרון

- **Automatic cleanup** של חלקיקים ישנים
- **Particle limit** למניעת עומס
- **Memory monitoring** עם useOperationTimer
- **Efficient updates** עם batch processing

### ביצועים

- **Throttled updates** ל-60fps
- **Hardware acceleration** עם CSS transforms
- **Optimized rendering** עם useMemo ו-useCallback
- **Intersection Observer** לאנימציות scroll

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
.animate-focus-visible:focus-visible {
  outline: 2px solid #667eea;
  outline-offset: 2px;
  animation: pulseGlow 0.3s ease-in-out;
}
```

## 📱 תמיכה במכשירים

### Mobile optimizations

```css
@media (max-width: 768px) {
  .animate-fade-in,
  .animate-slide-up,
  .animate-slide-down {
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

## 🚀 שיפורים עתידיים

### תכונות מתוכננות

- **WebGL particles** לביצועים טובים יותר
- **Animation presets** לתצוגות נפוצות
- **Performance analytics** מפורטים יותר
- **A/B testing** לאנימציות שונות

### אופטימיזציות נוספות

- **Virtual scrolling** לחלקיקים רבים
- **Web Workers** לחישובים כבדים
- **Service Worker** לאנימציות offline
- **Progressive enhancement** למכשירים חלשים

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

---

