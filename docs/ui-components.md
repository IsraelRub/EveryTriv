# UI Component System in EveryTriv

This document outlines the UI component architecture in the EveryTriv application, including component organization, styling approach, and best practices for creating consistent and reusable UI elements.

## Table of Contents

1. [Overview](#overview)
2. [Component Organization](#component-organization)
3. [Styling Approach](#styling-approach)
4. [Base UI Components](#base-ui-components)
5. [Animation Components](#animation-components)
6. [Layout Components](#layout-components)
7. [Advanced Components](#advanced-components)
8. [Best Practices](#best-practices)

## Overview

EveryTriv uses a modular UI component system built with React, TypeScript, and Tailwind CSS. The application leverages composition to create complex UI elements from simpler building blocks, ensuring consistency and reusability throughout the application.

## Component Organization

The UI components are organized in the following structure:

```
src/
└── shared/
    └── components/
        ├── ui/          # Base UI components (buttons, inputs, cards)
        ├── animations/  # Animation-related components
        ├── layout/      # Layout components (containers, grids)
        ├── icons/       # Icon components
        └── ...          # Feature-specific components
```

### Component Types

1. **Base UI Components**: Fundamental building blocks like buttons, inputs, and cards
2. **Animation Components**: Components that provide animation effects
3. **Layout Components**: Components that handle layout and structure
4. **Composite Components**: Components that combine multiple base components
5. **Page Components**: Top-level components for specific views

## Styling Approach

The application uses a combination of:

1. **Tailwind CSS**: For utility-based styling
2. **CSS Modules**: For component-specific styles
3. **Global CSS**: For application-wide styles
4. **cn utility**: For conditional class name composition

### The `cn` Utility

The `cn` utility (based on `tailwind-merge`) is used for composing class names:

```typescript
// src/shared/utils/cn.ts
import { twMerge } from 'tailwind-merge';
import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### Glass Morphism

The application uses a glass morphism effect for UI elements:

```css
.glass-morphism {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
}
```

## Base UI Components

### Button Component

The Button component includes various variants and states:

```tsx
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  isGlassy?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, isGlassy, ...props }, ref) => {
    // Implementation
  }
);
```

### Input Component

The Input component is built on MUI Base:

```tsx
export interface InputProps extends BaseInputProps {
  size?: 'sm' | 'md' | 'lg';
  isGlassy?: boolean;
  error?: boolean;
  label?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, size = 'md', isGlassy = false, error, ...props }, ref) => {
    // Implementation
  }
);
```

### Select Component

```tsx
export interface SelectProps extends BaseSelectProps<string> {
  size?: 'sm' | 'md' | 'lg';
  isGlassy?: boolean;
  error?: boolean;
  label?: string;
  options: Array<{ value: string; label: string }>;
}

export const Select = forwardRef<HTMLButtonElement, SelectProps>(
  ({ className, size = 'md', isGlassy = false, error, options, ...props }, ref) => {
    // Implementation
  }
);
```

### Card Component

```tsx
export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  isGlassy?: boolean;
  withGlow?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, isGlassy = true, withGlow = false, ...props }, ref) => {
    // Implementation
  }
);

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(/* ... */);
export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(/* ... */);
export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(/* ... */);
```

### Modal Component

```tsx
export interface ModalProps extends BaseModalProps {
  size?: 'sm' | 'md' | 'lg';
  isGlassy?: boolean;
}

export const Modal = forwardRef<HTMLDivElement, ModalProps>(
  ({ children, className, isGlassy = true, size = 'md', ...props }, ref) => {
    // Implementation
  }
);
```

## Animation Components

The application uses Framer Motion for animations:

### Animation Variants

```tsx
// Fade and slide variants
export const fadeInVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
};

// Scale variants
export const popVariants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { type: 'spring', stiffness: 300, damping: 15 },
  },
};

// Stagger children animation
export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};
```

### Animation Effect Components

```tsx
// Confetti effect for achievements
export const ConfettiEffect = ({ isVisible }: { isVisible: boolean }) => {
  // Implementation
};

// Pulse animation effect
export const PulseEffect = ({ children }: { children: ReactNode }) => (
  <motion.div
    animate={{
      scale: [1, 1.05, 1],
      boxShadow: [
        '0 0 0 0 rgba(102, 126, 234, 0)',
        '0 0 0 15px rgba(102, 126, 234, 0.3)',
        '0 0 0 0 rgba(102, 126, 234, 0)',
      ],
    }}
    transition={{
      duration: 1.5,
      repeat: Infinity,
      repeatType: 'loop',
    }}
  >
    {children}
  </motion.div>
);

