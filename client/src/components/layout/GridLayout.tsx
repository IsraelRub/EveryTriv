import { FC } from 'react';

import { ContainerSize, Spacing } from '../../constants';
import type { CardGridProps, ContainerProps, GridLayoutProps, ResponsiveGridProps } from '../../types';
import { combineClassNames } from '../../utils';

export const CardGrid: FC<CardGridProps> = ({
	children,
	className,
	columns = 'auto',
	gap = Spacing.LG,
	as = 'article',
}) => {
	const cardGridClasses = combineClassNames(
		'grid',
		{
			'grid-cols-1': columns === 1,
			'grid-cols-1 md:grid-cols-2': columns === 2,
			'grid-cols-1 md:grid-cols-2 lg:grid-cols-3': columns === 3,
			'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4': columns === 4,
			'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5': columns === 'auto',
		},
		{
			'gap-2': gap === Spacing.SM,
			'gap-4': gap === Spacing.MD,
			'gap-6': gap === Spacing.LG,
			'gap-8': gap === Spacing.XL,
			'gap-12': gap === Spacing.XXL,
		},
		className
	);

	const Component = as;
	return <Component className={cardGridClasses}>{children}</Component>;
};

export const GridLayout: FC<GridLayoutProps> = ({
	children,
	className,
	variant = 'content',
	gap = Spacing.LG,
	align = 'start',
	justify = 'start',
	as = 'section',
}) => {
	const gridClasses = combineClassNames(
		// Base grid classes
		'grid',

		// Variant-specific classes (simplified to 8 most used)
		{
			'grid-content': variant === 'content',
			'grid-cards': variant === 'cards',
			'grid-stats': variant === 'stats',
			'grid-form': variant === 'form',
			'grid-game': variant === 'game',
			'grid-balanced': variant === 'balanced',
			'grid-compact': variant === 'compact',
			'grid-auto-fit': variant === 'auto-fit',
		},

		// Gap classes
		{
			'gap-2': gap === Spacing.SM,
			'gap-4': gap === Spacing.MD,
			'gap-6': gap === Spacing.LG,
			'gap-8': gap === Spacing.XL,
			'gap-12': gap === Spacing.XXL,
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

	const Component = as;
	return <Component className={gridClasses}>{children}</Component>;
};

export const LayoutContainer: FC<ContainerProps> = ({
	children,
	className,
	size = ContainerSize.LG,
	centered = true,
}) => {
	const containerClasses = combineClassNames(
		'w-full',
		{
			'max-w-sm': size === ContainerSize.SM,
			'max-w-md': size === ContainerSize.MD,
			'max-w-lg': size === ContainerSize.LG,
			'max-w-xl': size === ContainerSize.XL,
			'max-w-2xl': size === ContainerSize.XXL,
			'max-w-full': size === ContainerSize.FULL,
		},
		{
			'mx-auto': centered,
		},
		'px-4 sm:px-6 lg:px-8',
		className
	);

	return <div className={containerClasses}>{children}</div>;
};

export const ResponsiveGrid: FC<ResponsiveGridProps> = ({
	children,
	className,
	minWidth = '300px',
	gap = Spacing.LG,
	columns,
	as = 'div',
}) => {
	const responsiveGridClasses = combineClassNames(
		'grid',
		{
			'grid-cols-1': columns === 1,
			'grid-cols-1 md:grid-cols-2': columns === 2,
			'grid-cols-1 md:grid-cols-2 lg:grid-cols-3': columns === 3,
			'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4': columns === 4 || !columns,
			'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5': columns === 5,
		},
		{
			'gap-2': gap === Spacing.SM,
			'gap-4': gap === Spacing.MD,
			'gap-6': gap === Spacing.LG,
			'gap-8': gap === Spacing.XL,
			'gap-12': gap === Spacing.XXL,
		},
		className
	);

	const gridStyle = columns
		? {}
		: {
				gridTemplateColumns: `repeat(auto-fit, minmax(${minWidth}, 1fr))`,
			};

	const Component = as;
	return (
		<Component className={responsiveGridClasses} style={gridStyle}>
			{children}
		</Component>
	);
};
