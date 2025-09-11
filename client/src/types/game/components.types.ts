/**
 * Game Component Types
 * @module GameComponentTypes
 * @description Game component prop types and interfaces
 */
import { FormEvent } from 'react';
import { GameModeConfig, GameMode, BasicValue } from '@shared';
import { GameConfig, GameState, GameTimerState, GameSessionStats } from './config.types';
import { Achievement } from './achievements.types';
// CurrentQuestionMetadata moved here from metadata.types.ts

/**
 * @interface CurrentQuestionMetadata
 * @description Metadata for the current question being displayed
 */
export interface CurrentQuestionMetadata {
	/** Custom difficulty multiplier */
	customDifficultyMultiplier?: number;
	/** Actual difficulty level */
	actualDifficulty?: string;
	/** Number of questions */
	questionCount?: number;
}

// Game Component Props
/**
 * פרופס לרכיב משחק
 * @used_by client/src/components/game/Game.tsx
 */
export interface GameProps {
	/** קונפיגורציית המשחק */
	config: GameConfig;
	/** מצב המשחק */
	state: GameState;
	/** מטפל בשינוי מצב */
	onStateChange: (newState: GameState) => void;
	/** מטפל בסיום משחק */
	onGameComplete: (finalScore: number, timeSpent: number) => void;
	/** מטפל בשגיאה */
	onError: (error: string) => void;
	/** CSS classes נוספות */
	className?: string;
	/** שאלת טריוויה */
	trivia?: {
		id: string;
		question: string;
		answers: Array<{ text: string; isCorrect: boolean }>;
		correctAnswerIndex: number;
		difficulty?: string;
		topic?: string;
	};
	/** תשובה נבחרת */
	selected?: number | null;
	/** ניקוד */
	score?: number;
	/** מצב משחק */
	gameMode?: GameModeConfig;
	/** מטפל בתשובה */
	onAnswer?: (index: number) => Promise<void>;
	/** מטפל בשאלה חדשה */
	onNewQuestion?: () => Promise<void>;
	/** מטפל בסיום משחק */
	onGameEnd?: () => void;
}

/**
 * פרופס לרכיב טיימר משחק
 * @used_by client/src/components/game/GameTimer.tsx
 */
export interface GameTimerProps {
	/** מצב הטיימר */
	timer: GameTimerState;
	/** מטפל בשינוי זמן */
	onTimeUpdate: (timeRemaining: number) => void;
	/** מטפל בהתראה על זמן קצר */
	onLowTimeWarning: () => void;
	/** מטפל בסיום זמן */
	onTimeUp: () => void;
	/** CSS classes נוספות */
	className?: string;
	/** האם רץ */
	isRunning?: boolean;
	/** זמן נותר */
	timeRemaining?: number;
	/** זמן שחלף */
	timeElapsed?: number;
	/** האם המשחק נגמר */
	isGameOver?: boolean;
	/** מצב משחק */
	mode?: {
		name: string;
		timeLimit: number;
		questionLimit: number;
	};
}

/**
 * פרופס לרכיב טריוויה
 * @used_by client/src/components/game/TriviaGame.tsx
 */
export interface TriviaGameProps {
	/** שאלת טריוויה */
	trivia: {
		id: string;
		question: string;
		answers: Array<{ text: string; isCorrect: boolean }>;
		correctAnswerIndex: number;
	};
	/** תשובה נבחרת */
	selected?: number | null;
	/** מטפל בתשובה */
	onAnswer: (index: number) => void;
}

/**
 * פרופס לרכיב טופס טריוויה
 * @used_by client/src/components/game/TriviaForm.tsx
 */
export interface TriviaFormProps {
	/** מטפל בשליחת טופס */
	onSubmit: (event: FormEvent<HTMLFormElement>) => void;
	/** מטפל בשינוי ערכים */
	onChange: (field: string, value: BasicValue) => void;
	/** ערכי הטופס */
	values: Record<string, BasicValue>;
	/** האם הטופס נטען */
	loading?: boolean;
	/** CSS classes נוספות */
	className?: string;
	/** נושא */
	topic?: string;
	/** רמת קושי */
	difficulty?: string;
	/** מספר שאלות */
	questionCount?: number;
	/** מטפל בשינוי נושא */
	onTopicChange?: (topic: string) => void;
	/** מטפל בשינוי קושי */
	onDifficultyChange?: (difficulty: string) => void;
	/** מטפל בשינוי מספר שאלות */
	onQuestionCountChange?: (count: number) => void;
	/** מטפל בסגירת טופס */
	onClose?: () => void;
	/** מטפל בבחירת מצב משחק */
	onGameModeSelect?: (mode: string) => void;
	/** האם להציג בחירת מצב משחק */
	showGameModeSelector?: boolean;
	/** מטפל בסגירת בחירת מצב משחק */
	onGameModeSelectorClose?: () => void;
}

/**
 * פרופס לרכיב נושאים מועדפים
 * @used_by client/src/components/user/FavoriteTopics.tsx
 */
export interface FavoriteTopicsProps {
	favorites: Array<{ topic: string; difficulty: string }>;
	onRemove: (index: number) => void;
	onSelect?: (favorite: { topic: string; difficulty: string }) => void;
	className?: string;
}

/**
 * פרופס לרכיב מצב משחק UI
 * @used_by client/src/components/gameMode/GameMode.tsx
 */
