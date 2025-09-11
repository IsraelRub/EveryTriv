import { motion } from 'framer-motion';
import { FC, useEffect, useState, useCallback, useRef, useMemo } from 'react';

import { EFFECT_COLORS } from '../../constants/ui/animation.constants';
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
	
	const animationFrameRef = useRef<number>();
	const lastUpdateRef = useRef<number>(0);

	// Initialize particles
	useEffect(() => {
		if (!particles) return;

		const initialParticles: Particle[] = Array.from({ length: particlesCount }, (_, index) => {
			const velocity = {
				x: (Math.random() - 0.5) * 0.5,
				y: (Math.random() - 0.5) * 0.5,
			};
			return {
				id: index,
				x: Math.random() * window.innerWidth,
				y: Math.random() * window.innerHeight,
				vx: velocity.x,
				vy: velocity.y,
				velocity: velocity,
				size: Math.random() * 3 + 1,
				color: EFFECT_COLORS.PARTICLES[Math.floor(Math.random() * EFFECT_COLORS.PARTICLES.length)],
				life: Math.random() * 5000 + 2000,
				created_at: Date.now(),
				opacity: Math.random() * 0.8 + 0.2,
				maxLife: Math.random() * 5000 + 2000,
				rotation: Math.random() * 360,
				scale: Math.random() * 0.5 + 0.5,
			};
		});

		setParticlesList(initialParticles);
	}, [particles, particlesCount]);

	// Initialize orbs
	useEffect(() => {
		if (!orbs) return;

		const initialOrbs: Orb[] = Array.from({ length: 8 }, (_, index) => ({
			id: index,
			x: Math.random() * window.innerWidth,
			y: Math.random() * window.innerHeight,
			size: Math.random() * 200 + 100,
			color: EFFECT_COLORS.ORBS[Math.floor(Math.random() * EFFECT_COLORS.ORBS.length)],
			opacity: Math.random() * 0.3 + 0.1,
			phase: Math.random() * Math.PI * 2,
			speed: Math.random() * 0.02 + 0.01,
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

	// Optimized particle update function
	const updateParticles = useCallback(() => {
		setParticlesList((prev) =>
			prev.map((particle) => ({
				...particle,
				x: particle.x + particle.velocity.x,
				y: particle.y + particle.velocity.y,
				life: particle.life - 16, // 60fps
			}))
		);
	}, []);

	// Optimized orb update function
	const updateOrbs = useCallback(() => {
		setOrbsList((prev) =>
			prev.map((orb) => ({
				...orb,
				x: orb.x + (Math.random() - 0.5) * 0.5,
				y: orb.y + (Math.random() - 0.5) * 0.5,
			}))
		);
	}, []);

	// Unified animation loop using requestAnimationFrame
	useEffect(() => {
		if (!particles && !orbs) return;

		const animate = (timestamp: number) => {
			// Limit to 60fps
			if (timestamp - lastUpdateRef.current >= 16) {
				if (particles) updateParticles();
				if (orbs) updateOrbs();
				lastUpdateRef.current = timestamp;
			}
			
			animationFrameRef.current = requestAnimationFrame(animate);
		};

		animationFrameRef.current = requestAnimationFrame(animate);

		return () => {
			if (animationFrameRef.current) {
				cancelAnimationFrame(animationFrameRef.current);
			}
		};
	}, [particles, orbs, updateParticles, updateOrbs]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (animationFrameRef.current) {
				cancelAnimationFrame(animationFrameRef.current);
			}
		};
	}, []);

	// Memoized particle elements
	const particleElements = useMemo(() => 
		particlesList.map((particle) => (
			<motion.div
				key={particle.id}
				variants={backgroundParticleVariants}
				initial="hidden"
				animate="visible"
				className="absolute rounded-full pointer-events-none"
				style={{
					left: particle.x,
					top: particle.y,
					width: particle.size,
					height: particle.size,
					backgroundColor: particle.color,
					opacity: particle.life / 5000,
				}}
			/>
		)), [particlesList]
	);

	// Memoized orb elements
	const orbElements = useMemo(() => 
		orbsList.map((orb) => (
			<motion.div
				key={orb.id}
				variants={backgroundOrbVariants}
				initial="hidden"
				animate="visible"
				className="absolute rounded-full pointer-events-none blur-sm"
				style={{
					left: orb.x,
					top: orb.y,
					width: orb.size,
					height: orb.size,
					backgroundColor: orb.color,
					opacity: orb.opacity,
				}}
			/>
		)), [orbsList]
	);

	return (
		<div className={`relative overflow-hidden ${className}`}>
			{/* Gradient Background */}
			{gradient && (
				<motion.div
					className="absolute inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900"
					variants={createFadeVariants("up")}
					initial="hidden"
					animate="visible"
				/>
			)}

			{/* Interactive Mouse Effect */}
			{interactive && (
				<motion.div
					className="absolute w-96 h-96 rounded-full pointer-events-none blur-3xl opacity-20"
					style={{
						left: mousePosition.x - 192,
						top: mousePosition.y - 192,
						background: `radial-gradient(circle, ${EFFECT_COLORS.INTERACTIVE} 0%, transparent 70%)`,
					}}
					animate={{
						scale: [1, 1.2, 1],
						opacity: [0.2, 0.3, 0.2],
					}}
					transition={{
						duration: 2,
						repeat: Infinity,
						ease: "easeInOut",
					}}
				/>
			)}

			{/* Particles */}
			{particles && particleElements}

			{/* Orbs */}
			{orbs && orbElements}

			{/* Content */}
			<div className="relative z-10">{children}</div>
		</div>
	);
};

export default AnimatedBackground;
