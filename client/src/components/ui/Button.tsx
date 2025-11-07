import { forwardRef, memo, MouseEvent, useCallback } from 'react';

import { motion } from 'framer-motion';

import { useAudio } from '../../App';
import { AudioKey, ButtonVariant, ComponentSize } from '../../constants';
import { ButtonProps } from '../../types';
import { combineClassNames } from '../../utils';
import { hoverScale, scaleIn } from '../animations';

/**
 * Button Component
 *
 * @module Button
 * @description Reusable button component with variants, states, and styling options
 * @used_by client/components, client/src/views, client/src/forms
 */
export const Button = memo(
	forwardRef<HTMLButtonElement, ButtonProps>(
		(
			{
				children,
				className,
				variant = ButtonVariant.PRIMARY,
				size = ComponentSize.MD,
				isGlassy = false,
				withGlow = false,
				withAnimation = true,
				onClick,
				...props
			},
			ref
		) => {
			const audioService = useAudio();

			const handleClick = useCallback(
				(e: MouseEvent<HTMLButtonElement>) => {
					audioService.play(AudioKey.CLICK);
					onClick?.(e);
				},
				[onClick, audioService]
			);

			const handleMouseEnter = useCallback(() => {
				audioService.play(AudioKey.HOVER);
			}, [audioService]);

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
							'px-3 py-1 text-sm': size === ComponentSize.SM,
							'px-4 py-2 text-base': size === ComponentSize.MD,
							'px-6 py-3 text-lg': size === ComponentSize.LG,
						},

						// Color variants
						{
							'bg-[#667eea] hover:bg-[#5a6ed4] text-white': variant === ButtonVariant.PRIMARY && !isGlassy,
							'bg-[#f093fb] hover:bg-[#f083eb] text-white': variant === ButtonVariant.SECONDARY && !isGlassy,
							'bg-[#4facfe] hover:bg-[#4facfe] text-white': variant === ButtonVariant.ACCENT && !isGlassy,
							'hover:bg-white/10 text-white': variant === ButtonVariant.GHOST,
						},

						// Glass effect
						{
							glass: isGlassy,
							'cube-glow': withGlow,
						},

						// Custom gradient backgrounds for glassy variants
						{
							'hover:bg-gradient-to-r from-[#667eea]/30 to-[#764ba2]/30': variant === ButtonVariant.PRIMARY && isGlassy,
							'hover:bg-gradient-to-r from-[#f093fb]/30 to-[#f5576c]/30':
								variant === ButtonVariant.SECONDARY && isGlassy,
							'hover:bg-gradient-to-r from-[#4facfe]/30 to-[#00f2fe]/30': variant === ButtonVariant.ACCENT && isGlassy,
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
					onMouseEnter={handleMouseEnter}
					{...props}
				>
					{children}
				</button>
			);

			return withAnimation ? (
				<motion.div variants={scaleIn} initial='hidden' animate='visible' transition={{ delay: 0.1 }} role='button'>
					<motion.div variants={hoverScale} initial='initial' whileHover='hover'>
						{withGlow ? (
							<motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }}>
								{buttonElement}
							</motion.div>
						) : (
							buttonElement
						)}
					</motion.div>
				</motion.div>
			) : (
				buttonElement
			);
		}
	)
);

Button.displayName = 'Button';
