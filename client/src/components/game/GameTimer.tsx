import { motion } from 'framer-motion';

import { GameTimerProps } from '../../types';
import { combineClassNames, formatTimeDisplay } from '../../utils';
import { fadeInDown } from '../animations';

/**
 * Game timer component with mode-specific display
 *
 * @component GameTimer
 * @description Timer component that displays elapsed time, remaining time, and game mode indicators
 * @param timer - Timer state from GameModeConfig
 * @param gameMode - Current game mode configuration
 * @param className - Additional CSS classes
 * @returns JSX.Element The rendered timer component or null if not active
 */
export default function GameTimer({ timer, gameMode, className }: GameTimerProps) {
	const getTimerDisplay = () => {
		const formattedElapsed = formatTimeDisplay(timer.timeElapsed ?? 0);
		const modeName = gameMode?.mode;

		if (modeName === 'time-limited') {
			const formattedRemaining = timer.timeRemaining ? formatTimeDisplay(timer.timeRemaining) : '0:00';
			const isTimeRunningOut = timer.timeRemaining && timer.timeRemaining < 30000; // Less than 30 seconds

			return (
				<div className='flex justify-between items-center'>
					<div className='text-sm opacity-75'>
						Elapsed: <span className='font-medium'>{formattedElapsed}</span>
					</div>
					<div
						className={combineClassNames('font-bold text-lg', {
							'text-red-400 animate-pulse': isTimeRunningOut || gameMode?.isGameOver,
							'text-white': !isTimeRunningOut && !gameMode?.isGameOver,
						})}
					>
						{gameMode?.isGameOver ? "TIME'S UP!" : `${formattedRemaining}`}
					</div>
				</div>
			);
		} else if (modeName === 'question-limited') {
			return (
				<div className='text-center'>
					<div className='text-sm opacity-75'>Time Playing</div>
					<div className='font-bold text-lg text-white'>{formattedElapsed}</div>
				</div>
			);
		} else {
			return (
				<div className='text-center'>
					<div className='text-sm opacity-75'>Session Time</div>
					<div className='font-bold text-lg text-white'>{formattedElapsed}</div>
				</div>
			);
		}
	};

	if (!timer.isRunning && timer.timeElapsed === 0) {
		return null;
	}

	return (
		<motion.aside
			variants={fadeInDown}
			initial='hidden'
			animate='visible'
			className={combineClassNames(
				'game-timer bg-white/10 backdrop-blur-sm border border-white/20 p-3 rounded-lg mb-4 text-white',
				className
			)}
			aria-label='Game Timer'
		>
			{getTimerDisplay()}

			{/* Game mode indicator */}
			<div className='text-xs opacity-60 text-center mt-1'>
				{gameMode?.mode === 'time-limited' && 'Time Limited'}
				{gameMode?.mode === 'question-limited' && 'Question Limited'}
				{gameMode?.mode === 'unlimited' && 'Free Play'}
			</div>
		</motion.aside>
	);
}
