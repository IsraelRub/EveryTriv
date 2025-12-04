# מערכת העיצוב - EveryTriv

## סקירה כללית

מערכת העיצוב של EveryTriv מספקת עקביות ויזואלית ונוחות שימוש בכל רכיבי האפליקציה. המערכת מבוססת על Tailwind CSS עם רכיבים מותאמים אישית וספריית אייקונים מאוחדת.

### קשר למסמכי פיתוח (Implementation)
רכיבי אינטראקציה (אנימציה ואודיו) מתועדים ברמת יישום ב:
- `./ANIMATION_SYSTEM.md` – לולאות, hooks ביצועים, התאמות reduced motion
- `./AUDIO_SYSTEM.md` – שכבות AudioService, קטגוריות צליל, אסטרטגיות טעינה

תיעוד זה נשאר מקור האמת לעקרונות עיצוב, טוקנים, דפוסי קומפוננטים ונגישות. מסמכי הפיתוח מפנים לכאן ולא משכפלים טוקנים.

## עקרונות עיצוב

### 1. עקביות
- שימוש בקבועי צבע, טיפוגרפיה ומרווחים עקביים
- רכיבים ניתנים לשימוש חוזר
- התנהגות אחידה בכל האפליקציה

### 2. נגישות
- תמיכה ב-WCAG 2.1 AA
- ניגודיות צבעים נכונה
- ניווט מקלדת
- תמיכה בקורא מסך

### 3. ביצועים
- אופטימיזציה של אנימציות
- טעינה הדרגתית של רכיבים
- תמיכה במצבי ביצועים נמוכים

### 4. רספונסיביות
- עיצוב מותאם לכל הגדלי מסך
- התאמה למובייל תחילה
- פריסה גמישה

## מבנה קבצי Styles

```
client/src/
├── index.css                    # קובץ CSS ראשי (מייבא global.css)
└── styles/
    └── global.css               # קובץ CSS גלובלי עם Tailwind ו-CSS Variables
```

## טוקנים עיצוביים

### CSS Variables (Design Tokens)

כל הטוקנים העיצוביים מוגדרים ב-`styles/global.css` כ-CSS Variables ב-`:root`:

#### צבעים (Colors)
- **Background & Foreground:**
  - `--background`: 222 47% 11%
  - `--foreground`: 210 40% 98%
  - `--card`, `--card-foreground`
  - `--popover`, `--popover-foreground`

- **Primary Colors:**
  - `--primary`: 217 91% 60%
  - `--primary-foreground`: 222 47% 11%
  - `--color-primary-100` עד `--color-primary-900` (shades)

- **Secondary Colors:**
  - `--secondary`: 292 84% 61%
  - `--secondary-foreground`: 210 40% 98%
  - `--color-secondary-100` עד `--color-secondary-900` (shades)

- **Semantic Colors:**
  - `--accent`: 160 84% 39%
  - `--destructive`: 0 84% 60%
  - `--muted`: 217 33% 17%
  - `--success`, `--warning`, `--error` (100, 300, 500, 700 shades)

- **Glass Morphism:**
  - `--glass-light`: rgba(255, 255, 255, 0.08)
  - `--glass-medium`: rgba(255, 255, 255, 0.12)
  - `--glass-strong`: rgba(255, 255, 255, 0.18)
  - `--glass-border`: rgba(255, 255, 255, 0.15)
  - `--glass-border-strong`: rgba(255, 255, 255, 0.25)

#### Gradients
- `--gradient-primary`: linear-gradient(135deg, hsl(217 91% 60%) 0%, hsl(292 84% 61%) 100%)
- `--gradient-secondary`: linear-gradient(135deg, hsl(160 84% 39%) 0%, hsl(186 94% 42%) 100%)
- `--gradient-accent`: linear-gradient(135deg, hsl(38 92% 50%) 0%, hsl(0 84% 60%) 100%)
- `--gradient-glass`: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)
- `--gradient-text`: linear-gradient(135deg, hsl(217 91% 60%) 0%, hsl(186 94% 70%) 50%, hsl(292 84% 61%) 100%)
- `--gradient-background`: linear-gradient(135deg, hsl(222 47% 11%) 0%, hsl(222 47% 8%) 50%, hsl(230 50% 5%) 100%)

