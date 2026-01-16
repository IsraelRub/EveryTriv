import {
	createContext,
	forwardRef,
	useContext,
	useId,
	type ComponentPropsWithoutRef,
	type ElementRef,
	type HTMLAttributes,
} from 'react';
import {
	Controller,
	ControllerProps,
	FieldPath,
	FieldValues,
	FormProvider as Form,
	useFormContext,
} from 'react-hook-form';
import { Root as LabelRoot } from '@radix-ui/react-label';
import { Slot } from '@radix-ui/react-slot';

import { Label } from '@/components';
import type { FormFieldContextValue, FormItemContextValue } from '@/types';
import { cn } from '@/utils';

const FormFieldContext = createContext<FormFieldContextValue | undefined>(undefined);

export const FormField = <
	TFieldValues extends FieldValues = FieldValues,
	TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
	...props
}: ControllerProps<TFieldValues, TName>) => {
	return (
		<FormFieldContext.Provider value={{ name: props.name }}>
			<Controller {...props} />
		</FormFieldContext.Provider>
	);
};

export const useFormField = () => {
	const fieldContext = useContext(FormFieldContext);
	const itemContext = useContext(FormItemContext);
	const { getFieldState, formState } = useFormContext();

	if (!fieldContext) {
		throw new Error('useFormField should be used within <FormField>');
	}

	if (!itemContext) {
		throw new Error('useFormField should be used within <FormItem>');
	}

	const fieldState = getFieldState(fieldContext.name, formState);
	const { id } = itemContext;

	return {
		id,
		name: fieldContext.name,
		formItemId: `${id}-form-item`,
		formDescriptionId: `${id}-form-item-description`,
		formMessageId: `${id}-form-item-message`,
		...fieldState,
	};
};

const FormItemContext = createContext<FormItemContextValue | undefined>(undefined);

export const FormItem = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => {
	const id = useId();

	return (
		<FormItemContext.Provider value={{ id }}>
			<div ref={ref} className={cn('space-y-2', className)} {...props} />
		</FormItemContext.Provider>
	);
});
FormItem.displayName = 'FormItem';

export const FormLabel = forwardRef<ElementRef<typeof LabelRoot>, ComponentPropsWithoutRef<typeof LabelRoot>>(
	({ className, ...props }, ref) => {
		const { error, formItemId } = useFormField();

		return <Label ref={ref} className={cn(error && 'text-destructive', className)} htmlFor={formItemId} {...props} />;
	}
);
FormLabel.displayName = 'FormLabel';

export const FormControl = forwardRef<ElementRef<typeof Slot>, ComponentPropsWithoutRef<typeof Slot>>(
	({ ...props }, ref) => {
		const { formItemId } = useFormField();

		return <Slot ref={ref} id={formItemId} {...props} />;
	}
);
FormControl.displayName = 'FormControl';

export const FormDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
	({ className, ...props }, ref) => {
		const { formDescriptionId } = useFormField();

		return <p ref={ref} id={formDescriptionId} className={cn('text-sm text-muted-foreground', className)} {...props} />;
	}
);
FormDescription.displayName = 'FormDescription';

export const FormMessage = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
	({ className, children, ...props }, ref) => {
		const { error, formMessageId } = useFormField();
		const body = error ? String(error?.message) : children;

		if (!body) {
			return null;
		}

		return (
			<p ref={ref} id={formMessageId} className={cn('text-sm font-medium text-destructive', className)} {...props}>
				{body}
			</p>
		);
	}
);
FormMessage.displayName = 'FormMessage';

export { Form };
