/**
 * Animation Types
 * @module AnimationTypes
 * @description Animation-related types and interfaces
 */

import { ReactNode } from 'react';

import type { BasePerformanceOperation, PerformanceMetrics, PerformanceSettings } from '@shared/types';

export interface AnimationOptions {
	enableParticles?: boolean;
	enableScoreAnimations?: boolean;
	particleLimit?: number;
	performance?: {
		throttleMs?: number;
		hardwareAcceleration?: boolean;
	};
}

export interface Particle {
	id: number;
	x: number;
	y: number;
	vx: number;
	vy: number;
	size: number;
	color: string;
	opacity: number;
	life: number;
	maxLife: number;
	created_at: number;
	velocity: { x: number; y: number };
	rotation: number;
	scale: number;
}

export interface Orb {
	id: number;
	x: number;
	y: number;
	size: number;
	color: string;
	opacity: number;
	phase: number;
	speed: number;
}

export interface AnimatedBackgroundProps {
	options?: AnimationOptions;
	className?: string;
	enabled?: boolean;
	performanceContext?: PerformanceContextType;
	children?: ReactNode;
	intensity?: string;
	theme?: string;
	particles?: boolean;
	orbs?: boolean;
	gradient?: boolean;
	interactive?: boolean;
	particlesCount?: number;
	animationSpeed?: number;
	enableParticles?: boolean;
	enableGradients?: boolean;
	enableFloating?: boolean;
}

export interface PerformanceContextType {
	state: PerformanceState;
	startOperation: (id: string) => void;
	completeOperation: (id: string) => void;
	errorOperation: (id: string, error: string) => void;
	clearOperation: (id: string) => void;
	clearAllOperations: () => void;
	updateSettings: (settings: PerformanceSettingsUpdate) => void;
	isOperationSlow: (id: string) => boolean;
	getOperationMetrics: (id: string) => Omit<BasePerformanceOperation, 'id' | 'metadata'> | undefined;
}

export interface PerformanceState {
	operations: Map<string, Omit<BasePerformanceOperation, 'id' | 'metadata'>>;
	metrics: AnimationPerformanceMetrics;
	settings: AnimationPerformanceSettings;
}

/**
 * Animation-specific performance metrics (subset of PerformanceMetrics)
 * @type AnimationPerformanceMetrics
 * @description Performance metrics for animations - includes only relevant fields
 */
export type AnimationPerformanceMetrics = Pick<
	PerformanceMetrics,
	'totalOperations' | 'averageDuration' | 'slowOperations'
>;

/**
 * Animation-specific performance settings
 * @type AnimationPerformanceSettings
 * @description Performance settings for animations with profiling option
 */
export type AnimationPerformanceSettings = Pick<PerformanceSettings, 'slowThreshold' | 'maxOperations'> & {
	enableProfiling: boolean;
};

/**
 * Performance settings update for animations
 * @interface PerformanceSettingsUpdate
 * @description Partial settings update for animation performance
 */
export interface PerformanceSettingsUpdate extends Partial<AnimationPerformanceSettings> {}

// Icon Animation
export interface IconAnimation {
	type: 'bounce' | 'pulse' | 'rotate' | 'shake' | 'none';
	duration?: number;
	delay?: number;
	iterationCount?: number | 'infinite';
}
