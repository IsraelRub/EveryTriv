import type { ForwardRefRenderFunction } from 'react';
import { forwardRef } from 'react';

import { CardContentProps, CardHeaderProps, CardProps, CardTitleProps } from '../../types';
import { combineClassNames } from '../../utils/combineClassNames';

const CardComponent: ForwardRefRenderFunction<HTMLDivElement, CardProps> = (
  { className, isGlassy = true, withGlow = false, ...props },
  ref
) => {
  return (
    <div
      ref={ref}
      className={combineClassNames(
        'backdrop-blur-sm',
        {
          glass: isGlassy,
          'cube-glow': withGlow,
        },
        className
      )}
      style={{
        // Using fixed values for styling
        boxShadow: withGlow
          ? '0 0 20px rgba(102, 126, 234, 0.5)'
          : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        borderRadius: '0.5rem',
        padding: '1.5rem',
        transitionDuration: '0.2s',
        transitionTimingFunction: 'ease',
        // Responsive design
        ...(window.innerWidth >= 768 && {
          padding: '2rem',
          boxShadow: withGlow
            ? '0 0 20px rgba(102, 126, 234, 0.5)'
            : '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        }),
        // Z-index management
        zIndex: 1000,
      }}
      {...props}
    />
  );
};

const CardContentComponent: ForwardRefRenderFunction<HTMLDivElement, CardContentProps> = (
  { className, ...props },
  ref
) => {
  return <div ref={ref} className={combineClassNames('', className)} {...props} />;
};

const CardHeaderComponent: ForwardRefRenderFunction<HTMLDivElement, CardHeaderProps> = (
  { className, ...props },
  ref
) => {
  return <div ref={ref} className={combineClassNames('mb-4', className)} {...props} />;
};

const CardTitleComponent: ForwardRefRenderFunction<HTMLHeadingElement, CardTitleProps> = (
  { className, ...props },
  ref
) => {
  return (
    <h3
      ref={ref}
      className={combineClassNames('', className)}
      style={{
        fontSize: '1.5rem',
        fontWeight: '600',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        lineHeight: '1.2',
        letterSpacing: '-0.025em',
        // Responsive typography
        ...(window.innerWidth >= 1024 && {
          fontSize: '1.875rem',
        }),
      }}
      {...props}
    />
  );
};

export const Card = forwardRef(CardComponent);
Card.displayName = 'Card';

export const CardContent = forwardRef(CardContentComponent);
CardContent.displayName = 'CardContent';

export const CardHeader = forwardRef(CardHeaderComponent);
CardHeader.displayName = 'CardHeader';

export const CardTitle = forwardRef(CardTitleComponent);
CardTitle.displayName = 'CardTitle';
