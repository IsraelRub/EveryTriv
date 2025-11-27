/**
 * Validation Message Component
 *
 * @module ValidationMessage
 * @description Component for displaying validation status and messages
 * @used_by client/src/components/ui/ValidatedInput.tsx, client/src/components/forms/ValidatedForm.tsx
 */

import { FC, useEffect } from 'react';

import { AudioKey } from '../../constants';
import { audioService } from '../../services';
import type { ValidationMessageProps } from '../../types';
import { combineClassNames } from '../../utils';
import { Icon } from './IconLibrary';

export const ValidationMessage: FC<ValidationMessageProps> = ({
	status,
	errors = [],
	warnings = [],
	successMessage,
	showIcon = true,
	showMessages = true,
	className,
	size = 'md',
	animationDuration = 200,
}) => {
	// Play audio based on status changes
	useEffect(() => {
		if (status === 'warning' && warnings.length > 0) {
			audioService.play(AudioKey.WARNING);
		}
	}, [status, warnings.length]);
	// Get status-specific styling
	const getStatusStyles = () => {
		switch (status) {
			case 'validating':
				return {
					container: 'text-blue-400',
					icon: 'text-blue-400',
					message: 'text-blue-300',
				};
			case 'valid':
				return {
					container: 'text-green-400',
					icon: 'text-green-400',
					message: 'text-green-300',
				};
			case 'invalid':
				return {
					container: 'text-red-400',
					icon: 'text-red-400',
					message: 'text-red-300',
				};
			case 'warning':
				return {
					container: 'text-yellow-400',
					icon: 'text-yellow-400',
					message: 'text-yellow-300',
				};
			default:
				return {
					container: 'text-white/60',
					icon: 'text-white/40',
					message: 'text-white/50',
				};
		}
	};

	// Get status icon
	const getStatusIcon = () => {
		if (!showIcon) return null;

		switch (status) {
			case 'validating':
				return <Icon name='loading' className='animate-spin' />;
			case 'valid':
				return <Icon name='Check' />;
			case 'invalid':
				return <Icon name='Error' />;
			case 'warning':
				return <Icon name='Warning' />;
			default:
				return null;
		}
	};

	// Get size classes
	const getSizeClasses = () => {
		switch (size) {
			case 'sm':
				return {
					container: 'text-xs',
					icon: 'w-3 h-3',
					message: 'text-xs',
				};
			case 'md':
				return {
					container: 'text-sm',
					icon: 'w-4 h-4',
					message: 'text-sm',
				};
			case 'lg':
				return {
					container: 'text-base',
					icon: 'w-5 h-5',
					message: 'text-base',
				};
			default:
				return {
					container: 'text-sm',
					icon: 'w-4 h-4',
					message: 'text-sm',
				};
		}
	};

	const statusStyles = getStatusStyles();
	const sizeClasses = getSizeClasses();

	// Don't render if no messages and no icon
	if (!showMessages && !showIcon) return null;

	// Don't render if idle and no messages
	if (status === 'idle' && !showMessages) return null;

	return (
		<div
			className={combineClassNames(
				'flex items-start space-x-2 transition-all duration-200',
				statusStyles.container,
				sizeClasses.container,
				className
			)}
			style={{ transitionDuration: `${animationDuration}ms` }}
		>
			{/* Status Icon */}
			{getStatusIcon() && (
				<div className={combineClassNames('flex-shrink-0', sizeClasses.icon, statusStyles.icon)}>{getStatusIcon()}</div>
			)}

			{/* Messages */}
			{showMessages && (
				<div className='flex-1 space-y-1'>
					{/* Success Message */}
					{status === 'valid' && successMessage && (
						<p className={combineClassNames(sizeClasses.message, statusStyles.message)}>{successMessage}</p>
					)}

					{/* Error Messages */}
					{errors.map((error: string, index: number) => (
						<p key={index} className={combineClassNames(sizeClasses.message, statusStyles.message)}>
							{error}
						</p>
					))}

					{/* Warning Messages */}
					{warnings.map((warning: string, index: number) => (
						<p key={index} className={combineClassNames(sizeClasses.message, statusStyles.message)}>
							{warning}
						</p>
					))}

					{/* Loading Message */}
					{status === 'validating' && (
						<p className={combineClassNames(sizeClasses.message, statusStyles.message)}>Validating...</p>
					)}
				</div>
			)}
		</div>
	);
};
