/**
 * Form Types
 * @module FormTypes
 * @description Form-related types and interfaces
 */
import type { ValidationHookOptions, ValidationType } from '@shared';
import type { InputHTMLAttributes, SelectHTMLAttributes } from 'react';

/**
 * Base input props interface
 * @interface FormInputProps
 * @description Props for form input components extending HTML input attributes
 */
export interface FormInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'size'> {
  /**
   * Input value
   * @description Current value of the input field
   */
  value: string;

  /**
   * Change handler
   * @param event - React change event from input element
   * @description Callback when input value changes
   */
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;

  /**
   * Placeholder text
   * @description Text to show when input is empty
   */
  placeholder?: string;

  /**
   * Input type
   * @description HTML input type for validation and UI
   * @default 'text'
   */
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';

  /**
   * Whether input is required
   * @description Marks field as mandatory for form validation
   * @default false
   */
  required?: boolean;

  /**
   * Whether input is disabled
   * @description Disables user interaction with the input
   * @default false
   */
  disabled?: boolean;

  /**
   * Input name attribute
   * @description HTML name attribute for form submission
   */
  name?: string;

  /**
   * Input id attribute
   * @description HTML id attribute for accessibility and labels
   */
  id?: string;

  /**
   * Additional CSS classes
   * @description Custom styling classes to apply to the input
   */
  className?: string;

  /**
   * Input size variant
   * @description Visual size of the input component
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Whether input has glass effect
   * @description Applies glassmorphism styling to the input
   * @default false
   */
  isGlassy?: boolean;

  /**
   * Whether input has error state
   * @description Shows error styling when validation fails
   * @default false
   */
  error?: boolean;

  /**
   * Whether input has animation
   * @description Enables input animations and transitions
   * @default false
   */
  withAnimation?: boolean;
}

/**
 * Base select props interface
 * @interface FormSelectProps
 * @description Props for form select components extending HTML select attributes
 */
export interface FormSelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange' | 'size'> {
  /**
   * Select value
   * @description Currently selected option value
   */
  value: string;

  /**
   * Change handler
   * @param event - React change event from select element
   * @description Callback when selected option changes
   */
  onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;

  /**
   * Placeholder text
   * @description Text to show when no option is selected
   */
  placeholder?: string;

  /**
   * Whether select is required
   * @description Marks field as mandatory for form validation
   * @default false
   */
  required?: boolean;

  /**
   * Whether select is disabled
   * @description Disables user interaction with the select
   * @default false
   */
  disabled?: boolean;

  /**
   * Select name attribute
   * @description HTML name attribute for form submission
   */
  name?: string;

  /**
   * Select id attribute
   * @description HTML id attribute for accessibility and labels
   */
  id?: string;

  /**
   * Additional CSS classes
   * @description Custom styling classes to apply to the select
   */
  className?: string;

  /**
   * Select options array
   * @description Array of option objects with value and label
   */
  options?: Array<{ value: string; label: string }>;

  /**
   * Select size variant
   * @description Visual size of the select component
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Whether select has glass effect
   * @description Applies glassmorphism styling to the select
   * @default false
   */
  isGlassy?: boolean;

  /**
   * Whether select has error state
   * @description Shows error styling when validation fails
   * @default false
   */
  error?: boolean;

  /**
   * Select children elements
   * @description Child option elements for the select
   */
  children: React.ReactNode;
}

// Form-related types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'textarea' | 'select';
  validationType: ValidationType;
  required?: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  validationOptions?: ValidationHookOptions;
}

export interface ValidatedFormProps<T extends Record<string, unknown>> {
  fields: FormField[];
  initialValues?: T;
  title?: string;
  description?: string;
  submitText?: string;
  loading?: boolean;
  validationOptions?: ValidationHookOptions;
  onSubmit: (values: T, isValid: boolean) => void | Promise<void>;
  onCancel?: () => void;
  className?: string;
  isGlassy?: boolean;
  showValidationSummary?: boolean;
}

// Input Props
// Form Input Props (extends base FormInputProps)
export interface FormInputPropsExtended extends FormInputProps {
  fieldName: string;
  validation?: ValidationHookOptions;
}

// Validated Input Props
export interface ValidatedInputProps extends Omit<FormInputProps, 'onChange'> {
  validationType: ValidationType;
  validationOptions?: ValidationHookOptions;
  realTimeValidation?: boolean;
  validationDebounceMs?: number;
  initialValue?: string;
  showErrors?: boolean;
  renderError?: (errors: string[]) => React.ReactNode;
  showValidationIcon?: boolean;
  onChange?: (value: string, isValid?: boolean, errors?: string[]) => void;
}

// Form Select Props (extends base FormSelectProps)
export interface FormSelectPropsExtended extends FormSelectProps {
  fieldName: string;
  validation?: ValidationHookOptions;
}

// Select Option
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

// Form Field Interface
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'select' | 'textarea';
  placeholder?: string;
  required?: boolean;
  defaultValue?: unknown;
  options?: Array<{
    value: string;
    label: string;
  }>;
}
