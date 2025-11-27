/**
 * Validated Form Component
 *
 * @module ValidatedForm
 * @description Form component with multi-field validation using shared validation hooks
 * @used_by client/src/views/registration, client/src/views/user, client/src/components/game
 */

import { ChangeEvent, FormEvent, useCallback, useMemo, useRef, useState } from 'react';

import { VALID_DIFFICULTIES, VALID_REQUESTED_QUESTIONS, VALIDATION_LIMITS } from '@shared/constants';
import { clientLogger as logger } from '@shared/services';
import type { BaseValidationResult } from '@shared/types';
import { isRecord, isStringArray } from '@shared/utils';
import {
	isValidDifficulty,
	validateCustomDifficultyText,
	validateEmail,
	validatePassword,
	validateTopicLength,
} from '@shared/validation';

import { ButtonVariant, CardVariant, Spacing } from '../../constants';
import type { FormField, ValidatedFormProps } from '../../types';
import { combineClassNames } from '../../utils';
import { Button } from './Button';
import { Card } from './Card';
import { Icon } from './IconLibrary';

/**
 * Type guard to check if value is a validation result
 */
function isValidationResult(result: unknown): result is { errors: string[]; isValid?: boolean } {
	return isRecord(result) && 'errors' in result && isStringArray(result.errors);
}

/**
 * Validated form component with multi-field validation
 *
 * @component ValidatedForm
 * @description Form component with comprehensive validation using shared validation hooks and real-time feedback
 * @param fields Array of form field configurations
 * @param initialValues Initial form values
 * @param title Form title
 * @param description Form description
 * @param submitText Submit button text
 * @param loading Loading state
 * @param validationOptions Validation configuration options
 * @param onSubmit Form submission handler
 * @param onCancel Cancel handler
 * @param className Additional CSS classes
 * @param isGlassy Whether to apply glass effect styling
 * @param showValidationSummary Whether to show validation summary
 * @returns JSX.Element The rendered validated form
 */
