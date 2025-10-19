/**
 * Validated Form Component
 *
 * @module ValidatedForm
 * @description Form component with multi-field validation using shared validation hooks
 * @used_by client/src/views/registration, client/src/views/user, client/src/components/game
 */

import type { DifficultyLevel } from '@shared/constants';
import { VALIDATION_LIMITS } from '@shared/constants';
import { clientLogger as logger } from '@shared/services';
import {
  validateCustomDifficulty,
  validateEmail,
  validatePassword,
  validateTopic,
  validateUsername,
} from '@shared/validation';
import { ChangeEvent, FormEvent, useCallback, useMemo, useRef, useState } from 'react';

import { VALID_DIFFICULTIES, VALID_QUESTION_COUNTS } from '../../constants';
import type { ValidatedFormProps } from '../../types';
import type { FormField } from '../../types/ui/forms.types';
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
  onSubmit,
  onCancel,
  className,
  isGlassy = false,
  showValidationSummary = true,
}: ValidatedFormProps<Record<string, string>>) {
  const validators = useMemo(
    () =>
      fields.reduce(
        (acc: Record<string, unknown>, field: FormField) => {
          acc[field.name] = (value: string) => {
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
                  errors: isValid
                    ? []
                    : [`Difficulty must be one of: ${VALID_DIFFICULTIES.join(', ')}`],
                };
              },
              questionCount: () => {
                const count = parseInt(value);
                const isValid =
                  count >= VALIDATION_LIMITS.QUESTION_COUNT.MIN &&
                  count <= VALIDATION_LIMITS.QUESTION_COUNT.MAX &&
                  VALID_QUESTION_COUNTS.includes(count as (typeof VALID_QUESTION_COUNTS)[number]);
                return {
                  isValid,
                  errors: isValid
                    ? []
                    : [
                        `Question count must be between ${VALIDATION_LIMITS.QUESTION_COUNT.MIN} and ${VALIDATION_LIMITS.QUESTION_COUNT.MAX}`,
                      ],
                };
              },
            };

            const validator = validations[field.validationType as keyof typeof validations];
            return validator
              ? validator()
              : {
                  isValid: value.length > 0,
                  errors: value.length === 0 ? ['This field is required'] : [],
                };
          };
          return acc;
        },
        {} as Record<string, (value: string) => { isValid: boolean; errors: string[] }>
      ),
    [fields]
  );

  // Form validation state
  const [values, setValues] = useState<Record<string, string>>(
    initialValues as Record<string, string>
  );
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [isValidating, setIsValidating] = useState(false);
  const valuesRef = useRef(values);

  // Keep ref in sync with state
  valuesRef.current = values;

  const validateField = useCallback(
    (field: string, value: string) => {
      const validator = validators[field] as (value: string) => {
        isValid: boolean;
        errors: string[];
      };
      if (!validator) return;

      const result = validator(value);
      if (result && typeof result === 'object' && 'errors' in result) {
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
        if (result && typeof result === 'object' && 'errors' in result && 'isValid' in result) {
          newErrors[field] = result.errors;
          if (!result.isValid) {
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
          <div key={field.name} className='space-y-2'>
            <label className='block text-sm font-medium text-white/80'>
              {field.label}
              {field.required && <span className='text-red-400 ml-1'>*</span>}
            </label>

            {renderField(field)}

            {/* Field Errors */}
            {errors[field.name as string]?.map((error: unknown, index: number) => (
              <p key={index} className='text-sm text-red-400 flex items-center'>
                <Icon name='Error' className='w-3 h-3 mr-1' />
                {String(error)}
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
          disabled={!isValid || loading || isValidating}
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
      {isValidating && (
        <div className='flex items-center justify-center space-x-2 text-blue-400'>
          <Icon name='Loading' className='w-4 h-4 animate-spin' />
          <span className='text-sm'>Validating...</span>
        </div>
      )}
    </form>
  );
}
