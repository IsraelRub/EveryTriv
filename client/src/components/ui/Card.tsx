import { forwardRef, ForwardRefRenderFunction } from 'react';

import { CardVariant, Spacing } from '../../constants';
import { CardContentProps, CardHeaderProps, CardProps, CardTitleProps } from '../../types';
import { combineClassNames } from '../../utils';

/**
 * Card Component
 *
 * @module Card
 * @description Container component for content sections and layout organization
 * @used_by client/components, client/src/views
 */
const CardComponent: ForwardRefRenderFunction<HTMLDivElement, CardProps> = (
	{ className, variant, isGlassy, withGlow = false, padding, ...props },
	ref
) => {
	// Determine variant based on props (backward compatibility)
	const effectiveVariant = variant || (isGlassy !== false ? CardVariant.GLASS : CardVariant.TRANSPARENT);

	// Variant-specific classes
	const variantClasses: Record<CardVariant, string> = {
		[CardVariant.GLASS]: 'bg-white/5 backdrop-blur-sm border border-white/10',
		[CardVariant.WHITE]: 'bg-white rounded-lg shadow-lg',
		[CardVariant.TRANSPARENT]: 'bg-transparent',
		[CardVariant.GRAY]: 'bg-gray-50 rounded-lg',
		[CardVariant.SOLID]: 'bg-white rounded-lg shadow-lg',
		[CardVariant.GRADIENT]: 'bg-gradient-to-r from-purple-400 to-pink-400 rounded-lg',
	};

	// Padding classes - only apply if padding is explicitly set, otherwise use default
	const paddingClasses = padding
		? {
				[Spacing.NONE]: '',
				[Spacing.SM]: 'p-3',
				[Spacing.MD]: 'p-6',
				[Spacing.LG]: 'p-8',
				[Spacing.XL]: 'p-12',
				[Spacing.XXL]: 'p-16',
			}[padding]
		: '';

	// Default padding for glass variant via inline style if padding not specified
	const defaultPaddingStyle =
		effectiveVariant === CardVariant.GLASS && !padding ? { padding: '2rem' } : undefined;

	return (
		<div
			ref={ref}
			className={combineClassNames(
				'rounded-lg',
				variantClasses[effectiveVariant],
				paddingClasses,
				{
					glass: effectiveVariant === CardVariant.GLASS && isGlassy !== false,
					'cube-glow': withGlow,
				},
				className
			)}
			style={{
				// Using fixed values for styling
				boxShadow: withGlow
					? '0 0 20px rgba(102, 126, 234, 0.5)'
					: effectiveVariant === CardVariant.WHITE
						? '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
						: effectiveVariant === CardVariant.GRAY
							? '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
						: effectiveVariant === CardVariant.GLASS
							? '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
							: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
				borderRadius:
					effectiveVariant !== CardVariant.WHITE && effectiveVariant !== CardVariant.GRAY ? '0.5rem' : undefined,
				...defaultPaddingStyle,
				transitionDuration: '0.2s',
				transitionTimingFunction: 'ease',
				// Z-index management
				zIndex: effectiveVariant === CardVariant.GLASS ? 1000 : undefined,
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
				fontSize: '1.875rem',
				fontWeight: '600',
				fontFamily: 'system-ui, -apple-system, sans-serif',
				lineHeight: '1.2',
				letterSpacing: '-0.025em',
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