#### Spacing
- `--space-xs`: 0.25rem
- `--space-sm`: 0.5rem
- `--space-md`: 1rem
- `--space-lg`: 1.5rem
- `--space-xl`: 2rem
- `--space-2xl`: 3rem
- `--space-3xl`: 4rem

#### Border Radius
- `--radius-sm`: 0.25rem
- `--radius-md`: 0.5rem
- `--radius-lg`: 1rem
- `--radius-xl`: 1.5rem
- `--radius-full`: 9999px

#### Shadows
- `--shadow-sm`: 0 1px 2px 0 rgba(0, 0, 0, 0.3)
- `--shadow-md`: 0 4px 6px -1px rgba(0, 0, 0, 0.4)
- `--shadow-lg`: 0 10px 15px -3px rgba(0, 0, 0, 0.4)
- `--shadow-xl`: 0 20px 25px -5px rgba(0, 0, 0, 0.4)
- `--shadow-glow`: 0 0 50px rgba(59, 130, 246, 0.3)
- `--shadow-glow-secondary`: 0 0 50px rgba(168, 85, 247, 0.3)
- `--shadow-card`: 0 4px 20px rgba(59, 130, 246, 0.15)

#### Typography
- **Font Families:**
  - `--font-family-sans`: 'Inter', 'Segoe UI', Arial, sans-serif
  - `--font-family-mono`: 'JetBrains Mono', 'Fira Code', monospace

- **Font Sizes:**
  - `--font-size-xs`: 0.75rem
  - `--font-size-sm`: 0.875rem
  - `--font-size-md`: 1rem
  - `--font-size-lg`: 1.125rem
  - `--font-size-xl`: 1.25rem
  - `--font-size-2xl`: 1.5rem
  - `--font-size-3xl`: 1.875rem
  - `--font-size-4xl`: 2.25rem

- **Font Weights:**
  - `--font-weight-light`: 300
  - `--font-weight-normal`: 400
  - `--font-weight-medium`: 500
  - `--font-weight-semibold`: 600
  - `--font-weight-bold`: 700

#### Timing & Easing
- **Durations:**
  - `--duration-fast`: 0.2s
  - `--duration-normal`: 0.3s
  - `--duration-slow`: 0.5s
  - `--duration-slower`: 1s

- **Easing Functions:**
  - `--ease-out`: cubic-bezier(0, 0, 0.2, 1)
  - `--ease-in`: cubic-bezier(0.4, 0, 1, 1)
  - `--ease-in-out`: cubic-bezier(0.4, 0, 0.2, 1)
  - `--ease-bounce`: cubic-bezier(0.68, -0.55, 0.265, 1.55)
  - `--ease-elastic`: cubic-bezier(0.175, 0.885, 0.32, 1.275)

#### Z-Index Layers
- `--z-dropdown`: 1000
- `--z-sticky`: 1020
- `--z-fixed`: 1030
- `--z-modal-backdrop`: 1040
- `--z-modal`: 1050
- `--z-popover`: 1060
- `--z-tooltip`: 1070

#### Layout
- `--navigation-height`: 4rem (5rem ב-xl ומעלה)
- `--auth-section-min-height`: calc(100vh - var(--navigation-height))

### Tailwind CSS Integration

הפרויקט משתמש ב-Tailwind CSS עם הגדרות מותאמות אישית:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

כל ה-CSS Variables מוגדרים ב-`@layer base` ומשולבים עם Tailwind דרך `@apply` directives.

## רכיבי UI בסיסיים

דוגמאות מלאות + טיפוסי Props ווריאנטים נמצאים ב-`./COMPONENTS.md`.

