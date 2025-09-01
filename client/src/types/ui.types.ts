/**
 * UI Component Types
 * Centralized types for all UI components
 * @module ClientUITypes
 * @used_by client/src/components/**, client/src/views/**
 */
import type { GenericDataValue, ValidationHookOptions, ValidationType } from 'everytriv-shared/types';
import { ChangeEvent, CSSProperties, FormEvent, InputHTMLAttributes, MouseEvent, ReactNode } from 'react';

import { AudioCategory } from '../constants';

// Lucide icon props interface
export interface LucideIconProps {
	size?: number | string;
	color?: string;
	className?: string;
	onClick?: (event: MouseEvent<SVGElement>) => void;
	style?: CSSProperties;
	strokeWidth?: number;
	fill?: string;
	stroke?: string;
}

// Base UI utility types
export interface BaseComponentProps {
	className?: string;
}

export interface BaseContainerProps extends BaseComponentProps {
	children: ReactNode;
}

export interface OptionalContainerProps extends BaseComponentProps {
	children?: ReactNode;
}

// Common size variants
export type SizeVariant = 'sm' | 'md' | 'lg' | 'xl';
export type ExtendedSizeVariant = SizeVariant | '2xl' | 'full';

// Common spacing variants
export type GapVariant = 'sm' | 'md' | 'lg' | 'xl';
export type PaddingVariant = GapVariant | 'none';

// Common background variants
export type BackgroundVariant = 'none' | 'glass' | 'dark' | 'light' | 'glass-strong';

// Utility types for better type safety
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Advanced utility types
export type Override<T, K extends keyof T, V> = Omit<T, K> & { [P in K]: V };
export type Merge<T, U> = Omit<T, keyof U> & U;
// Simplified DeepPartial - removed complex recursive type

// Common styling props
export interface StylingProps {
	isGlassy?: boolean;
	withGlow?: boolean;
}

// UI Component Props
export interface ButtonProps extends BaseContainerProps, StylingProps {
	variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'accent';
	size?: SizeVariant;
	disabled?: boolean;
	loading?: boolean;
	onClick?: (e?: MouseEvent<HTMLButtonElement>) => void;
	type?: 'button' | 'submit' | 'reset';
	title?: string;
	withAnimation?: boolean;
}

export type CardContentProps = BaseContainerProps;