export function ValidatedForm({
	fields,
	initialValues = {},
	title,
	description,
	submitText = 'Submit',
	loading = false,
	onSubmit,
	onCancel,
	className,
	isGlassy = false,
	showValidationSummary = true,
}: ValidatedFormProps<Record<string, string>>) {
	const validators = useMemo(
		() =>
			fields.reduce((acc: Record<string, (value: string) => BaseValidationResult>, field: FormField) => {
				acc[field.name] = (value: string) => {
					const validations: Record<string, () => BaseValidationResult> = {
						password: () => validatePassword(value),
						email: () => validateEmail(value),
						topic: () => validateTopicLength(value),
						customDifficulty: () => validateCustomDifficultyText(value),
						difficulty: () => {
							const isValid = isValidDifficulty(value);
							return {
								isValid,
								errors: isValid
									? []
									: [`Difficulty must be one of: ${VALID_DIFFICULTIES.join(', ')} or a custom difficulty`],
							};
						},
						requestedQuestions: () => {
							const count = parseInt(value);
							const { MIN, MAX, UNLIMITED } = VALIDATION_LIMITS.REQUESTED_QUESTIONS;
							const isValid =
								(count >= MIN && count <= MAX) ||
								count === UNLIMITED ||
								VALID_REQUESTED_QUESTIONS.some(validCount => validCount === count);
							return {
								isValid,
								errors: isValid
									? []
									: [`Requested questions must be between ${MIN} and ${MAX}, or ${UNLIMITED} for unlimited mode`],
							};
						},
					};

					const validator = validations[field.validationType];
					return validator
						? validator()
						: {
								isValid: value.length > 0,
								errors: value.length === 0 ? ['This field is required'] : [],
							};
				};
				return acc;
			}, {}),
		[fields]
	);

	// Form validation state
	const [values, setValues] = useState<Record<string, string>>(initialValues);
	const [errors, setErrors] = useState<Record<string, string[]>>({});
	const [isValidating, setIsValidating] = useState(false);
	const valuesRef = useRef(values);

	// Keep ref in sync with state
	valuesRef.current = values;

	const validateField = useCallback(
		(field: string, value: string) => {
			const validator = validators[field];
			if (typeof validator !== 'function') return;

			const result = validator(value);
			if (isValidationResult(result)) {
				setErrors(prev => ({
					...prev,
					[field]: result.errors,
				}));
			}
		},
		[validators]
	);

	const validateAll = useCallback(() => {
		setIsValidating(true);

		const newErrors: Record<string, string[]> = {};
		let allValid = true;
		const currentValues = valuesRef.current;

		Object.keys(validators).forEach(field => {
			const value = currentValues[field];
			const validator = validators[field];

			if (validator && typeof validator === 'function') {
				const result = validator(String(value || ''));
				if (isValidationResult(result)) {
					newErrors[field] = result.errors;
					if (result.isValid === false) {
						allValid = false;
					}
				}
			}
		});

		setErrors(newErrors);
		setIsValidating(false);
		return allValid;
	}, [validators]);

	const setFieldValue = useCallback(
		(field: string, value: string) => {
			setValues(prev => ({
				...prev,
				[field]: value,
			}));
			validateField(field, value);
		},
		[validateField]
	);

	const isValid = Object.values(errors).every(fieldErrors => fieldErrors.length === 0);

	const handleSubmit = useCallback(
		(e: FormEvent) => {
			e.preventDefault();

			// Log form submission attempt
			logger.logUserActivity('form_submit', 'validated_form', {
				fieldCount: fields.length,
				hasErrors: !isValid,
			});

			// Measure form validation performance
			const startTime = performance.now();
			const formIsValid = validateAll();
			const duration = performance.now() - startTime;
			logger.performance('form_validation', duration);

			onSubmit(valuesRef.current, formIsValid);
		},
		[onSubmit, fields.length, validateAll, isValid]
	);

	const handleFieldChange = useCallback(
		(fieldName: string, value: string) => {
			setFieldValue(fieldName, value);
		},
		[setFieldValue]
	);

	const renderField = (field: FormField) => {
		const fieldName = field.name;
		const value = values[fieldName] || '';
		const fieldErrors = errors[fieldName] ?? [];

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
					'border border-red-500 focus:ring-red-500/20': fieldErrors.length > 0,
					'border border-green-500 focus:ring-green-500/20': !fieldErrors.length && value,
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
						{field.options?.map((option: { value: string; label: string }) => (
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

	const allErrors = Object.values(errors).flat();

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
				{fields.map((field: FormField) => (
					<fieldset key={field.name} className='space-y-2'>
						<legend className='sr-only'>{field.label} Field</legend>
						<label className='block text-sm font-medium text-white/80'>
							{field.label}
							{field.required && <span className='text-red-400 ml-1'>*</span>}
						</label>

						{renderField(field)}

						{/* Field Errors */}
						{errors[field.name]?.map((error: unknown, index: number) => (
							<p key={index} role='alert' className='text-sm text-red-400 flex items-center'>
								<Icon name='Error' className='w-3 h-3 mr-1' />
								{String(error)}
							</p>
						))}
					</fieldset>
				))}
			</div>

			{/* Validation Summary */}
			{showValidationSummary && allErrors.length > 0 && (
				<Card
					role='alert'
					variant={CardVariant.TRANSPARENT}
					padding={Spacing.LG}
					className='rounded-lg border border-red-500/20 bg-red-500/10'
				>
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
				</Card>
			)}

			{/* Form Actions */}
			<div className='flex space-x-4'>
				<Button type='submit' disabled={!isValid || loading || isValidating} loading={loading} className='flex-1'>
					{submitText}
				</Button>

				{onCancel && (
					<Button type='button' variant={ButtonVariant.SECONDARY} onClick={onCancel} disabled={loading}>
						Cancel
					</Button>
				)}
			</div>

			{/* Loading State */}
			{isValidating && (
				<div className='flex items-center justify-center space-x-2 text-blue-400'>
					<Icon name='loading' className='w-4 h-4 animate-spin' />
					<span className='text-sm'>Validating...</span>
				</div>
			)}
		</form>
	);
}
