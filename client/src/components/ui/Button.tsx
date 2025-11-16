import { forwardRef, memo, MouseEvent, useCallback } from 'react';

import { motion } from 'framer-motion';

import { AudioKey, ButtonVariant, ComponentSize } from '../../constants';
import { useAudio } from '../../hooks/useAudio';
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
						'inline-flex items-center justify-center font-medium rounded-md',
						'transition-colors duration-150',
						'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950',
						'disabled:pointer-events-none disabled:opacity-50',

						// Size variants
						{
							'px-3 py-1.5 text-sm': size === ComponentSize.SM,
							'px-4 py-2 text-sm': size === ComponentSize.MD,
							'px-5 py-3 text-base': size === ComponentSize.LG,
						},

						// Color variants
						{
							'bg-slate-100 text-slate-900 hover:bg-white': variant === ButtonVariant.PRIMARY && !isGlassy,
							'bg-slate-800 text-slate-100 hover:bg-slate-700': variant === ButtonVariant.SECONDARY && !isGlassy,
							'bg-blue-500 text-white hover:bg-blue-400': variant === ButtonVariant.ACCENT && !isGlassy,
							'text-slate-300 hover:text-white hover:bg-slate-800/60': variant === ButtonVariant.GHOST,
						},

						// Glass effect
						{
							'border border-slate-700 bg-slate-900/50 backdrop-blur-md text-slate-100': isGlassy,
							'shadow-sm shadow-slate-900/40': withGlow,
						},

						className
					)}
					style={{
						fontFamily: 'system-ui, -apple-system, sans-serif',
						fontWeight: 500,
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
