import { motion } from 'framer-motion';

import { ANIMATION_CONFIG, EFFECT_COLORS } from '../../constants/animation.constants';
import { FloatingCardProps, PulseEffectProps } from '../../types';

export const FloatingCard = ({
	children,
	distance = ANIMATION_CONFIG.VALUES.FLOAT_DISTANCE,
	duration = 3,
	delay = 0,
}: FloatingCardProps) => (
	<motion.div
		animate={{
			y: [0, -distance, 0],
		}}
		transition={{
			duration,
			repeat: Infinity,
			repeatType: 'reverse',
			ease: 'easeInOut',
			delay,
		}}
	>
		{children}
	</motion.div>
);

export const PulseEffect = ({
	children,
	color = EFFECT_COLORS.PULSE.PRIMARY,
	intensity = 15,
	speed = 1.5,
}: PulseEffectProps) => (
	<motion.div
		animate={{
			scale: [1, 1.05, 1],
			boxShadow: [
				`0 0 0 0 ${color.replace('0.3', '0')}`,
				`0 0 0 ${intensity}px ${color}`,
				`0 0 0 0 ${color.replace('0.3', '0')}`,
			],
		}}
		transition={{
			duration: speed,
			repeat: Infinity,
			repeatType: 'loop',
			ease: ANIMATION_CONFIG.EASING.EASE_IN_OUT,
		}}
	>
		{children}
	</motion.div>
);

// Background-specific variants
export const backgroundOrbVariants = {
	hidden: { opacity: 0, scale: 0.5 },
	visible: { opacity: 1, scale: 1 },
};

export const backgroundParticleVariants = {
	hidden: { opacity: 0 },
	visible: { opacity: 1 },
};

// Enhanced fade and slide variants with customizable options
export const createFadeVariants = (
	direction: 'up' | 'down' | 'left' | 'right' = 'up',
	distance: number = 20,
	duration: number = ANIMATION_CONFIG.DURATION.NORMAL
) => ({
	hidden: {
		opacity: 0,
		x: direction === 'left' ? -distance : direction === 'right' ? distance : 0,
		y: direction === 'up' ? distance : direction === 'down' ? -distance : 0,
	},
	visible: {
		opacity: 1,
		x: 0,
		y: 0,
		transition: {
			duration,
			ease: ANIMATION_CONFIG.EASING.EASE_OUT,
		},
	},
});

// Enhanced stagger container
export const createStaggerContainer = (
	staggerDelay: number = ANIMATION_CONFIG.STAGGER.NORMAL,
	childDelay: number = 0.2
) => ({
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: {
			staggerChildren: staggerDelay,
			delayChildren: childDelay,
		},
	},
});

// Default stagger container (backward compatibility)
export const staggerContainer = createStaggerContainer();
