import { forwardRef } from 'react';

import { InputProps } from '../../types';
import { combineClassNames } from '../../utils/combineClassNames';
import { FadeInUp, HoverScale } from '../animations/AnimationLibrary';

export const Input = forwardRef<HTMLInputElement, InputProps>(
	({ className, size = 'md', isGlassy = false, error, withAnimation = true, ...props }, ref) => {
		const inputElement = (
			<input
				ref={ref}
				className={combineClassNames(
					// Base styles
					'w-full bg-white/10 text-white border-0',
					'placeholder:text-white/60',
					'focus:outline-none focus:ring-2 focus:ring-white/20',

					// Size variants
					{
						'px-3 py-1 text-sm': size === 'sm',
						'px-4 py-2 text-base': size === 'md',
						'px-6 py-3 text-lg': size === 'lg',
					},

					// Glass effect
					{
						glass: isGlassy,
					},

					// Error state
					{
						'border border-red-500 focus:ring-red-500/20': error,
					},

					className
				)}
				style={{
					borderRadius: '0.375rem',
					fontFamily: 'system-ui, -apple-system, sans-serif',
					fontWeight: '400',
					transitionDuration: '0.2s',
					transitionTimingFunction: 'ease',
					boxShadow: error ? '0 1px 2px 0 rgba(0, 0, 0, 0.05)' : 'none',
				}}
				{...props}
			/>
		);

		return withAnimation ? (
			<FadeInUp delay={0.1}>
				<HoverScale>
					{inputElement}
				</HoverScale>
			</FadeInUp>
		) : (
			inputElement
		);
	}
);

Input.displayName = 'Input';
