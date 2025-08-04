import type { ForwardRefRenderFunction, HTMLAttributes } from 'react';
import { forwardRef } from 'react';
import { cn } from '../../utils/cn';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  isGlassy?: boolean;
  withGlow?: boolean;
}

const CardComponent: ForwardRefRenderFunction<HTMLDivElement, CardProps> = 
  ({ className, isGlassy = true, withGlow = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-lg p-6',
          {
            'glass-morphism': isGlassy,
            'cube-glow': withGlow,
          },
          className
        )}
        {...props}
      />
    );
  };

export const Card = forwardRef(CardComponent);
Card.displayName = 'Card';

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {}

const CardHeaderComponent: ForwardRefRenderFunction<HTMLDivElement, CardHeaderProps> = 
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('mb-4', className)}
        {...props}
      />
    );
  };

export const CardHeader = forwardRef(CardHeaderComponent);
CardHeader.displayName = 'CardHeader';

export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {}

const CardTitleComponent: ForwardRefRenderFunction<HTMLHeadingElement, CardTitleProps> = 
  ({ className, ...props }, ref) => {
    return (
      <h3
        ref={ref}
        className={cn('text-xl font-semibold', className)}
        {...props}
      />
    );
  };

export const CardTitle = forwardRef(CardTitleComponent);
CardTitle.displayName = 'CardTitle';

export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}

const CardContentComponent: ForwardRefRenderFunction<HTMLDivElement, CardContentProps> = 
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('', className)}
        {...props}
      />
    );
  };

export const CardContent = forwardRef(CardContentComponent);
CardContent.displayName = 'CardContent';