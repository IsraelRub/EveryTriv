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
			'grid-cols-2': columns === 2,
			'grid-cols-3': columns === 3,
			'grid-cols-4': columns === 4,
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
	const autoColumnStyle = columns === 'auto' ? { gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' } : undefined;
	return (
		<Component className={cardGridClasses} style={autoColumnStyle}>
			{children}
		</Component>
	);
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

const CONTAINER_SIZE_CLASSES: Record<ContainerSize, string> = {
	[ContainerSize.SM]: 'max-w-screen-sm',
	[ContainerSize.MD]: 'max-w-screen-md',
	[ContainerSize.LG]: 'max-w-screen-lg',
	[ContainerSize.XL]: 'max-w-screen-xl',
	[ContainerSize.XXL]: 'max-w-screen-2xl',
	[ContainerSize.FULL]: 'max-w-full',
};

const CONTAINER_PADDING_CLASSES: Record<Spacing, string> = {
	[Spacing.NONE]: 'px-0',
	[Spacing.SM]: 'px-4',
	[Spacing.MD]: 'px-6',
	[Spacing.LG]: 'px-8',
	[Spacing.XL]: 'px-12',
	[Spacing.XXL]: 'px-16',
};

export const LayoutContainer: FC<ContainerProps> = ({
	children,
	className,
	size = ContainerSize.LG,
	maxWidth,
	padding = Spacing.XL,
	center,
	centered = true,
}) => {
	const effectiveSize = maxWidth ?? size;
	const shouldCenter = center ?? centered;
	const containerClasses = combineClassNames(
		'w-full',
		CONTAINER_SIZE_CLASSES[effectiveSize],
		shouldCenter ? 'mx-auto' : undefined,
		CONTAINER_PADDING_CLASSES[padding],
		className
	);

	return <div className={containerClasses}>{children}</div>;
};

export const ResponsiveGrid: FC<ResponsiveGridProps> = ({
	children,
	className,
	minWidth: _minWidth = '300px',
	gap = Spacing.LG,
	columns,
	as = 'div',
}) => {
	void _minWidth;
	const responsiveGridClasses = combineClassNames(
		'grid',
		{
			'grid-cols-1': columns === 1,
			'grid-cols-2': columns === 2,
			'grid-cols-3': columns === 3,
			'grid-cols-4': columns === 4 || !columns,
			'grid-cols-5': columns === 5,
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

	const gridStyle =
		columns === undefined
			? {
					gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
				}
			: {};

	const Component = as;
	return (
		<Component className={responsiveGridClasses} style={gridStyle}>
			{children}
		</Component>
	);
};
