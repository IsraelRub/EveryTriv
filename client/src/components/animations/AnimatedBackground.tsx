import { motion } from 'framer-motion';
import { FC, useEffect, useState } from 'react';

import { ANIMATION_CONFIG, EFFECT_COLORS } from '../../constants/animation.constants';
import { AnimatedBackgroundProps, Orb, Particle } from '../../types';
import { backgroundOrbVariants, backgroundParticleVariants, createFadeVariants } from './AnimationEffects';

/**
 * Animated Background Component
 *
 * @module AnimatedBackground
 * @description Advanced animated background with particles, orbs, and dynamic effects
 * @used_by client/src/views, client/src/components
 */

export const AnimatedBackground: FC<AnimatedBackgroundProps> = ({
	particles = true,
	orbs = true,
	gradient = true,
	interactive = true,
	particlesCount = 50,
	className = '',
	children,
}) => {
	const [particlesList, setParticlesList] = useState<Particle[]>([]);
	const [orbsList, setOrbsList] = useState<Orb[]>([]);
	const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

	// Initialize particles
	useEffect(() => {
		if (!particles) return;

		const initialParticles: Particle[] = Array.from({ length: particlesCount }, (_, i) => ({
			id: i,
			x: Math.random() * window.innerWidth,
			y: Math.random() * window.innerHeight,
			size: Math.random() * 3 + 1,
			color: EFFECT_COLORS.PARTICLES[Math.floor(Math.random() * EFFECT_COLORS.PARTICLES.length)],
			life: Math.random() * 5000 + 2000,
			velocity: {
				x: (Math.random() - 0.5) * 0.5,
				y: (Math.random() - 0.5) * 0.5,
			},
		}));

		setParticlesList(initialParticles);
	}, [particles]);

	// Initialize orbs
	useEffect(() => {
		if (!orbs) return;

		const initialOrbs: Orb[] = Array.from({ length: 8 }, (_, i) => ({
			id: i,
			x: Math.random() * window.innerWidth,
			y: Math.random() * window.innerHeight,
			size: Math.random() * 200 + 100,
			color: EFFECT_COLORS.ORBS[Math.floor(Math.random() * EFFECT_COLORS.ORBS.length)],
			opacity: Math.random() * 0.3 + 0.1,
		}));

		setOrbsList(initialOrbs);
	}, [orbs]);

	// Mouse interaction
	useEffect(() => {
		if (!interactive) return;

		const handleMouseMove = (e: MouseEvent) => {
			setMousePosition({ x: e.clientX, y: e.clientY });
		};

		window.addEventListener('mousemove', handleMouseMove);
		return () => window.removeEventListener('mousemove', handleMouseMove);
	}, [interactive]);

	// Animate particles
	useEffect(() => {
		if (!particles) return;

		const interval = setInterval(() => {
			setParticlesList((prev) =>
				prev.map((particle) => ({
					...particle,
					x: particle.x + particle.velocity.x,
					y: particle.y + particle.velocity.y,
					life: particle.life - 16, // 60fps
				}))
			);
		}, 16);

		return () => clearInterval(interval);
	}, [particles]);

	// Animate orbs
	useEffect(() => {
		if (!orbs) return;

		const interval = setInterval(() => {
			setOrbsList((prev) =>
				prev.map((orb) => ({
					...orb,
					x: orb.x + Math.sin(Date.now() * 0.001 + orb.id) * 0.5,
					y: orb.y + Math.cos(Date.now() * 0.001 + orb.id) * 0.5,
				}))
			);
		}, 16);

		return () => clearInterval(interval);
	}, [orbs]);

	// Gradient animation variants
	const gradientVariants = createFadeVariants('up', 50, ANIMATION_CONFIG.DURATION.SLOW);

	return (
		<div className={`relative overflow-hidden ${className}`}>
			{/* Gradient Background */}
			{gradient && (
				<motion.div
					variants={gradientVariants}
					initial='hidden'
					animate='visible'
					className='absolute inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900'
					style={{
						background: `linear-gradient(135deg, 
							${EFFECT_COLORS.GRADIENT.START} 0%, 
							${EFFECT_COLORS.GRADIENT.MIDDLE} 50%, 
							${EFFECT_COLORS.GRADIENT.END} 100%)`,
					}}
				/>
			)}

			{/* Animated Orbs */}
			{orbs &&
				orbsList.map((orb) => (
					<motion.div
						key={orb.id}
						variants={backgroundOrbVariants}
						initial='hidden'
						animate='visible'
						className='absolute rounded-full blur-xl pointer-events-none'
						style={{
							left: orb.x,
							top: orb.y,
							width: orb.size,
							height: orb.size,
							backgroundColor: orb.color,
							opacity: orb.opacity,
							transform: `translate(-50%, -50%)`,
						}}
						transition={{
							duration: ANIMATION_CONFIG.DURATION.SLOW,
							ease: ANIMATION_CONFIG.EASING.EASE_IN_OUT,
						}}
					/>
				))}

			{/* Animated Particles */}
			{particles &&
				particlesList
					.filter((particle) => particle.life > 0)
					.map((particle) => (
						<motion.div
							key={particle.id}
							variants={backgroundParticleVariants}
							initial='hidden'
							animate='visible'
							className='absolute rounded-full pointer-events-none'
							style={{
								left: particle.x,
								top: particle.y,
								width: particle.size,
								height: particle.size,
								backgroundColor: particle.color,
								opacity: particle.life / 5000,
							}}
							transition={{
								duration: ANIMATION_CONFIG.DURATION.NORMAL,
								ease: ANIMATION_CONFIG.EASING.EASE_OUT,
							}}
						/>
					))}

			{/* Interactive Mouse Trail */}
			{interactive && (
				<motion.div
					className='absolute w-4 h-4 rounded-full pointer-events-none'
					style={{
						left: mousePosition.x,
						top: mousePosition.y,
						transform: 'translate(-50%, -50%)',
						background: `radial-gradient(circle, ${EFFECT_COLORS.INTERACTIVE} 0%, transparent 70%)`,
					}}
					animate={{
						scale: [1, 1.5, 1],
						opacity: [0.3, 0.6, 0.3],
					}}
					transition={{
						duration: 2,
						repeat: Infinity,
						ease: ANIMATION_CONFIG.EASING.EASE_IN_OUT,
					}}
				/>
			)}

			{/* Content */}
			<div className='relative z-10'>{children}</div>
		</div>
	);
};

export default AnimatedBackground;
