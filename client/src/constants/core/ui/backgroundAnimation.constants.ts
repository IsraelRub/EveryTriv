/**
 * Background Animation Constants
 * Constants for animated background words effect
 */

/**
 * Trivia topic words to display in the background
 */
export const TRIVIA_WORDS = [
	'History',
	'Science',
	'Sports',
	'Geography',
	'Art',
	'Music',
	'Cinema',
	'Literature',
	'Technology',
	'Mathematics',
	'Biology',
	'Physics',
	'Chemistry',
	'Politics',
	'Economics',
	'Philosophy',
	'Psychology',
	'Astronomy',
	'Mythology',
	'Culture',
	'Nature',
	'Animals',
	'Food',
	'Fashion',
	'Architecture',
	'Medicine',
	'Engineering',
	'Space',
	'Ocean',
	'Adventure',
] as const;

/**
 * Font families for animated words
 */
export const ANIMATION_FONTS = [
	'var(--font-family-sans)',
	'Georgia, serif',
	'Courier New, monospace',
	'Arial, sans-serif',
	'Times New Roman, serif',
	'Verdana, sans-serif',
	'Trebuchet MS, sans-serif',
	'Impact, fantasy',
	'Comic Sans MS, cursive',
] as const;

/**
 * Color values from the project palette
 */
export const ANIMATION_COLORS = [
	'hsl(217 91% 60%)', // primary
	'hsl(292 84% 61%)', // secondary
	'hsl(160 84% 39%)', // accent
	'hsl(38 92% 50%)', // warning
	'hsl(186 94% 42%)', // cyan
	'hsl(214 100% 93%)', // primary-100
	'hsl(295 100% 94%)', // secondary-100
	'hsl(149 80% 90%)', // success-100
] as const;

/**
 * Diagonal directions for word movement
 */
export const WORD_DIRECTIONS = [
	'diagonal-up-right',
	'diagonal-up-left',
	'diagonal-down-right',
	'diagonal-down-left',
	'horizontal-right',
	'horizontal-left',
	'vertical-up',
	'vertical-down',
] as const;

/**
 * Background animation configuration
 */
export const BACKGROUND_ANIMATION_CONFIG = {
	wordCount: 18,
	minDuration: 15,
	maxDuration: 35,
	minFontSize: 1.2,
	maxFontSize: 2.5,
	minOpacity: 0.05,
	maxOpacity: 0.12,
	fadeInPercent: 10,
	fadeOutPercent: 10,
	zIndex: 0,
	spawnDelay: 200,
} as const;
