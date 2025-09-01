/**
 * Validated Input Component
 *
 * @module ValidatedInput
 * @description Input component with built-in validation using shared validation hooks
 * @used_by client/src/components/forms, client/src/views
 */

import {
	useCustomDifficultyValidation,
	useEmailValidation,
	usePasswordValidation,
	useTopicValidation,
	useUsernameValidation,
} from 'everytriv-shared/hooks/useValidation';
import { ChangeEvent, forwardRef, useEffect } from 'react';

import type { ValidatedInputProps } from '../../types/ui.types';
import { combineClassNames } from '../../utils/combineClassNames';
import { Icon } from '../icons/IconLibrary';

export const ValidatedInput = forwardRef<HTMLInputElement, ValidatedInputProps>(
	(
		{
			validationType,
			initialValue = '',
			validationOptions = {},
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
		const enhancedValidationOptions = {
			...validationOptions,
			debounceMs: 300, // Real-time validation with debounce
			validateOnMount: true, // Validate on component mount
			required: true, // All fields are required by default
		};

		// Use appropriate validation hook based on type with enhanced options
		const getValidationHook = () => {
			switch (validationType) {
				case 'username':
					return useUsernameValidation(initialValue, enhancedValidationOptions);
				case 'password':
					return usePasswordValidation(initialValue, enhancedValidationOptions);
				case 'email':
					return useEmailValidation(initialValue, enhancedValidationOptions);
				case 'topic':
					return useTopicValidation(initialValue, enhancedValidationOptions);
				case 'customDifficulty':
					return useCustomDifficultyValidation(initialValue, enhancedValidationOptions);
				default:
					return useUsernameValidation(initialValue, enhancedValidationOptions);
			}
		};

		const validation = getValidationHook();

		// Handle input change
		const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
			const value = e.target.value;
			validation.validate(value);

			if (onChange) {
				onChange(value, validation.isValid, validation.errors);
			}
		};

		// Call onChange on mount if initial value exists
		useEffect(() => {
			if (initialValue && onChange) {
				onChange(initialValue, validation.isValid, validation.errors);
			}
		}, []);

		// Determine validation icon
		const getValidationIcon = () => {
			if (!showValidationIcon) return null;

			if (validation.isValidating) {
				return <Icon name='Loading' className='w-4 h-4 animate-spin text-blue-400' />;
			}

			if (validation.errors.length > 0) {
				return <Icon name='Error' className='w-4 h-4 text-red-400' />;
			}

			if (validation.isValid && validation.value) {
				return <Icon name='Check' className='w-4 h-4 text-green-400' />;
			}

			return null;
		};

		// Render error messages
		const renderErrorMessages = () => {
			if (!showErrors || validation.errors.length === 0) return null;

			if (renderError) {
				return renderError(validation.errors);
			}

			return (
				<div className='mt-1 space-y-1'>
					{validation.errors.map((error, index) => (
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
						value={validation.value}
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
								'border border-red-500 focus:ring-red-500/20': validation.errors.length > 0,
								'border border-green-500 focus:ring-green-500/20': validation.isValid && validation.value,
							},

							className
						)}
						{...props}
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
