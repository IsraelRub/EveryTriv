/**
 * Validation Icon Component
 *
 * @module ValidationIcon
 * @description Component for displaying validation status icons
 * @used_by client/src/components/ui/ValidatedInput.tsx, client/src/components/forms/ValidatedForm.tsx
 */

import type { ValidationIconProps, ValidationStatusIndicatorProps } from 'everytriv-shared/types/validation.types';
import { FC, ReactNode } from 'react';

import { combineClassNames } from '../../utils/combineClassNames';
import { Icon } from '../icons/IconLibrary';

export const ValidationIcon: FC<ValidationIconProps> = ({
	status,
	size = 'md',
	animated = true,
	className,
	iconName,
	tooltip,
	showTooltip = false,
}) => {
	// Get icon name based on status
	const getIconName = (): string => {
		if (iconName) return iconName;

		switch (status) {
			case 'validating':
				return 'Loading';
			case 'valid':
				return 'Check';
			case 'invalid':
				return 'Error';
			case 'warning':
				return 'Warning';
			default:
				return 'Info';
		}
	};

	// Get status-specific styling
	const getStatusStyles = () => {
		switch (status) {
			case 'validating':
				return 'text-blue-400';
			case 'valid':
				return 'text-green-400';
			case 'invalid':
				return 'text-red-400';
			case 'warning':
				return 'text-yellow-400';
			default:
				return 'text-white/40';
		}
	};

	// Get size classes
	const getSizeClasses = () => {
		switch (size) {
			case 'xs':
				return 'w-3 h-3';
			case 'sm':
				return 'w-4 h-4';
			case 'md':
				return 'w-5 h-5';
			case 'lg':
				return 'w-6 h-6';
			case 'xl':
				return 'w-8 h-8';
			default:
				return 'w-5 h-5';
		}
	};

	// Get animation classes
	const getAnimationClasses = () => {
		if (!animated) return '';

		switch (status) {
			case 'validating':
				return 'animate-spin';
			case 'valid':
				return 'animate-pulse';
			case 'invalid':
				return 'animate-bounce';
			case 'warning':
				return 'animate-pulse';
			default:
				return '';
		}
	};

	const iconNameToUse = getIconName();
	const statusStyles = getStatusStyles();
	const sizeClasses = getSizeClasses();
	const animationClasses = getAnimationClasses();

	// Tooltip component
	const Tooltip = ({ children }: { children: ReactNode }) => {
		if (!showTooltip || !tooltip) return <>{children}</>;

		return (
			<div className='relative group'>
				{children}
				<div className='absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10'>
					{tooltip}
					<div className='absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800'></div>
				</div>
			</div>
		);
	};

	return (
		<Tooltip>
			<div
				className={combineClassNames(
					'flex items-center justify-center',
					statusStyles,
					sizeClasses,
					animationClasses,
					className
				)}
			>
				<Icon name={iconNameToUse} />
			</div>
		</Tooltip>
	);
};

// Convenience components for specific validation states
export const ValidationLoadingIcon: FC<Omit<ValidationIconProps, 'status'>> = (props) => (
	<ValidationIcon {...props} status='validating' />
);

export const ValidationSuccessIcon: FC<Omit<ValidationIconProps, 'status'>> = (props) => (
	<ValidationIcon {...props} status='valid' />
);

export const ValidationErrorIcon: FC<Omit<ValidationIconProps, 'status'>> = (props) => (
	<ValidationIcon {...props} status='invalid' />
);

export const ValidationWarningIcon: FC<Omit<ValidationIconProps, 'status'>> = (props) => (
	<ValidationIcon {...props} status='warning' />
);

// Validation status indicator with multiple states
export const ValidationStatusIndicator: FC<ValidationStatusIndicatorProps> = ({
	status,
	previousStatus,
	size = 'md',
	showTransitions = true,
	className,
}) => {
	const getTransitionClasses = () => {
		if (!showTransitions || !previousStatus || previousStatus === status) return '';

		return 'transition-all duration-300 ease-in-out';
	};

	return (
		<div className={combineClassNames('relative', getTransitionClasses(), className)}>
			<ValidationIcon status={status} size={size} animated={true} className='transition-opacity duration-300' />
		</div>
	);
};
