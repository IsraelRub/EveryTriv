import type { ANIMATION_COLORS, ANIMATION_FONTS, TRIVIA_WORDS, WORD_DIRECTIONS } from '@/constants';

export type WordDirection = (typeof WORD_DIRECTIONS)[number];

export type TriviaWord = (typeof TRIVIA_WORDS)[number];

export type AnimationFont = (typeof ANIMATION_FONTS)[number];

export type AnimationColor = (typeof ANIMATION_COLORS)[number];

export interface ScreenPosition {
	x: number;
	y: number;
}

export interface AnimatedWord {
	id: string;
	text: TriviaWord;
	startPosition: ScreenPosition;
	endPosition: ScreenPosition;
	direction: WordDirection;
	duration: number;
	color: AnimationColor;
	font: AnimationFont;
	fontSize: number;
	maxOpacity: number;
	rotation: number;
}
