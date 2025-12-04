import { forwardRef, useCallback, type ComponentProps } from 'react';

import { ChevronDown, ChevronUp } from 'lucide-react';

import { ButtonSize } from '@/constants';
import { cn } from '@/utils';

import { Button } from './button';
import { Input } from './input';

interface NumberInputProps extends Omit<ComponentProps<'input'>, 'type' | 'value' | 'onChange'> {
	value: number;
	onChange: (value: number) => void;
	min?: number;
	max?: number;
	step?: number;
}

const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
	({ className, value, onChange, min, max, step = 1, disabled, ...props }, ref) => {
		const handleIncrement = useCallback(() => {
			if (disabled) return;
			const newValue = max !== undefined ? Math.min(value + step, max) : value + step;
			onChange(newValue);
		}, [value, step, max, onChange, disabled]);

		const handleDecrement = useCallback(() => {
			if (disabled) return;
			const newValue = min !== undefined ? Math.max(value - step, min) : value - step;
			onChange(newValue);
		}, [value, step, min, onChange, disabled]);

		const handleInputChange = useCallback(
			(e: React.ChangeEvent<HTMLInputElement>) => {
				if (disabled) return;
				const inputValue = e.target.value;
				if (inputValue === '') {
					onChange(min ?? value);
					return;
				}
				const numValue = Number.parseInt(inputValue, 10);
				if (Number.isNaN(numValue)) return;

				let finalValue = numValue;
				if (min !== undefined && finalValue < min) {
					finalValue = min;
				}
				if (max !== undefined && finalValue > max) {
					finalValue = max;
				}
				onChange(finalValue);
			},
			[min, max, onChange, disabled, value]
		);

		const isDecrementDisabled = disabled || (min !== undefined && value <= min);
		const isIncrementDisabled = disabled || (max !== undefined && value >= max);

		return (
			<div className={cn('inline-flex items-center gap-2', className)}>
				<Input
					ref={ref}
					type='number'
					value={value}
					onChange={handleInputChange}
					min={min}
					max={max}
					step={step}
					disabled={disabled}
					className='h-12 w-20 text-center [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'
					{...props}
				/>
				<div className='flex flex-col gap-0'>
					<Button
						type='button'
						variant='outline'
						size={ButtonSize.ICON}
						className='h-6 w-8 shrink-0 rounded-b-none border-b-0 rounded-tl-md rounded-tr-md'
						onClick={handleIncrement}
						disabled={isIncrementDisabled}
						aria-label='Increase value'
					>
						<ChevronUp className='h-3 w-3' />
					</Button>
					<Button
						type='button'
						variant='outline'
						size={ButtonSize.ICON}
						className='h-6 w-8 shrink-0 rounded-t-none border-t-0 rounded-bl-md rounded-br-md'
						onClick={handleDecrement}
						disabled={isDecrementDisabled}
						aria-label='Decrease value'
					>
						<ChevronDown className='h-3 w-3' />
					</Button>
				</div>
			</div>
		);
	}
);
NumberInput.displayName = 'NumberInput';

export { NumberInput };
