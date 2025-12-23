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

// Animated word configuration

export interface AnimatedWord {
	id: string;
	text: TriviaWord;
	startPosition: Position;
	endPosition: Position;
	direction: WordDirection;
	duration: number;
	color: AnimationColor;
	font: AnimationFont;
	fontSize: number;
	maxOpacity: number;
	rotation: number;
}