// Floating card effect
export const FloatingCard = ({ children }: { children: ReactNode }) => (
  <motion.div
    animate={{
      y: [0, -10, 0],
    }}
    transition={{
      duration: 3,
      repeat: Infinity,
      repeatType: 'reverse',
      ease: 'easeInOut',
    }}
  >
    {children}
  </motion.div>
);
```

### Animated Background

```tsx
export const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({ children }) => {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated gradient orbs */}
      <motion.div
        className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full bg-gradient-to-r from-[#667eea] to-[#764ba2] opacity-30 blur-3xl"
        animate={{
          x: [0, 100, -100, 0],
          y: [0, -100, 100, 0],
          scale: [1, 1.2, 0.8, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
      />
      {/* More animation elements */}
      {children}
    </div>
  );
};
```

## Advanced Components

### Game Components

```tsx
export interface TriviaFormProps {
  topic: string;
  difficulty: string;
  questionCount: QuestionCount;
  loading: boolean;
  onTopicChange: (topic: string) => void;
  onDifficultyChange: (difficulty: string) => void;
  onQuestionCountChange: (count: QuestionCount) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onAddFavorite: () => void;
}

export interface TriviaGameProps {
  trivia: TriviaQuestion;
  selected: number | null;
  onAnswer: (index: number) => void;
}
```

### Stats Components

```tsx
export interface ScoringSystemProps {
  score: number;
  total: number;
  topicsPlayed: Record<string, number>;
  difficultyStats: Record<string, { correct: number; total: number }>;
}

export interface CustomDifficultyHistoryProps {
  isVisible: boolean;
  onSelect: (item: { topic: string; difficulty: string }) => void;
  onClose: () => void;
}
```

## Layout Components

### NotFound Page

```tsx
export const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-500">
      <div className="bg-white p-8 rounded-lg shadow-xl text-center max-w-md mx-4">
        <div className="flex justify-center mb-6">
          <AlertTriangle className="w-16 h-16 text-yellow-500" />
        </div>
        <h1 className="text-4xl font-bold mb-4 text-gray-800">404</h1>
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">Page Not Found</h2>
        <p className="text-gray-600 mb-8">
          Oops! The page you're looking for seems to have vanished into the trivia void.
        </p>
        <button
          onClick={() => navigate('/')}
          className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded flex items-center justify-center transition-colors"
        >
          <Home className="w-5 h-5 mr-2" />
          Return Home
        </button>
      </div>
    </div>
  );
};
```

## Best Practices

When working with UI components in EveryTriv, follow these best practices:

1. **Component Composition**: Build complex components from simpler ones.

2. **Consistent Props**: Use consistent prop naming and structure across similar components:
   - `size`: 'sm' | 'md' | 'lg'
   - `variant`: 'primary' | 'secondary' | 'outline'
   - `isGlassy`: boolean
   - `isLoading`: boolean

3. **Forward Refs**: Always use `forwardRef` to ensure components can be used with refs.

4. **TypeScript Props**: Define interfaces for all component props.

5. **Use the `cn` Utility**: For combining and conditionally applying class names.

6. **Animation Consistency**: Use the predefined animation variants and components.

7. **Accessibility**: Ensure all components are accessible (proper ARIA attributes, keyboard navigation).

8. **Responsive Design**: Design components to work well on all screen sizes.

9. **Error States**: Include error state handling in form components.

10. **Loading States**: Include loading state handling in interactive components.

### Example: Creating a New Component

```tsx
import { forwardRef } from 'react';
import { cn } from '../../utils/cn';

export interface NewComponentProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'alternative';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const NewComponent = forwardRef<HTMLDivElement, NewComponentProps>(
  ({ className, variant = 'default', size = 'md', isLoading, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'base-styles',
          {
            'variant-default': variant === 'default',
            'variant-alternative': variant === 'alternative',
            'size-sm': size === 'sm',
            'size-md': size === 'md',
            'size-lg': size === 'lg',
            'is-loading': isLoading,
          },
          className
        )}
        {...props}
      >
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          children
        )}
      </div>
    );
  }
);

NewComponent.displayName = 'NewComponent';
```