// Animation Component Props
export interface AnimatedBackgroundProps extends OptionalContainerProps {
	intensity?: 'low' | 'medium' | 'high';
	theme?: 'blue' | 'purple' | 'green' | 'rainbow';
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

// Animation internal types
export interface Particle {
	id: number;
	x: number;
	y: number;
	size: number;
	color: string;
	life: number;
	velocity: { x: number; y: number };
}

export interface Orb {
	id: number;
	x: number;
	y: number;
	size: number;
	color: string;
	opacity: number;
}

export type CardHeaderProps = BaseContainerProps;

export interface CardProps extends BaseContainerProps, StylingProps {
	background?: 'glass' | 'solid' | 'transparent';
	padding?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface CardTitleProps extends BaseContainerProps {
	size?: SizeVariant;
}

export interface CustomDifficultyHistoryProps {
	isVisible: boolean;
	onSelect: (topic: string, difficulty: string) => void;
	onClose: () => void;
}

export interface FloatingCardProps extends BaseContainerProps {
	distance?: number;
	duration?: number;
	delay?: number;
}

// Custom Difficulty History Types
export interface HistoryItem {
	topic: string;
	difficulty: string;
	timestamp: number;
}

// Additional UI Component Types
export interface AnimatedContainerProps extends OptionalContainerProps {
	delay?: number;
	variants?: import('framer-motion').Variants;
}

// Social Share Types
export interface SocialShareProps extends BaseComponentProps {
	score: number;
	total: number;
	topic?: string;
	difficulty?: string;
}

export interface ModalProps extends BaseContainerProps, StylingProps {
	isOpen: boolean;
	onClose: () => void;
	title?: string;
	size?: SizeVariant;
	open?: boolean;
	disableEscapeKeyDown?: boolean;
	disableBackdropClick?: boolean;
}

export interface CardGridProps extends BaseContainerProps {
	columns?: number;
	gap?: GapVariant;
}

export interface PulseEffectProps extends BaseContainerProps {
	color?: string;
	intensity?: number;
	speed?: number;
}

export interface ResponsiveGridProps extends BaseContainerProps {
	breakpoints?: Record<string, number>;
	gap?: GapVariant;
	minWidth?: string;
}

export interface ScoreStats {
	correct: number;
	total: number;
	percentage: number;
	streak: number;
	grade?: string;
	color?: string;
}

export interface SelectOption {
	value: string;
	label: string;
	disabled?: boolean;
}

// Stats Component Props
export interface ScoringSystemProps extends BaseComponentProps {
	stats: {
		topicsPlayed: Record<string, number>;
		successRateByDifficulty: Record<string, { correct: number; total: number }>;
		totalGames: number;
		difficultyStats: Record<string, { correct: number; total: number }>;
	};
	score?: number;
	total?: number;
	topicsPlayed?: string[];
	difficultyStats?: Record<string, { correct: number; total: number }>;
	streak?: number;
}

export interface SectionProps extends BaseContainerProps {
	padding?: PaddingVariant;
	background?: BackgroundVariant;
}

export interface SelectProps extends BaseComponentProps, StylingProps {
	options: SelectOption[];
	value?: string;
	onChange?: (e: ChangeEvent<HTMLSelectElement>) => void;
	placeholder?: string;
	disabled?: boolean;
	error?: string;
	label?: string;
	size?: 'sm' | 'md' | 'lg';
}

// Stats Types (client-specific)
export interface Stats {
	// Add stats properties here
}

// Audio Component Props
export interface AudioControlsProps extends BaseComponentProps {
	showAdvanced?: boolean;
}

export type IconAnimation = 'none' | 'spin' | 'pulse' | 'bounce' | 'shake' | 'wiggle' | 'float' | 'glow';

export type IconColor =
	| 'primary'
	| 'secondary'
	| 'accent'
	| 'success'
	| 'warning'
	| 'error'
	| 'muted'
	| 'white'
	| 'black'
	| 'inherit';

export interface CategoryVolumeControlProps {
	category: AudioCategory;
	volume: number;
	onVolumeChange: (volume: number) => void;
	className?: string;
	label?: string;
}

export interface IconProps {
	name: string;
	size?: IconSize;
	color?: IconColor;
	animation?: IconAnimation;
	className?: string;
	onClick?: () => void;
	style?: CSSProperties;
}

export interface CountdownSoundsProps {
	seconds: number;
	onComplete?: () => void;
	className?: string;
	isActive?: boolean;
}

// Container and Layout Types
export interface ContainerProps extends BaseContainerProps {
	padding?: PaddingVariant;
	background?: BackgroundVariant;
	size?: ExtendedSizeVariant;
	centered?: boolean;
}

export interface GridLayoutProps extends BaseContainerProps {
	columns?: number;
	gap?: GapVariant;
	variant?: 'default' | 'form' | 'cards' | 'stats' | 'content' | 'layout' | 'game';
	size?: ExtendedSizeVariant;
	padding?: PaddingVariant;
	background?: BackgroundVariant;
	align?: 'start' | 'center' | 'end' | 'stretch';
	justify?: 'start' | 'center' | 'end' | 'between' | 'around';
}

// Performance Types - moved to separate section below

// Game Component Props
export interface GameModeUIProps {
	onModeSelect: (mode: string) => void;
	selectedMode?: string;
	className?: string;
	isVisible?: boolean;
	onSelectMode?: (config: {
		mode: import('everytriv-shared/constants/game.constants').GameMode;
		timeLimit?: number;
		questionLimit?: number;
	}) => void;
	onCancel?: () => void;
}

/**
 * UI Component Types
 * Centralized types for all UI components
 *
 * @module ClientUITypes
 * @description Client UI component type definitions
 * @used_by server: server/src/features/analytics/analytics.service.ts (UI analytics), client: client/src/components/ui/Button.tsx (Button component), client/src/components/icons/IconLibrary.tsx (IconLibrary component)
 */
// Icon Types
export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface InputProps extends BaseComponentProps, StylingProps {
	type?: string;
	placeholder?: string;
	value?: string;
	onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
	disabled?: boolean;
	error?: string;
	label?: string;
	required?: boolean;
	size?: 'sm' | 'md' | 'lg';
	withAnimation?: boolean;
}

export interface GameProps extends BaseComponentProps {
	trivia: import('everytriv-shared/types').TriviaQuestion;
	selected: number | null;
	score: number;
	onAnswer: (index: number) => Promise<void>;
	onNewQuestion: () => Promise<void>;
	gameMode: {
		mode: import('everytriv-shared/constants/game.constants').GameMode;
		timeLimit?: number;
		questionLimit?: number;
		questionsRemaining?: number;
		timeRemaining?: number;
		isGameOver: boolean;
		timer: { isRunning: boolean; startTime: number | null; timeElapsed: number };
	};
	onGameEnd: () => void;
}

// Performance settings type for better reusability
export type PerformanceSettings = PerformanceState['settings'];

export type PerformanceAction =
	| { type: 'START_OPERATION'; payload: { id: string; startTime: number } }
	| { type: 'COMPLETE_OPERATION'; payload: { id: string; duration: number } }
	| { type: 'ERROR_OPERATION'; payload: { id: string; error: string } }
	| { type: 'CLEAR_OPERATION'; payload: { id: string } }
	| { type: 'CLEAR_ALL_OPERATIONS' }
	| { type: 'UPDATE_SETTINGS'; payload: PerformanceSettingsUpdate };

export interface PerformanceContextType {
	state: PerformanceState;
	startOperation: (id: string) => void;
	completeOperation: (id: string) => void;
	errorOperation: (id: string, error: string) => void;
	clearOperation: (id: string) => void;
	clearAllOperations: () => void;
	updateSettings: (settings: PerformanceSettingsUpdate) => void;
	isOperationSlow: (id: string) => boolean;
	getOperationMetrics: (
		id: string
	) => PerformanceState['operations'] extends Map<string, infer V> ? V | undefined : never;
}

/**
 * עדכון הגדרות ביצועים
 * @used_by client/src/hooks/contexts/PerformanceContext.tsx
 */
export interface PerformanceSettingsUpdate {
	slowThreshold?: number;
	enableProfiling?: boolean;
	maxOperations?: number;
}

export interface GameTimerProps extends BaseComponentProps {
	timeRemaining: number;
	isRunning: boolean;
	onTimeUp: () => void;
	timeElapsed?: number;
	isGameOver?: boolean;
	mode?: import('everytriv-shared/constants/game.constants').GameMode;
}

// Performance Context Types
export interface PerformanceState {
	operations: Map<
		string,
		{
			startTime: number;
			duration: number | null;
			status: 'pending' | 'completed' | 'error';
			error?: string;
		}
	>;
	metrics: {
		totalOperations: number;
		averageDuration: number;
		slowOperations: string[];
	};
	settings: {
		slowThreshold: number; // milliseconds
		enableProfiling: boolean;
		maxOperations: number;
	};
}

export interface LeaderboardProps extends BaseComponentProps {
	entries?: import('everytriv-shared/types').LeaderboardEntry[];
	loading?: boolean;
	error?: string;
	userId?: string;
}

export interface StatsChartsProps extends BaseComponentProps {
	data: GenericDataValue;
	type: 'line' | 'bar' | 'pie';
	stats?: { totalGames: number; correctAnswers: number; topicsPlayed: Record<string, number> };
	loading?: boolean;
}

export interface TriviaFormProps extends BaseComponentProps {
	topic: string;
	difficulty: string;
	questionCount: 3 | 4 | 5;
	loading: boolean;
	onTopicChange: (topic: string) => void;
	onDifficultyChange: (difficulty: string) => void;
	onQuestionCountChange: (count: 3 | 4 | 5) => void;
	onSubmit: (e: FormEvent) => void;
	onGameModeSelectorClose: () => void;
	onGameModeSelect?: (config: {
		mode: import('everytriv-shared/constants/game.constants').GameMode;
		timeLimit?: number;
		questionLimit?: number;
	}) => void;
	showGameModeSelector?: boolean;
}

export interface TriviaGameProps extends BaseComponentProps {
	trivia: import('everytriv-shared/types').TriviaQuestion;
	selected: number | null;
	onAnswer: (index: number) => Promise<void>;
	onNewQuestion: () => Promise<void>;
	gameMode: {
		mode: import('everytriv-shared/constants/game.constants').GameMode;
		timeLimit?: number;
		questionLimit?: number;
		questionsRemaining?: number;
		timeRemaining?: number;
		isGameOver: boolean;
		timer: { isRunning: boolean; startTime: number | null; timeElapsed: number };
	};
	onGameEnd: () => void;
}

export interface UserStatsResponse {
	userId: string;
	username: string;
	score: number;
	rank: number;
	totalQuestions: number;
	correctAnswers: number;
	topicsPlayed: Record<string, number>;
	difficultyStats: Record<string, { correct: number; total: number }>;
	lastPlayed: string;
}

// Validation Component Types - Imported from shared
export type {
	ValidationIconProps,
	ValidationMessageProps,
	ValidationStatus,
	ValidationStatusIndicatorProps,
} from 'everytriv-shared/types/validation.types';

// Home Component Types
export interface CurrentDifficultyProps {
	className?: string;
	delay?: number;
	topic: string;
	difficulty: string;
	onShowHistory: () => void;
}

export interface ErrorBannerProps {
	message: string;
	difficulty: string;
}

export interface HomeTitleProps {
	className?: string;
	delay?: number;
}

// ValidatedInput Component Types
export type { ValidationType } from 'everytriv-shared/types/validation.types';

export interface ValidatedInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'size'> {
	/** Validation type to use */
	validationType: ValidationType;
	/** Initial value */
	initialValue?: string;
	/** Validation options */
	validationOptions?: ValidationHookOptions;
	/** Custom onChange handler */
	onChange?: (value: string, isValid: boolean, errors: string[]) => void;
	/** Show validation icon */
	showValidationIcon?: boolean;
	/** Show error messages */
	showErrors?: boolean;
	/** Custom error message renderer */
	renderError?: (errors: string[]) => ReactNode;
	/** Glass effect styling */
	isGlassy?: boolean;
	/** Size variant */
	size?: 'sm' | 'md' | 'lg';
	/** Custom className */
	className?: string;
}
