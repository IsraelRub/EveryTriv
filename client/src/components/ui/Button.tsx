import { forwardRef, MouseEvent } from 'react';

import { useAudio } from '@/hooks';

import { AudioKey } from '../../constants';
import { ButtonProps } from '../../types';
import { combineClassNames } from '../../utils/combineClassNames';
import { HoverScale,PulseEffect, ScaleIn } from '../animations/AnimationLibrary';

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
	(
		{
			children,
			className,
			variant = 'primary',
			size = 'md',
			isGlassy = false,
			withGlow = false,
			withAnimation = true,
			onClick,
			...props
		},
		ref
	) => {
		const { playSound } = useAudio();

		const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
			playSound(AudioKey.CLICK);
			onClick?.(e);
		};

		const buttonElement = (
			<button
				ref={ref}
				className={combineClassNames(
					// Base styles
					'inline-flex items-center justify-center font-medium',
					'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
					'disabled:pointer-events-none disabled:opacity-50',

					// Size variants
					{
						'px-3 py-1 text-sm': size === 'sm',
						'px-4 py-2 text-base': size === 'md',
						'px-6 py-3 text-lg': size === 'lg',
					},

					// Color variants
					{
						'bg-[#667eea] hover:bg-[#5a6ed4] text-white': variant === 'primary' && !isGlassy,
						'bg-[#f093fb] hover:bg-[#e083eb] text-white': variant === 'secondary' && !isGlassy,
						'bg-[#4facfe] hover:bg-[#3f9cee] text-white': variant === 'accent' && !isGlassy,
						'hover:bg-white/10 text-white': variant === 'ghost',
					},

					// Glass effect
					{
						glass: isGlassy,
						'cube-glow': withGlow,
					},

					// Custom gradient backgrounds for glassy variants
					{
						'hover:bg-gradient-to-r from-[#667eea]/30 to-[#764ba2]/30': variant === 'primary' && isGlassy,
						'hover:bg-gradient-to-r from-[#f093fb]/30 to-[#f5576c]/30': variant === 'secondary' && isGlassy,
						'hover:bg-gradient-to-r from-[#4facfe]/30 to-[#00f2fe]/30': variant === 'accent' && isGlassy,
					},

					className
				)}
				style={{
					// Using fixed values for styling
					borderRadius: '0.375rem',
					fontFamily: 'system-ui, -apple-system, sans-serif',
					fontWeight: '500',
					boxShadow: withGlow ? '0 0 20px rgba(102, 126, 234, 0.5)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
					transitionDuration: '0.2s',
					transitionTimingFunction: 'ease',
					// Responsive design
					...(window.innerWidth >= 768 && {
						boxShadow: withGlow ? '0 0 20px rgba(102, 126, 234, 0.5)' : '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
					}),
				}}
				onClick={handleClick}
				{...props}
			>
				{children}
			</button>
		);

		return withAnimation ? (
			<ScaleIn delay={0.1}>
				<HoverScale>
					{withGlow ? <PulseEffect>{buttonElement}</PulseEffect> : buttonElement}
				</HoverScale>
			</ScaleIn>
		) : (
			buttonElement
		);
	}
);

Button.displayName = 'Button';