| עיקרון | כלל |
|--------|-----|
| Separation | אין לוגיקת דומיין ברכיב Presentational |
| Tokens First | שימוש עקבי בטוקנים (צבע, טיפוגרפיה, מרווח) |
| Accessibility | תמיכה ב-Keyboard + aria + Reduced Motion |
| Controlled Variants | וריאנטים מוצהרים (size, variant, state) |
| Minimal DOM | ללא עטיפות מיותרות לביצועים |

דוגמאות קוד מפורטות נמצאות ב-`./COMPONENTS.md`.

## רכיבי CSS מותאמים אישית

כל הרכיבים המותאמים אישית מוגדרים ב-`@layer components` ב-`styles/global.css`:

### Glass Morphism
- `.glass` - אפקט זכוכית בסיסי עם backdrop-filter
- `.glass-strong` - אפקט זכוכית חזק יותר
- `.glass-morphism` - אפקט זכוכית מורפיזם

### Buttons
- `.btn` - כפתור בסיסי
- `.btn-primary` - כפתור ראשי עם gradient
- `.btn-secondary` - כפתור משני עם gradient
- `.btn-accent` - כפתור accent עם gradient
- `.btn-glass` - כפתור עם אפקט זכוכית
- `.btn-sm`, `.btn-lg` - גדלים שונים
- `.btn-enhanced` - כפתור משופר עם אפקט shimmer

### Inputs
- `.input` - שדה קלט עם אפקט זכוכית

### Text Effects
- `.text-gradient` - טקסט עם gradient

### Layout Components
- `.app-shell` - מעטפת האפליקציה
- `.app-main` - תוכן ראשי
- `.auth-view-layout` - פריסת מסכי אימות
- `.grid-content`, `.grid-cards`, `.grid-stats`, `.grid-form`, `.grid-game`, `.grid-balanced`, `.grid-compact`, `.grid-auto-fit` - פריסות grid שונות

### Accessibility
- `.sr-only` - טקסט נסתר לקוראי מסך (screen reader only)

### Game-Specific
- `.game-over` - סגנון לסיום משחק
- `.game-timer` - טיימר משחק
- `.game-info` - מידע משחק

### Hardware Acceleration
- `.animate-hardware-accelerated` - אופטימיזציה לביצועים עם will-change

## אנימציות CSS

כל האנימציות מוגדרות ב-`@layer utilities` ב-`styles/global.css`:

### Keyframes
- `fadeIn` - אנימציית fade in
- `slideUp` - אנימציית slide up
- `scaleIn` - אנימציית scale in
- `spin` - אנימציית סיבוב
- `pulse` - אנימציית pulse
- `pulseGlow` - אנימציית pulse glow

### Animation Classes
- `.animate-fade-in` - אנימציית fade in
- `.animate-slide-up` - אנימציית slide up
- `.animate-scale-in` - אנימציית scale in
- `.animate-spin` - אנימציית סיבוב
- `.animate-pulse` - אנימציית pulse

### Reduced Motion Support

הפרויקט תומך ב-`prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

## שימוש ב-CSS Variables

### דוגמה לשימוש ב-Tailwind
```typescript
<div className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]">
  Content
</div>
```

### דוגמה לשימוש ב-CSS
```css
.custom-component {
  background: var(--gradient-primary);
  padding: var(--space-md);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  transition: all var(--duration-normal) var(--ease-out);
}
```

## רכיבי UI בסיסיים

דוגמאות קוד מפורטות נמצאות ב-`./COMPONENTS.md`.

**דוגמה לרכיב Button:**
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  className,
  disabled,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
    secondary: 'bg-secondary-600 text-white hover:bg-secondary-700 focus:ring-secondary-500',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-primary-500',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
    danger: 'bg-error text-white hover:bg-red-700 focus:ring-red-500',
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={cn(
        baseClasses,
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {icon && !loading && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};
```

