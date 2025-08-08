import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { ANIMATION_CONFIG, EFFECT_COLORS } from './AnimationConfig';

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

// Default fade variants (backward compatibility)
export const fadeInVariants = createFadeVariants();

// Enhanced scale variants
export const createScaleVariants = (
  fromScale: number = 0.8,
  toScale: number = 1,
  duration: number = ANIMATION_CONFIG.DURATION.NORMAL
) => ({
  hidden: { scale: fromScale, opacity: 0 },
  visible: {
    scale: toScale,
    opacity: 1,
    transition: {
      ...ANIMATION_CONFIG.EASING.SPRING,
      duration,
    },
  },
});

// Default scale variants (backward compatibility)
export const popVariants = createScaleVariants();

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

// Enhanced Confetti Effect with customization
interface ConfettiEffectProps {
  isVisible: boolean;
  particleCount?: number;
  colors?: readonly string[];
  duration?: number;
}

export const ConfettiEffect = ({ 
  isVisible, 
  particleCount = 50,
  colors = EFFECT_COLORS.CONFETTI,
  duration = 3000 
}: ConfettiEffectProps) => {
	if (!isVisible) return null;

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			className='fixed inset-0 pointer-events-none z-50'
		>
			{[...Array(particleCount)].map((_, i) => (
				<motion.div
					key={i}
					className='absolute w-2 h-2 rounded-full'
					initial={{
						opacity: 1,
						top: '50%',
						left: '50%',
						backgroundColor: colors[Math.floor(Math.random() * colors.length)],
					}}
					animate={{
						opacity: 0,
						top: `${Math.random() * 100}%`,
						left: `${Math.random() * 100}%`,
						rotate: Math.random() * 360,
					}}
					transition={{
						duration: (duration / 1000) + Math.random(),
						ease: 'easeOut',
						delay: Math.random() * 0.2,
					}}
				/>
			))}
		</motion.div>
	);
};

// Enhanced Pulse Effect with customization
interface PulseEffectProps {
  children: ReactNode;
  color?: string;
  intensity?: number;
  speed?: number;
}

export const PulseEffect = ({ 
  children, 
  color = EFFECT_COLORS.PULSE.PRIMARY,
  intensity = 15,
  speed = 1.5
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

// Enhanced Floating Card with customization
interface FloatingCardProps {
  children: ReactNode;
  distance?: number;
  duration?: number;
  delay?: number;
}

export const FloatingCard = ({ 
  children, 
  distance = ANIMATION_CONFIG.VALUES.FLOAT_DISTANCE,
  duration = 3,
  delay = 0
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

// New: Shake effect for errors
export const ShakeEffect = ({ children }: { children: ReactNode }) => (
	<motion.div
		animate={{
			x: [0, -10, 10, -10, 10, 0],
		}}
		transition={{
			duration: 0.5,
			ease: 'easeInOut',
		}}
	>
		{children}
	</motion.div>
);

// New: Glow effect for highlights
interface GlowEffectProps {
  children: ReactNode;
  color?: string;
  intensity?: string;
}

export const GlowEffect = ({ 
  children, 
  color = EFFECT_COLORS.GLOW.BLUE,
  intensity = 'medium'
}: GlowEffectProps) => (
	<motion.div
		animate={{
			boxShadow: [color, `${color}, ${color}`, color],
		}}
		transition={{
			duration: 2,
			repeat: Infinity,
			repeatType: 'reverse',
		}}
		style={{
			filter: `brightness(${intensity === 'high' ? 1.2 : intensity === 'low' ? 0.9 : 1.1})`,
		}}
	>
		{children}
	</motion.div>
);

// Background-specific variants
export const backgroundOrbVariants = {
	hidden: { opacity: 0, scale: 0.5 },
	visible: { opacity: 1, scale: 1 }
};

export const backgroundParticleVariants = {
	hidden: { opacity: 0 },
	visible: { opacity: 1 }
};
