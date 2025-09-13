import { FC } from 'react';

import {
  CardGridProps,
  ContainerProps,
  GridLayoutProps,
  ResponsiveGridProps,
  SectionProps,
} from '../../types';
import { combineClassNames } from '../../utils/combineClassNames';

export const CardGrid: FC<CardGridProps> = ({
  children,
  className,
  columns = 'auto',
  gap = 'lg',
}) => {
  const cardGridClasses = combineClassNames(
    'grid',
    {
      'grid-cols-1': columns === 1,
      'grid-cols-1 md:grid-cols-2': columns === 2,
      'grid-cols-1 md:grid-cols-2 lg:grid-cols-3': columns === 3,
      'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4': columns === 4,
      'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5':
        columns === 'auto',
    },
    {
      'gap-4': gap === 'sm',
      'gap-6': gap === 'md',
      'gap-8': gap === 'lg',
      'gap-12': gap === 'xl',
    },
    className
  );

  return <div className={cardGridClasses}>{children}</div>;
};

export const GridLayout: FC<GridLayoutProps> = ({
  children,
  className,
  variant = 'content',
  gap = 'lg',
  align = 'start',
  justify = 'start',
}) => {
  const gridClasses = combineClassNames(
    // Base grid classes
    'grid',

    // Variant-specific classes
    {
      'grid-layout': variant === 'layout',
      'grid-content': variant === 'content',
      'grid-cards': variant === 'cards',
      'grid-stats': variant === 'stats',
      'grid-form': variant === 'form',
      'grid-game': variant === 'game',
    },

    // Gap classes
    {
      'gap-2': gap === 'sm',
      'gap-4': gap === 'md',
      'gap-6': gap === 'lg',
      'gap-8': gap === 'xl',
    },

    // Alignment classes
    {
      'items-start': align === 'start',
      'items-center': align === 'center',
      'items-end': align === 'end',
      'items-stretch': align === 'stretch',
    },

    // Justify classes
    {
      'justify-start': justify === 'start',
      'justify-center': justify === 'center',
      'justify-end': justify === 'end',
      'justify-between': justify === 'between',
      'justify-around': justify === 'around',
    },

    className
  );

  return <div className={gridClasses}>{children}</div>;
};

export const LayoutContainer: FC<ContainerProps> = ({
  children,
  className,
  size = 'lg',
  centered = true,
}) => {
  const containerClasses = combineClassNames(
    'w-full',
    {
      'max-w-sm': size === 'sm',
      'max-w-md': size === 'md',
      'max-w-lg': size === 'lg',
      'max-w-xl': size === 'xl',
      'max-w-full': size === 'full',
    },
    {
      'mx-auto': centered,
    },
    'px-4 sm:px-6 lg:px-8',
    className
  );

  return <div className={containerClasses}>{children}</div>;
};

export const LayoutSection: FC<SectionProps> = ({
  children,
  className,
  padding = 'lg',
  background = 'none',
}) => {
  const sectionClasses = combineClassNames(
    'w-full',
    {
      'p-0': padding === 'none',
      'p-4': padding === 'sm',
      'p-6': padding === 'md',
      'p-8': padding === 'lg',
      'p-12': padding === 'xl',
    },
    {
      glass: background === 'glass',
      'glass-strong': background === 'glass-strong',
    },
    className
  );

  return <section className={sectionClasses}>{children}</section>;
};

export const ResponsiveGrid: FC<ResponsiveGridProps> = ({
  children,
  className,
  minWidth = '300px',
  gap = 'lg',
}) => {
  const responsiveGridClasses = combineClassNames(
    'grid',
    `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`,
    {
      'gap-4': gap === 'sm',
      'gap-6': gap === 'md',
      'gap-8': gap === 'lg',
      'gap-12': gap === 'xl',
    },
    className
  );

  return (
    <div
      className={responsiveGridClasses}
      style={{
        gridTemplateColumns: `repeat(auto-fit, minmax(${minWidth}, 1fr))`,
      }}
    >
      {children}
    </div>
  );
};

// Export all layout components
export default {
  GridLayout,
  LayoutContainer,
  LayoutSection,
  CardGrid,
  ResponsiveGrid,
};
