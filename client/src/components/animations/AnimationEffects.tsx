import { ANIMATION_CONFIG } from '../../constants';

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
