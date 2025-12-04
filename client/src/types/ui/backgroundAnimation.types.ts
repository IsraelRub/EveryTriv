/**
 * Background Animation Types
 * Type definitions for animated background words effect
 */

import type { ANIMATION_COLORS, ANIMATION_FONTS, TRIVIA_WORDS, WORD_DIRECTIONS } from '@/constants';

/**
 * Possible diagonal directions for word movement
 */
export type WordDirection = (typeof WORD_DIRECTIONS)[number];

/**
 * Trivia word type
 */
export type TriviaWord = (typeof TRIVIA_WORDS)[number];

/**
 * Animation font type
 */
export type AnimationFont = (typeof ANIMATION_FONTS)[number];

/**
 * Animation color type
 */
export type AnimationColor = (typeof ANIMATION_COLORS)[number];

/**
 * Position coordinates
 */
export interface Position {
	x: number;
	y: number;
}

/**
 * Animated word configuration
 */
export interface AnimatedWord {
	/** Unique identifier for the word */
	id: string;

	/** The text content to display */
	text: TriviaWord;

	/** Starting position (percentage of viewport) */
	startPosition: Position;

	/** Ending position (percentage of viewport) */
	endPosition: Position;

	/** Direction of movement */
	direction: WordDirection;

	/** Animation duration in seconds */
	duration: number;

	/** Color from palette */
	color: AnimationColor;

	/** Font family */
	font: AnimationFont;

	/** Font size in rem */
	fontSize: number;

	/** Maximum opacity (will fade in/out from 0 to this value) */
	maxOpacity: number;

	/** Rotation angle in degrees */
	rotation: number;
}

/**
 * Animation configuration interface
 */
export interface AnimationConfig {
	wordCount: number;
	minDuration: number;
	maxDuration: number;
	minFontSize: number;
	maxFontSize: number;
	minOpacity: number;
	maxOpacity: number;
	fadeInPercent: number;
	fadeOutPercent: number;
	zIndex: number;
	spawnDelay: number;
}
