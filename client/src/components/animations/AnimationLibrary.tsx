import { motion, Variants } from 'framer-motion';

import { ANIMATION_CONFIG } from '../../constants/animation.constants';
import { AnimatedContainerProps } from '../../types';
import { PulseEffect,staggerContainer } from './AnimationEffects';

// Animation variants
export const fadeInUp: Variants = {
	hidden: { opacity: 0, y: 20 },
	visible: {
		opacity: 1,
		y: 0,
		transition: { duration: ANIMATION_CONFIG.DURATION.NORMAL, ease: ANIMATION_CONFIG.EASING.EASE_OUT },
	},
};

export const fadeInDown: Variants = {
	hidden: { opacity: 0, y: -20 },
	visible: {
		opacity: 1,
		y: 0,
		transition: { duration: ANIMATION_CONFIG.DURATION.NORMAL, ease: ANIMATION_CONFIG.EASING.EASE_OUT },
	},
};

export const fadeInLeft: Variants = {
	hidden: { opacity: 0, x: -20 },
	visible: {
		opacity: 1,
		x: 0,
		transition: { duration: ANIMATION_CONFIG.DURATION.NORMAL, ease: ANIMATION_CONFIG.EASING.EASE_OUT },
	},
};

export const fadeInRight: Variants = {
	hidden: { opacity: 0, x: 20 },
	visible: {
		opacity: 1,
		x: 0,
		transition: { duration: ANIMATION_CONFIG.DURATION.NORMAL, ease: ANIMATION_CONFIG.EASING.EASE_OUT },
	},
};

export const scaleIn: Variants = {
	hidden: { opacity: 0, scale: 0.8 },
	visible: {
		opacity: 1,
		scale: 1,
		transition: { duration: ANIMATION_CONFIG.DURATION.NORMAL, ease: ANIMATION_CONFIG.EASING.EASE_OUT },
	},
};

export const slideInUp: Variants = {
	hidden: { opacity: 0, y: 50 },
	visible: {
		opacity: 1,
		y: 0,
		transition: { duration: ANIMATION_CONFIG.DURATION.SLOW, ease: ANIMATION_CONFIG.EASING.EASE_OUT },
	},
};

export const hoverScale: Variants = {
	initial: { scale: 1 },
	hover: {
		scale: 1.05,
		transition: { duration: ANIMATION_CONFIG.DURATION.FAST, ease: ANIMATION_CONFIG.EASING.EASE_OUT },
	},
};

export const AnimatedContainerComponent = ({
	children,
	variants = fadeInUp,
	className = '',
	delay = 0,
}: AnimatedContainerProps) => (
	<motion.div variants={variants} initial='hidden' animate='visible' transition={{ delay }} className={className}>
		{children}
	</motion.div>
);

export const FadeInUp = ({ children, className = '', delay = 0 }: AnimatedContainerProps) => (
	<AnimatedContainerComponent variants={fadeInUp} className={className} delay={delay}>
		{children}
	</AnimatedContainerComponent>
);

export const FadeInDown = ({ children, className = '', delay = 0 }: AnimatedContainerProps) => (
	<AnimatedContainerComponent variants={fadeInDown} className={className} delay={delay}>
		{children}
	</AnimatedContainerComponent>
);

export const FadeInLeft = ({ children, className = '', delay = 0 }: AnimatedContainerProps) => (
	<AnimatedContainerComponent variants={fadeInLeft} className={className} delay={delay}>
		{children}
	</AnimatedContainerComponent>
);

export const FadeInRight = ({ children, className = '', delay = 0 }: AnimatedContainerProps) => (
	<AnimatedContainerComponent variants={fadeInRight} className={className} delay={delay}>
		{children}
	</AnimatedContainerComponent>
);

export const ScaleIn = ({ children, className = '', delay = 0 }: AnimatedContainerProps) => (
	<AnimatedContainerComponent variants={scaleIn} className={className} delay={delay}>
		{children}
	</AnimatedContainerComponent>
);

export const SlideInUp = ({ children, className = '', delay = 0 }: AnimatedContainerProps) => (
	<AnimatedContainerComponent variants={slideInUp} className={className} delay={delay}>
		{children}
	</AnimatedContainerComponent>
);

export const StaggerContainer = ({ children, className = '', delay = 0 }: AnimatedContainerProps) => (
	<AnimatedContainerComponent variants={staggerContainer} className={className} delay={delay}>
		{children}
	</AnimatedContainerComponent>
);

export const HoverScale = ({ children, className = '' }: AnimatedContainerProps) => (
	<motion.div variants={hoverScale} initial='initial' whileHover='hover' className={className}>
		{children}
	</motion.div>
);

export { PulseEffect };
