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
	/** Number of words to display simultaneously */
	wordCount: 18,

	/** Minimum animation duration in seconds */
	minDuration: 15,

	/** Maximum animation duration in seconds */
	maxDuration: 35,

	/** Minimum font size in rem */
	minFontSize: 1.2,

	/** Maximum font size in rem */
	maxFontSize: 2.5,

	/** Minimum opacity for words */
	minOpacity: 0.05,

	/** Maximum opacity for words */
	maxOpacity: 0.12,

	/** Fade in duration as percentage of total animation */
	fadeInPercent: 10,

	/** Fade out duration as percentage of total animation */
	fadeOutPercent: 10,

	/** Z-index for background layer */
	zIndex: 0,

	/** Delay between word spawns in milliseconds */
	spawnDelay: 200,
} as const;
