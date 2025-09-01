/**
 * Client Types Index
 *
 * @module ClientTypes
 * @description Central export file for all client-side TypeScript types and interfaces
 * @version 1.0.0
 * @author EveryTriv Team
 */

/**
 * Animation types
 * @description Animation configuration, particle effects, and score animation types
 * @exports {Object} Animation-related type definitions
 */
export type { AnimationOptions, ParticleOptions, ScoreAnimationState } from './animation.types';

/**
 * Audio types
 * @description Audio service interfaces, state management, and performance tracking
 * @exports {Object} Audio-related type definitions
 */
export type {
	AudioAnalytics,
	AudioPerformance,
	AudioServiceInterface,
	AudioState,
	AudioStatePerformance,
	AudioStateReadonly,
	AudioStateWithoutContext,
	PerformanceWithMemory,
	WindowWithWebkitAudio,
} from './audio.types';

/**
 * Form types
 * @description Form field definitions and validation props
 * @exports {Object} Form-related type definitions
 */
export type { FormField, ValidatedFormProps } from './forms.types';

/**
 * Game types
 * @description Game state, configuration, and component props
 * @exports {Object} Game-related type definitions
 */
export type {
	Achievement,
	FavoriteTopicsProps,
	GameConfig,
	GameData,
	GameModeConfig,
	GameModeConfigPayload,
	GameModeState,
	GameNavigationState,
	GameState,
	GameTimerProps,
	GameTimerState,
	QuestionCountOption,
	TriviaAnswer,
	TriviaFormProps,
	TriviaGameProps,
} from './game.types';

/**
 * Shared game constants
 * @description Re-exported shared game mode constants
 * @exports {GameMode} Game mode enumeration
 */
export { GameMode } from 'everytriv-shared/constants/game.constants';

/**
 * UI component types
 * @description Re-exported UI component prop types
 * @exports {Object} UI component type definitions
 */
export type { LeaderboardProps } from './ui.types';

/**
 * Utility functions
 * @description Re-exported utility functions
 * @exports {Function} Client utility functions
 */
export { getOrCreateClientUserId } from '../utils';

/**
 * Redux types
 * @description Redux state management, async operations, and action types
 * @exports {Object} Redux-related type definitions
 */
export type {
	AsyncOptions,
	AsyncState,
	FavoritePayload,
	FavoritesState,
	PointBalancePayload,
	RootState,
	ScoreUpdatePayload,
	StatsState,
	UsePointsReturn,
	UserState,
} from './redux.types';

/**
 * Points types
 * @description Point balance, transactions, and purchase options
 * @exports {Object} Points-related type definitions
 */
export type { PointBalance, PointPurchaseOption, PointTransaction, TransferResult } from './points.types';

/**
 * API types
 * @description API service interfaces and response types
 * @exports {Object} API-related type definitions
 */
export type { ApiError, ApiResponse, ClientApiService } from './api.types';

/**
 * Shared types
 * @description Re-exported shared types for authentication and game data
 * @exports {Object} Shared type definitions
 */
export type {
	AuthCredentials,
	AuthResponse,
	CreateGameHistoryDto,
	LeaderboardEntry,
	TriviaQuestion,
	TriviaRequest,
} from 'everytriv-shared/types';

/**
 * UI component types
 * @description Comprehensive UI component prop types and interfaces
 * @exports {Object} UI component type definitions
 */
export type {
	AnimatedBackgroundProps,
	AnimatedContainerProps,
	AudioControlsProps,
	BaseComponentProps,
	ButtonProps,
	CardContentProps,
	CardGridProps,
	CardHeaderProps,
	CardProps,
	CardTitleProps,
	CategoryVolumeControlProps,
	ContainerProps,
	CountdownSoundsProps,
	CurrentDifficultyProps,
	CustomDifficultyHistoryProps,
	ErrorBannerProps,
	FloatingCardProps,
	GameModeUIProps,
	GameProps,
	GridLayoutProps,
	HistoryItem,
	HomeTitleProps,
	IconAnimation,
	IconColor,
	IconProps,
	IconSize,
	InputProps,
	LucideIconProps,
	ModalProps,
	Orb,
	Particle,
	PerformanceAction,
	PerformanceContextType,
	PerformanceState,
	PulseEffectProps,
	ResponsiveGridProps,
	ScoreStats,
	ScoringSystemProps,
	SectionProps,
	SelectOption,
	SelectProps,
	SizeVariant,
	SocialShareProps,
	Stats,
	ValidatedInputProps,
	ValidationIconProps,
	ValidationMessageProps,
	ValidationStatus,
	ValidationStatusIndicatorProps,
	ValidationType,
} from './ui.types';

/**
 * Statistics types
 * @description User statistics and analytics response types
 * @exports {Object} Statistics-related type definitions
 */
export type { UserStatsResponse } from './stats.types';

/**
 * User types
 * @description User profiles, authentication, and preferences
 * @exports {Object} User-related type definitions
 */
export type {
	ExtendedUserProfileUpdateRequest,
	NotificationSettings,
	RegistrationData,
	RegistrationFormData,
	User,
	UserAuthResponse,
	UserLoginRequest,
	UserPreferences,
	UserProfile,
	UserProfileCompleteRequest,
	UserProfileUpdateRequest,
	UserRegisterRequest,
} from './user.types';
