import type { ANIMATION_COLORS, ANIMATION_FONTS, BackgroundWordMotionPath, WordDirection } from '@/constants';
import type { Point2d } from './charts.types';

export interface BuildBackgroundWordPathParams {
	readonly start: Point2d;
	readonly end: Point2d;
	readonly motionPath: BackgroundWordMotionPath;
	readonly waveAmplitude: number;
	readonly waveCycles: number;
	readonly arcBulge: number;
	readonly zigzagAmplitude: number;
	readonly serpentineOut: number;
	readonly serpentineIn: number;
}

export interface AnimatedWord {
	id: string;
	text: string;
	startPosition: Point2d;
	endPosition: Point2d;
	direction: WordDirection;
	pathPositions: readonly Point2d[];
	rotationDrift: number;
	duration: number;
	color: AnimationColor;
	font: AnimationFont;
	fontSize: number;
	maxOpacity: number;
	rotation: number;
}
export type AnimationFont = (typeof ANIMATION_FONTS)[number];

export type AnimationColor = (typeof ANIMATION_COLORS)[number];
