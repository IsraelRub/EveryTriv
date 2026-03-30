import type { ANIMATION_COLORS, ANIMATION_FONTS, WordDirection } from '@/constants';



export interface ScreenPosition {
	x: number;
	y: number;
}

export interface AnimatedWord {
	id: string;

	text: string;
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
export type AnimationFont = (typeof ANIMATION_FONTS)[number];

export type AnimationColor = (typeof ANIMATION_COLORS)[number];

