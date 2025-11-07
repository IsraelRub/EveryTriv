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

## טוקנים עיצוביים
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
import { cn } from '../utils/cn';

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
import { cn } from '../utils/cn';
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

## אנימציות

### CSS Animations
```css
/* animations.css */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideIn {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(0);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes bounce {
  0%, 20%, 53%, 80%, 100% {
    transform: translate3d(0, 0, 0);
  }
  40%, 43% {
    transform: translate3d(0, -30px, 0);
  }
  70% {
    transform: translate3d(0, -15px, 0);
  }
  90% {
    transform: translate3d(0, -4px, 0);
  }
}

.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}

.animate-slide-in {
  animation: slideIn 0.3s ease-out;
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.animate-bounce {
  animation: bounce 1s infinite;
}
```

### React Animation Hooks
```typescript
import { useState, useEffect } from 'react';

export const useFadeIn = (delay: number = 0) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return isVisible;
};

export const useSlideIn = (direction: 'left' | 'right' | 'up' | 'down' = 'up') => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const getTransform = () => {
    switch (direction) {
      case 'left':
        return isVisible ? 'translateX(0)' : 'translateX(-100%)';
      case 'right':
        return isVisible ? 'translateX(0)' : 'translateX(100%)';
      case 'up':
        return isVisible ? 'translateY(0)' : 'translateY(100%)';
      case 'down':
        return isVisible ? 'translateY(0)' : 'translateY(-100%)';
      default:
        return 'translateY(0)';
    }
  };

  return {
    transform: getTransform(),
    transition: 'transform 0.3s ease-out',
  };
};
```

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
```typescript
import { useRef, useEffect } from 'react';

export const useFocusTrap = (isActive: boolean) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

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
 
