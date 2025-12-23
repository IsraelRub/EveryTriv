/**
 * Game Component Types
 * @module GameComponentTypes
 * @description Type definitions for game-related components
 */

/**
 * Game Timer component props
 * @interface GameTimerProps
 * @description Props for the GameTimer component used in game sessions
 * @used_by client/src/components/game/GameTimer.tsx
 */
export interface GameTimerProps {
	mode: 'countdown' | 'elapsed';
	initialTime?: number;
	startTime?: number;
	onTimeout?: () => void;
	onWarning?: () => void;
	label?: string;
	showProgressBar?: boolean;
	className?: string;
}
