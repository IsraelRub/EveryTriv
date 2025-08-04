import { motion } from 'framer-motion';
import { ReactNode } from 'react';

// Fade and slide variants
export const fadeInVariants = {
	hidden: { opacity: 0, y: 20 },
	visible: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.6, ease: 'easeOut' },
	},
};

// Scale variants
export const popVariants = {
	hidden: { scale: 0.8, opacity: 0 },
	visible: {
		scale: 1,
		opacity: 1,
		transition: { type: 'spring', stiffness: 300, damping: 15 },
	},
};

// Stagger children animation
export const staggerContainer = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: {
			staggerChildren: 0.1,
			delayChildren: 0.2,
		},
	},
};

// Animated confetti effect for achievements
export const ConfettiEffect = ({ isVisible }: { isVisible: boolean }) => {
	if (!isVisible) return null;

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			className='fixed inset-0 pointer-events-none'
		>
			{[...Array(50)].map((_, i) => (
				<motion.div
					key={i}
					className='absolute w-2 h-2 rounded-full'
					initial={{
						opacity: 1,
						top: '50%',
						left: '50%',
						backgroundColor: getRandomColor(),
					}}
					animate={{
						opacity: 0,
						top: `${Math.random() * 100}%`,
						left: `${Math.random() * 100}%`,
						rotate: Math.random() * 360,
					}}
					transition={{
						duration: 1 + Math.random(),
						ease: 'easeOut',
						delay: Math.random() * 0.2,
					}}
				/>
			))}
		</motion.div>
	);
};

// Pulse effect for correct answers
export const PulseEffect = ({ children }: { children: ReactNode }) => (
	<motion.div
		animate={{
			scale: [1, 1.05, 1],
			boxShadow: [
				'0 0 0 0 rgba(102, 126, 234, 0)',
				'0 0 0 15px rgba(102, 126, 234, 0.3)',
				'0 0 0 0 rgba(102, 126, 234, 0)',
			],
		}}
		transition={{
			duration: 1.5,
			repeat: Infinity,
			repeatType: 'loop',
		}}
	>
		{children}
	</motion.div>
);

// Floating effect for cards
export const FloatingCard = ({ children }: { children: ReactNode }) => (
	<motion.div
		animate={{
			y: [0, -10, 0],
		}}
		transition={{
			duration: 3,
			repeat: Infinity,
			repeatType: 'reverse',
			ease: 'easeInOut',
		}}
	>
		{children}
	</motion.div>
);

// Helper function for random confetti colors
const getRandomColor = () => {
	const colors = [
		'#FF6B6B', // Red
		'#4ECDC4', // Teal
		'#45B7D1', // Blue
		'#96CEB4', // Green
		'#FFEEAD', // Yellow
		'#D4A5A5', // Pink
		'#9B59B6', // Purple
	];
	return colors[Math.floor(Math.random() * colors.length)];
};
