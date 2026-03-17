export const ANIMATION_FONTS = [
	'var(--font-family-sans)',
	'var(--font-family-mono)',
	'Arial, Helvetica, sans-serif',
	'Tahoma, Verdana, sans-serif',
	'Verdana, Tahoma, sans-serif',
	'"Times New Roman", Times, serif',
	'"Segoe UI", Tahoma, Arial, sans-serif',
	'"Lucida Sans Unicode", "Lucida Grande", sans-serif',
	'"David", "David CE", Arial, sans-serif',
	'"FrankRuehl", "Frank Ruhl", "Times New Roman", serif',
	'"Narkisim", "Narkisim CE", Arial, sans-serif',
	'"Rod", Arial, sans-serif',
	'"Guttman", Arial, sans-serif',
	'"Trebuchet MS", Tahoma, sans-serif',
] as const;

export const ANIMATION_COLORS = [
	// Primary color variations (blue)
	'hsl(217 91% 60%)', // primary-500
	'hsl(214 100% 93%)', // primary-100
	'hsl(212 96% 78%)', // primary-300
	'hsl(224 76% 48%)', // primary-700
	'hsl(226 57% 35%)', // primary-900

	// Secondary color variations (purple)
	'hsl(292 84% 61%)', // secondary-500
	'hsl(295 100% 94%)', // secondary-100
	'hsl(291 93% 83%)', // secondary-300
	'hsl(295 72% 40%)', // secondary-700
	'hsl(296 63% 28%)', // secondary-900

	// Accent color variations (green/teal)
	'hsl(160 84% 39%)', // accent-500
	'hsl(149 80% 90%)', // accent-100
	'hsl(156 72% 67%)', // accent-300
	'hsl(163 94% 24%)', // accent-700
	'hsl(186 94% 42%)', // cyan (complementary to accent)

	// Subtle muted variations for depth
	'hsl(215 20% 65%)', // muted-foreground
	'hsl(217 33% 17%)', // muted
] as const;

export enum WordDirection {
	DiagonalUpRight = 'diagonal-up-right',
	DiagonalUpLeft = 'diagonal-up-left',
	DiagonalDownRight = 'diagonal-down-right',
	DiagonalDownLeft = 'diagonal-down-left',
	HorizontalRight = 'horizontal-right',
	HorizontalLeft = 'horizontal-left',
	VerticalUp = 'vertical-up',
	VerticalDown = 'vertical-down',
}

export const WORD_DIRECTIONS: WordDirection[] = Object.values(WordDirection);

export const BACKGROUND_ANIMATION_CONFIG = {
	wordCount: 18,
	minDuration: 15,
	maxDuration: 35,
	minFontSize: 1.2,
	maxFontSize: 2.5,
	minOpacity: 0.05,
	maxOpacity: 0.12,
	fadeFraction: 0.1,
	zIndex: 0,
	spawnDelay: 200,
	minRotation: -15,
	maxRotation: 15,
	movementOffset: 120,
	minStartPosition: -20,
	maxStartPosition: 100,
	fontWeight: 700,
} as const;
