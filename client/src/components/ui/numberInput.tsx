import { forwardRef, useCallback, type ChangeEvent } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

import { clamp } from '@shared/utils';

import { ButtonSize, VariantBase } from '@/constants';
import type { NumberInputProps } from '@/types';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
	({ value, onChange, min, max, step = 1, disabled, label, labelIcon, error, ...props }, ref) => {
		const handleStep = useCallback(
			(direction: 1 | -1) => {
				if (disabled) return;
				const firstStepPoint = Math.ceil(min / step) * step;
				const next =
					direction === 1
						? value === min
							? firstStepPoint === min
								? min + step // min is already on grid (e.g. time 30, step 30 → 60)
								: firstStepPoint // first step above min (e.g. 1, step 5 → 5)
							: value + step
						: value - step;
				onChange(clamp(next, min, max));
			},
			[value, step, min, max, onChange, disabled]
		);

		const handleInputChange = useCallback(
			(e: ChangeEvent<HTMLInputElement>) => {
				if (disabled) return;
				const inputValue = e.target.value;
				if (!inputValue) {
					onChange(min);
					return;
				}
				const numValue = Number.parseInt(inputValue, 10);
				if (Number.isNaN(numValue)) return;
				onChange(clamp(numValue, min, max));
			},
			[min, max, onChange, disabled]
		);

		const isDecrementDisabled = disabled ?? value <= min;
		const isIncrementDisabled = disabled ?? value >= max;

		const inputBlock = (
			<div className='inline-flex items-center gap-0 rounded-md border border-input overflow-hidden'>
				<Input
					ref={ref}
					type='number'
					value={value}
					onChange={handleInputChange}
					min={min}
					max={max}
					step={step}
					disabled={disabled}
					error={error}
					className='h-10 min-w-[4.5rem] w-24 shrink-0 text-center border-0 rounded-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none focus-visible:ring-0 focus-visible:ring-offset-0'
					{...props}
				/>
				<div className='flex flex-col shrink-0 border-l border-input'>
					<Button
						type='button'
						variant={VariantBase.OUTLINE}
						size={ButtonSize.ICON_LG}
						className='h-5 w-7 shrink-0 rounded-none border-0 border-b border-input'
						onClick={() => handleStep(1)}
						disabled={isIncrementDisabled}
					>
						<ChevronUp className='h-3 w-3' />
					</Button>
					<Button
						type='button'
						variant={VariantBase.OUTLINE}
						size={ButtonSize.ICON_LG}
						className='h-5 w-7 shrink-0 rounded-none border-0'
						onClick={() => handleStep(-1)}
						disabled={isDecrementDisabled}
					>
						<ChevronDown className='h-3 w-3' />
					</Button>
				</div>
			</div>
		);

		if (label) {
			const iconNode =
				labelIcon != null ? (
					<span className='inline-flex h-4 w-4 items-center justify-center text-muted-foreground [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0'>
						{labelIcon}
					</span>
				) : null;
			return (
				<div className='flex flex-col items-center space-y-2'>
					<Label className='flex items-center justify-center gap-2'>
						{iconNode}
						{label}
					</Label>
					{inputBlock}
				</div>
			);
		}

		return inputBlock;
	}
);
NumberInput.displayName = 'NumberInput';
