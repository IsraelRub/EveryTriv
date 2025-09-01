import { useCallback, useEffect, useRef, useState } from 'react';

import { AnimationOptions, ParticleOptions, ScoreAnimationState } from '../../../types';
import { Particle } from '../../../types/animation.types';
import { useOperationTimer } from '../../contexts';
import { usePrevious, useThrottle } from '../utils';

export function useOptimizedAnimations(score: number, options: AnimationOptions = {}) {
	const { enableParticles = true, enableScoreAnimations = true, particleLimit = 50 } = options;

	const animationDuration = 1000;

	const { start, complete } = useOperationTimer('animations');
	const [particles, setParticles] = useState<Particle[]>([]);
	const [scoreAnimation, setScoreAnimation] = useState<ScoreAnimationState>({
		isRunning: false,
		progress: 0,
		particles: [],
	});
	const particleIdRef = useRef(0);
	const animationFrameRef = useRef<number>();
	const prevScore = usePrevious(score);

	// Throttled particle updates for performance
	const throttledUpdateParticles = useThrottle(() => {
		setParticles(prev => {
			const now = Date.now();
			return prev
				.filter(particle => now - particle.created_at < particle.life)
				.map(particle => ({
					...particle,
					x: particle.x + particle.vx,
					y: particle.y + particle.vy,
					vy: particle.vy + 0.1, // Gravity
				}));
		});
	}, 16); // ~60fps

	// Animation loop
	useEffect(() => {
		if (enableParticles && particles.length > 0) {
			const animate = () => {
				start();
				throttledUpdateParticles();
				complete();
				animationFrameRef.current = requestAnimationFrame(animate);
			};
			animationFrameRef.current = requestAnimationFrame(animate);
		}

		return () => {
			if (animationFrameRef.current) {
				cancelAnimationFrame(animationFrameRef.current);
			}
		};
	}, [enableParticles, particles.length, throttledUpdateParticles, start, complete]);

	// Score animation effect
	useEffect(() => {
		if (enableScoreAnimations && prevScore !== undefined && score > prevScore) {
			setScoreAnimation(prev => ({
				...prev,
				isRunning: true,
				startTime: Date.now(),
				targetScore: score,
				startScore: prevScore ?? 0,
			}));

			const timer = setTimeout(() => {
				setScoreAnimation(prev => ({ ...prev, isRunning: false }));
			}, animationDuration);

			return () => clearTimeout(timer);
		}
	}, [score, prevScore, enableScoreAnimations, animationDuration]);

	// Add particle burst
	const addParticle = useCallback(
		(x: number, y: number, options: ParticleOptions = {}) => {
			if (!enableParticles || particles.length >= particleLimit) return;

			const particle: Particle = {
				id: particleIdRef.current++,
				x,
				y,
				vx: options.velocity?.x?.min
					? options.velocity.x.min + Math.random() * (options.velocity.x.max - options.velocity.x.min)
					: (Math.random() - 0.5) * 4,
				vy: options.velocity?.y?.min
					? options.velocity.y.min + Math.random() * (options.velocity.y.max - options.velocity.y.min)
					: -Math.random() * 3 - 1,
				color: options.colors?.[0] ?? `hsl(${Math.random() * 360}, 70%, 60%)`,
				size: options.size ?? 3,
				life: options.life?.min ? options.life.min + Math.random() * (options.life.max - options.life.min) : 2000,
				created_at: Date.now(),
			};

			setParticles(prev => [...prev, particle]);
		},
		[enableParticles, particles.length, particleLimit]
	);

	// Add particle burst
	const addParticleBurst = useCallback(
		(x: number, y: number, options: ParticleOptions = {}) => {
			if (!enableParticles) return;

			const count = options.count ?? 10;
			const newParticles: Particle[] = [];

			for (let i = 0; i < count; i++) {
				if (particles.length + newParticles.length >= particleLimit) break;

				const particle: Particle = {
					id: particleIdRef.current++,
					x,
					y,
					vx: options.velocity?.x?.min
						? options.velocity.x.min + Math.random() * (options.velocity.x.max - options.velocity.x.min)
						: (Math.random() - 0.5) * 4,
					vy: options.velocity?.y?.min
						? options.velocity.y.min + Math.random() * (options.velocity.y.max - options.velocity.y.min)
						: -Math.random() * 3 - 1,
					color: options.colors?.[i % (options.colors?.length || 1)] ?? `hsl(${Math.random() * 360}, 70%, 60%)`,
					size: options.size ?? 3,
					life: options.life?.min ? options.life.min + Math.random() * (options.life.max - options.life.min) : 2000,
					created_at: Date.now(),
				};

				newParticles.push(particle);
			}

			setParticles(prev => [...prev, ...newParticles]);
		},
		[enableParticles, particles.length, particleLimit]
	);

	// Clear all particles
	const clearParticles = useCallback(() => {
		setParticles([]);
	}, []);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (animationFrameRef.current) {
				cancelAnimationFrame(animationFrameRef.current);
			}
		};
	}, []);

	return {
		particles,
		scoreAnimation,
		addParticle,
		addParticleBurst,
		clearParticles,
		isAnimating: scoreAnimation.isRunning,
	};
}

// Specialized score animations hook
export function useScoreAnimations(score: number) {
	return useOptimizedAnimations(score, {
		enableParticles: false,
		enableScoreAnimations: true,
	});
}