export interface GameModeUIProps {
	/** מצב נוכחי */
	currentMode?: string;
	/** מטפל בשינוי מצב */
	onModeChange?: (mode: string) => void;
	/** מטפל בשינוי נושא */
	onTopicChange?: (topic: string) => void;
	/** מטפל בשינוי קושי */
	onDifficultyChange?: (difficulty: string) => void;
	/** CSS classes נוספות */
	className?: string;
	/** האם נראה */
	isVisible?: boolean;
	/** מטפל בבחירת מצב */
	onSelectMode?: (config: { mode: GameMode; timeLimit?: number; questionLimit?: number }) => void;
	/** מטפל בבחירת מצב */
	onModeSelect?: (mode: string) => void;
	/** מטפל בביטול */
	onCancel?: () => void;
}

/**
 * פרופס לרכיב הישגים
 * @used_by client/src/components/stats/Achievements.tsx
 */
export interface AchievementsProps {
	/** רשימת הישגים */
	achievements: Achievement[];
	/** מטפל בלחיצה על הישג */
	onAchievementClick?: (achievement: Achievement) => void;
	/** CSS classes נוספות */
	className?: string;
}

/**
 * פרופס לרכיב סטטיסטיקות ניקוד
 * @used_by client/src/components/stats/ScoringSystem.tsx
 */
export interface ScoringSystemProps {
	/** ניקוד נוכחי */
	currentScore: number;
	/** ניקוד מקסימלי */
	maxScore: number;
	/** אחוז הצלחה */
	successRate: number;
	/** רצף נוכחי */
	currentStreak: number;
	/** רצף מקסימלי */
	maxStreak: number;
	/** CSS classes נוספות */
	className?: string;
	/** סטטיסטיקות */
	stats?: GameSessionStats;
	/** ניקוד */
	score?: number;
	/** סה"כ */
	total?: number;
	/** נושאים ששוחקו */
	topicsPlayed?: string[];
	/** סטטיסטיקות קושי */
	difficultyStats?: Record<string, { correct: number; total: number }>;
	/** מטא-דאטה של שאלה נוכחית */
	currentQuestionMetadata?: CurrentQuestionMetadata;
}

/**
 * פרופס לרכיב היסטוריית קושי מותאם אישית
 * @used_by client/src/components/stats/CustomDifficultyHistory.tsx
 */
export interface CustomDifficultyHistoryProps {
	/** היסטוריית קושי */
	history?: Array<{
		difficulty: string;
		score: number;
		date: string;
	}>;
	/** מטפל בלחיצה על פריט */
	onItemClick?: (item: { id: string; name: string; value: number }) => void;
	/** CSS classes נוספות */
	className?: string;
	/** האם נראה */
	isVisible?: boolean;
	/** מטפל בסגירה */
	onClose?: () => void;
	/** מטפל בבחירה */
	onSelect?: (topic: string, difficulty: string) => void;
}

/**
 * פרופס לרכיב קושי נוכחי
 * @used_by client/src/components/home/CurrentDifficulty.tsx
 */
export interface CurrentDifficultyProps {
	/** קושי נוכחי */
	difficulty: string;
	/** מטפל בשינוי קושי */
	onDifficultyChange: (difficulty: string) => void;
	/** CSS classes נוספות */
	className?: string;
	/** עיכוב אנימציה */
	delay?: number;
	/** נושא */
	topic?: string;
	/** מטפל בהצגת היסטוריה */
	onShowHistory?: () => void;
}

/**
 * פרופס לרכיב כותרת בית
 * @used_by client/src/components/home/HomeTitle.tsx
 */
export interface HomeTitleProps {
	/** כותרת */
	title: string;
	/** תת-כותרת */
	subtitle?: string;
	/** CSS classes נוספות */
	className?: string;
	/** עיכוב אנימציה */
	delay?: number;
}

/**
 * פרופס לרכיב שגיאה
 * @used_by client/src/components/home/ErrorBanner.tsx
 */
export interface ErrorBannerProps {
	/** הודעת שגיאה */
	message: string;
	/** סוג שגיאה */
	type?: 'error' | 'warning' | 'info';
	/** מטפל בסגירה */
	onClose?: () => void;
	/** CSS classes נוספות */
	className?: string;
	/** קושי */
	difficulty?: string;
}

/**
 * פרופס לרכיב שיתוף חברתי
 * @used_by client/src/components/layout/SocialShare.tsx
 */
export interface SocialShareProps {
	/** טקסט לשיתוף */
	text?: string;
	/** URL לשיתוף */
	url?: string;
	/** פלטפורמות שיתוף */
	platforms?: string[];
	/** CSS classes נוספות */
	className?: string;
	/** ניקוד */
	score?: number;
	/** סה"כ */
	total?: number;
	/** נושא */
	topic?: string;
	/** רמת קושי */
	difficulty?: string;
}

/**
 * פרופס לרכיב לוח מובילים
 * @used_by client/src/components/leaderboard/Leaderboard.tsx
 */
export interface LeaderboardProps {
	/** רשימת מובילים */
	entries?: Array<{
		rank: number;
		username: string;
		score: number;
		avatar?: string;
	}>;
	/** מטפל בלחיצה על מוביל */
	onEntryClick?: (entry: { id: string; username: string; score: number; rank: number }) => void;
	/** CSS classes נוספות */
	className?: string;
	/** מזהה משתמש */
	userId?: string;
}
