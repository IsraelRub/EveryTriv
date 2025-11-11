/**
 * Validated Input Component
 *
 * @module ValidatedInput
 * @description Input component with built-in validation using shared validation hooks
 * @used_by client/src/components/forms, client/src/views
 */

import { ChangeEvent, forwardRef, useEffect, useState } from 'react';

import { clientLogger as logger } from '@shared/services';

import { AudioKey, ComponentSize } from '../../constants';
import { useValidation } from '../../hooks';
import { audioService } from '../../services';
import type { ValidatedInputProps } from '../../types';
import { combineClassNames } from '../../utils';
import { Icon } from '../IconLibrary';
import { ValidationStatusIndicator } from './ValidationIcon';

export const ValidatedInput = forwardRef<HTMLInputElement, ValidatedInputProps>(
	(
		{
			validationType,
			initialValue = '',
			validationOptions: validationOptions = {},
			onChange,
			showValidationIcon = true,
			showErrors = true,
			renderError,
			isGlassy = false,
			size = 'md',
			className,
			...props
		},
		ref
	) => {
		// Enhanced validation options with real-time validation

		// Validation state
		const [isValid, setIsValid] = useState(true);
		const [errors, setErrors] = useState<string[]>([]);
		const [isValidating, setIsValidating] = useState(false);
		const { validate } = useValidation();

		const validateValue = async (value: string) => {
			setIsValidating(true);

			const result = await validate(validationType, value, validationOptions);
			setIsValid(Boolean(result.isValid));
			setErrors(result.errors ?? []);
			setIsValidating(false);
			return result;
		};

		// Handle input change
		const handleChange = async (e: ChangeEvent<HTMLInputElement>) => {
			const value = e.target.value;

			// Log user activity
			logger.logUserActivity('input_change', validationType, {
				valueLength: value.length,
			});

			// Measure validation performance
			const startTime = performance.now();
			const result = await validateValue(value);
			const duration = performance.now() - startTime;
			logger.performance(`validation_${validationType}`, duration);

			// Play input sound
			audioService.play(AudioKey.INPUT);

			if (onChange) {
				onChange(value, Boolean(result.isValid));
			}
		};

		// Call onChange on mount if initial value exists
		useEffect(() => {
			if (initialValue && onChange) {
				validateValue(initialValue).then(result => {
					onChange(initialValue, Boolean(result.isValid));
				});
			}
		}, []);

		// Determine validation status
		const getValidationStatus = (): 'idle' | 'validating' | 'valid' | 'invalid' | 'warning' | 'pending' | 'none' => {
			if (isValidating) return 'validating';
			if (errors.length > 0) return 'invalid';
			if (isValid && initialValue) return 'valid';
			return 'idle';
		};

		// Determine validation icon
		const getValidationIcon = () => {
			if (!showValidationIcon) return null;

			const status = getValidationStatus();

			return <ValidationStatusIndicator status={status} size={ComponentSize.SM} showTransitions={true} />;
		};

		// Render error messages
		const renderErrorMessages = () => {
			if (!showErrors || errors.length === 0) return null;

			if (renderError) {
				return renderError(errors[0] || '');
			}

			return (
				<div className='mt-1 space-y-1'>
					{errors.map((error: string, index: number) => (
						<p key={index} className='text-sm text-red-400 flex items-center'>
							<Icon name='Error' className='w-3 h-3 mr-1' />
							{error}
						</p>
					))}
				</div>
			);
		};

		return (
			<div className='space-y-1'>
				<div className='relative'>
					<input
						ref={ref}
						onChange={handleChange}
						className={combineClassNames(
							// Base styles
							'w-full rounded-md bg-white/10 text-white border-0',
							'transition-colors duration-200',
							'placeholder:text-white/60',
							'focus:outline-none focus:ring-2 focus:ring-white/20',

							// Size variants
							{
								'px-3 py-1.5 text-sm': size === 'sm',
								'px-4 py-2 text-base': size === 'md',
								'px-6 py-3 text-lg': size === 'lg',
							},

							// Glass effect
							{
								glass: isGlassy,
							},

							// Validation state
							{
								'border border-red-500 focus:ring-red-500/20': errors.length > 0,
								'border border-green-500 focus:ring-green-500/20': isValid && initialValue,
							},

							className
						)}
						{...props}
						value={initialValue}
					/>

					{/* Validation icon */}
					{getValidationIcon() && (
						<div className='absolute right-3 top-1/2 transform -translate-y-1/2'>{getValidationIcon()}</div>
					)}
				</div>

				{/* Error messages */}
				{renderErrorMessages()}
			</div>
		);
	}
);

ValidatedInput.displayName = 'ValidatedInput';
