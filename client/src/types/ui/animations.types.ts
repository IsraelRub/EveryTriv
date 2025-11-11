/**
 * Animation Types
 * @module AnimationTypes
 * @description Animation-related types that remain in use across the UI layer
 */

// Icon Animation
export interface IconAnimation {
	type: 'bounce' | 'pulse' | 'rotate' | 'shake' | 'none';
	duration?: number;
	delay?: number;
	iterationCount?: number | 'infinite';
}