### Card Component
```typescript
import React from 'react';
import { cn } from '@/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  className,
  ...props
}) => {
  const baseClasses = 'rounded-lg border border-gray-200 bg-white';
  
  const variants = {
    default: 'shadow-sm',
    elevated: 'shadow-lg',
    outlined: 'border-2',
  };
  
  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={cn(
        baseClasses,
        variants[variant],
        paddings[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
```

### Modal Component
```typescript
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/utils';
import { IconX } from './icons/IconX';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
}) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div
        className={cn(
          'relative bg-white rounded-lg shadow-xl w-full mx-4',
          sizes[size]
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 id="modal-title" className="text-lg font-semibold text-gray-900">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="סגור"
            >
              <IconX className="w-5 h-5" />
            </button>
          </div>
        )}
        
        {/* Content */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};
```

## ספריית אייקונים

### IconLibrary
```typescript
import React from 'react';

// אייקונים בסיסיים
export const IconHome: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

export const IconUser: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

export const IconTrophy: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>
);

export const IconSettings: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

// אייקונים למשחק
export const IconPlay: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export const IconPause: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export const IconCheck: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

export const IconX: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);
```

**הערה:** אנימציות CSS מוגדרות ב-`styles/global.css` (ראו סעיף "אנימציות CSS" למעלה). אנימציות React מתועדות ב-`./ANIMATION_SYSTEM.md`.

## תמיכה בנגישות

### ARIA Labels
```typescript
// aria-labels.ts
export const ariaLabels = {
  // ניווט
  navigation: 'ניווט ראשי',
  menuToggle: 'פתח/סגור תפריט',
  
  // משחק
  startGame: 'התחל משחק',
  pauseGame: 'השהה משחק',
  endGame: 'סיים משחק',
  
  // שאלות
  questionText: 'טקסט השאלה',
  answerOption: 'אפשרות תשובה',
  submitAnswer: 'שלח תשובה',
  
  // תוצאות
  scoreDisplay: 'תצוגת ניקוד',
  timerDisplay: 'תצוגת טיימר',
  
  // הגדרות
  settingsMenu: 'תפריט הגדרות',
  volumeControl: 'בקרת עוצמת קול',
  themeToggle: 'החלף ערכת נושא',
} as const;
```

### Focus Management
דוגמה למימוש focus trap:
```typescript
import { useRef, useEffect } from 'react';

// דוגמה קונספטואלית - לא מימוש קיים בפרויקט
export const useFocusTrap = (isActive: boolean) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    // Type assertion נדרש כאן כי querySelectorAll מחזיר NodeListOf<Element>
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive]);

  return containerRef;
};
```

## תמיכה במצבי ביצועים נמוכים

### Reduced Motion
```typescript
import { useEffect, useState } from 'react';

export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
};
```

### Performance Optimized Components
```typescript
import { memo } from 'react';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
}

export const AnimatedCard = memo<AnimatedCardProps>(({ children, className }) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div
      className={`${className} ${
        prefersReducedMotion
          ? 'transition-none'
          : 'transition-all duration-300 ease-in-out hover:scale-105'
      }`}
    >
      {children}
    </div>
  );
});
```

## שימוש במערכת העיצוב

### דוגמה לרכיב מורכב
```typescript
import React from 'react';
import { Button } from './Button';
import { Card } from './Card';
import { IconTrophy, IconPlay } from './icons';

interface GameCardProps {
  title: string;
  description: string;
  difficulty: string;
  onPlay: () => void;
  score?: number;
}

export const GameCard: React.FC<GameCardProps> = ({
  title,
  description,
  difficulty,
  onPlay,
  score,
}) => {
  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
          {score && (
            <div className="flex items-center text-yellow-600">
              <IconTrophy className="w-5 h-5 mr-1" />
              <span className="font-medium">{score}</span>
            </div>
          )}
        </div>
        
        <p className="text-gray-600 mb-4">{description}</p>
        
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {difficulty}
          </span>
          
          <Button
            onClick={onPlay}
            icon={<IconPlay className="w-4 h-4" />}
            size="sm"
          >
            שחק
          </Button>
        </div>
      </div>
    </Card>
  );
};
```
 
