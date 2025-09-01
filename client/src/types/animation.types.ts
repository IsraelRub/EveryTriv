/**
 * Animation types for EveryTriv client
 *
 * @module AnimationTypes
 * @description TypeScript interfaces for animation and particle systems
 * @used_by client/src/hooks/layers/ui/useOptimizedAnimations.ts, client/src/views/home/HomeView.tsx
 */

/**
 * Animation configuration options
 */
export interface AnimationOptions {
	/** Enable particle effects */
	enableParticles?: boolean;
	/** Enable score animations */
	enableScoreAnimations?: boolean;
	/** Maximum number of particles */
	particleLimit?: number;
	/** Animation performance settings */
	performance?: {
		/** Throttle animation updates */
		throttleMs?: number;
		/** Enable hardware acceleration */
		hardwareAcceleration?: boolean;
	};
}

/**
 * Individual particle properties
 */
export interface Particle {
	/** Unique particle identifier */
	id: number;
	/** X position */
	x: number;
	/** Y position */
	y: number;
	/** X velocity */
	vx: number;
	/** Y velocity */
	vy: number;
	/** Particle color */
	color: string;
	/** Particle size */
	size: number;
	/** Particle lifetime in milliseconds */
	life: number;
	/** Particle creation timestamp */
	created_at: number;
	/** Particle opacity */
	opacity?: number;
	/** Particle rotation */
	rotation?: number;
	/** Particle scale */
	scale?: number;
}

/**
 * Particle creation options
 */
export interface ParticleOptions {
	/** Particle color */
	color?: string;
	/** Array of particle colors for burst effects */
	colors?: string[];
	/** Particle size */
	size?: number;
	/** Particle velocity range */
	velocity?: {
		x?: { min: number; max: number };
		y?: { min: number; max: number };
	};
	/** Particle lifetime range */
	life?: { min: number; max: number };
	/** Number of particles to create */
	count?: number;
	/** Particle opacity */
	opacity?: number;
	/** Particle rotation */
	rotation?: number;
	/** Particle scale */
	scale?: number;
}

/**
 * Score animation state
 */
export interface ScoreAnimationState {
	/** Whether animation is currently running */
	isRunning: boolean;
	/** Current animation progress (0-1) */
	progress: number;
	/** Particles for score animation */
	particles: Particle[];
	/** Animation start time */
	startTime?: number;
	/** Animation duration */
	duration?: number;
	/** Target score value */
	targetScore?: number;
	/** Starting score value */
	startScore?: number;
}
