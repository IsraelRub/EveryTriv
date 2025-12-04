import { forwardRef, useCallback, type ComponentProps, type FocusEvent } from 'react';

import { AudioKey } from '@/constants';
import { useAudio } from '@/hooks';
import { cn } from '@/utils';

const Input = forwardRef<HTMLInputElement, ComponentProps<'input'>>(({ className, type, onFocus, ...props }, ref) => {
	const audioService = useAudio();

	const handleFocus = useCallback(
		(e: FocusEvent<HTMLInputElement>) => {
			audioService.play(AudioKey.INPUT);
			onFocus?.(e);
		},
		[onFocus, audioService]
	);

	return (
		<input
			type={type}
			className={cn(
				'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
				className
			)}
			ref={ref}
			onFocus={handleFocus}
			{...props}
		/>
	);
});
Input.displayName = 'Input';

export { Input };
