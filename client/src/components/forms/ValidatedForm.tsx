/**
 * Validated Form Component
 *
 * @module ValidatedForm
 * @description Form component with multi-field validation using shared validation hooks
 * @used_by client/src/views/registration, client/src/views/user, client/src/components/game
 */

import type { DifficultyLevel } from 'everytriv-shared/constants';
import { useStringFormValidation } from 'everytriv-shared/hooks/useValidation';
import { ChangeEvent, FormEvent, useCallback } from 'react';

import { VALID_DIFFICULTIES, VALID_QUESTION_COUNTS } from '../../constants';
import type { FormField, ValidatedFormProps } from '../../types/forms.types';
import { combineClassNames } from '../../utils/combineClassNames';
import { Icon } from '../icons/IconLibrary';
import { Button } from '../ui/Button';

/**
 * Validated form component with multi-field validation
 * 
 * @component ValidatedForm
 * @description Form component with comprehensive validation using shared validation hooks and real-time feedback
 * @param fields - Array of form field configurations
 * @param initialValues - Initial form values
 * @param title - Form title
 * @param description - Form description
 * @param submitText - Submit button text
 * @param loading - Loading state
 * @param validationOptions - Validation configuration options
 * @param onSubmit - Form submission handler
 * @param onCancel - Cancel handler
 * @param className - Additional CSS classes
 * @param isGlassy - Whether to apply glass effect styling
 * @param showValidationSummary - Whether to show validation summary
 * @returns JSX.Element The rendered validated form
 */
export function ValidatedForm({
	fields,
	initialValues = {},
	title,
	description,
	submitText = 'Submit',
	loading = false,
	validationOptions = {},
	onSubmit,
	onCancel,
	className,
	isGlassy = false,
	showValidationSummary = true,
}: ValidatedFormProps<Record<string, string>>) {
	const validators = fields.reduce(
		(acc, field) => {
			acc[field.name] = (value: string) => {
				const {
					validateUsername,
					validatePassword,
					validateEmail,
					validateTopic,
					validateCustomDifficulty,
				} = require('everytriv-shared/validation');

				const validations = {
					username: () => validateUsername(value),
					password: () => validatePassword(value),
					email: () => validateEmail(value),
					topic: () => validateTopic(value),
					customDifficulty: () => validateCustomDifficulty(value),
					difficulty: () => {
						const isValid = VALID_DIFFICULTIES.includes(value as DifficultyLevel);
						return {
							isValid,
							errors: isValid ? [] : [`Difficulty must be one of: ${VALID_DIFFICULTIES.join(', ')}`],
						};
					},
					questionCount: () => {
						const count = parseInt(value);
						const isValid = VALID_QUESTION_COUNTS.includes(count as typeof VALID_QUESTION_COUNTS[number]);
						return {
							isValid,
							errors: isValid ? [] : [`Question count must be one of: ${VALID_QUESTION_COUNTS.join(', ')}`],
						};
					},
				};

				const validator = validations[field.validationType];
				return validator
					? validator()
					: { isValid: value.length > 0, errors: value.length === 0 ? ['This field is required'] : [] };
			};
			return acc;
		},
		{} as Record<string, (value: string) => { isValid: boolean; errors: string[] }>
	);

	const enhancedValidationOptions = {
		...validationOptions,
		debounceMs: 300,
		validateOnMount: true,
		required: true,
	};

	const formValidation = useStringFormValidation(validators, initialValues as Record<string, string>, enhancedValidationOptions);

	const handleSubmit = useCallback(
		(e: FormEvent) => {
			e.preventDefault();

			const isValid = formValidation.validateAll();
			onSubmit(formValidation.values, isValid);
		},
		[formValidation, onSubmit]
	);

	const handleFieldChange = useCallback(
		(fieldName: string, value: string) => {
			formValidation.setFieldValue(fieldName, value);
		},
		[formValidation]
	);

	const renderField = (field: FormField) => {
		const fieldName = field.name;
		const value = formValidation.values[fieldName] || '';
		const errors = formValidation.errors[fieldName] || [];

		const baseInputProps = {
			value: String(value),
			onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
				handleFieldChange(fieldName, e.target.value);
			},
			placeholder: field.placeholder,
			required: field.required,
			className: combineClassNames(
				'w-full rounded-md bg-white/10 text-white border-0',
				'transition-colors duration-200',
				'placeholder:text-white/60',
				'focus:outline-none focus:ring-2 focus:ring-white/20',
				'px-4 py-2 text-base',
				{
					'border border-red-500 focus:ring-red-500/20': errors.length > 0,
					'border border-green-500 focus:ring-green-500/20': !errors.length && value,
				}
			),
		};

		switch (field.type) {
			case 'textarea':
				return <textarea {...baseInputProps} rows={4} />;

			case 'select':
				return (
					<select {...baseInputProps}>
						<option value=''>{field.placeholder || 'Select an option'}</option>
						{field.options?.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</select>
				);

			default:
				return <input {...baseInputProps} type={field.type} />;
		}
	};

	const allErrors = Object.values(formValidation.errors).flat();

	return (
		<form
			onSubmit={handleSubmit}
			className={combineClassNames(
				'space-y-6',
				{
					glass: isGlassy,
				},
				className
			)}
		>
			{/* Form Header */}
			{(title || description) && (
				<div className='text-center space-y-2'>
					{title && <h2 className='text-2xl font-bold text-white'>{title}</h2>}
					{description && <p className='text-white/70'>{description}</p>}
				</div>
			)}

			{/* Form Fields */}
			<div className='space-y-4'>
				{fields.map((field) => (
					<div key={field.name} className='space-y-2'>
						<label className='block text-sm font-medium text-white/80'>
							{field.label}
							{field.required && <span className='text-red-400 ml-1'>*</span>}
						</label>

						{renderField(field)}

						{/* Field Errors */}
						{formValidation.errors[field.name as string]?.map((error: string, index: number) => (
							<p key={index} className='text-sm text-red-400 flex items-center'>
								<Icon name='Error' className='w-3 h-3 mr-1' />
								{error}
							</p>
						))}
					</div>
				))}
			</div>

			{/* Validation Summary */}
			{showValidationSummary && allErrors.length > 0 && (
				<div className='bg-red-500/10 border border-red-500/20 rounded-lg p-4'>
					<div className='flex items-center space-x-2 mb-2'>
						<Icon name='Error' className='w-5 h-5 text-red-400' />
						<h3 className='text-white font-medium'>Please fix the following errors:</h3>
					</div>
					<ul className='space-y-1'>
						{allErrors.map((error, index) => (
							<li key={index} className='text-sm text-red-300 flex items-center'>
								<span className='w-1 h-1 bg-red-400 rounded-full mr-2'></span>
								{error}
							</li>
						))}
					</ul>
				</div>
			)}

			{/* Form Actions */}
			<div className='flex space-x-4'>
				<Button
					type='submit'
					disabled={!formValidation.isValid || loading || formValidation.isValidating}
					loading={loading}
					className='flex-1'
				>
					{submitText}
				</Button>

				{onCancel && (
					<Button type='button' variant='secondary' onClick={onCancel} disabled={loading}>
						Cancel
					</Button>
				)}
			</div>

			{/* Loading State */}
			{formValidation.isValidating && (
				<div className='flex items-center justify-center space-x-2 text-blue-400'>
					<Icon name='Loading' className='w-4 h-4 animate-spin' />
					<span className='text-sm'>Validating...</span>
				</div>
			)}
		</form>
	);
}
