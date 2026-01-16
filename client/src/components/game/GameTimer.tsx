import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

import { TIME_PERIODS_MS } from '@shared/constants';
import { calculateElapsedSeconds } from '@shared/utils';

import { AudioKey } from '@/constants';
import { audioService } from '@/services';
import type { GameTimerProps } from '@/types';
import { cn, formatTime } from '@/utils';

export function GameTimer({
	mode,
	initialTime,
	startTime,
	serverStartTimestamp,
	serverEndTimestamp,
	onTimeout,
	onWarning,
	label,
	showProgressBar = true,
	className = '',
}: GameTimerProps) {
	const [currentTime, setCurrentTime] = useState(() => {
		if (mode === 'countdown' && initialTime !== undefined) {
			return initialTime;
		}
		return 0;
	});

	const onTimeoutRef = useRef(onTimeout);
	useEffect(() => {
		onTimeoutRef.current = onTimeout;
	}, [onTimeout]);

	const onWarningRef = useRef(onWarning);
	useEffect(() => {
		onWarningRef.current = onWarning;
	}, [onWarning]);

	// Countdown mode: use server timestamps as authoritative source
	const warningTimeThresholdRef = useRef<number | null>(null);
	const timeoutTriggeredRef = useRef(false);
	useEffect(() => {
		if (mode !== 'countdown') return;

		// Priority: serverEndTimestamp > serverStartTimestamp + initialTime > startTime + initialTime > initialTime only
		if (serverEndTimestamp !== undefined) {
			// Use server timestamps as authoritative source
			const totalTimeMs = serverEndTimestamp - (serverStartTimestamp ?? Date.now());
			const totalTimeSeconds = Math.floor(totalTimeMs / 1000);
			warningTimeThresholdRef.current = Math.floor(totalTimeSeconds * 0.15);
			timeoutTriggeredRef.current = false;

			const interval = setInterval(() => {
				const now = Date.now();
				const remainingMs = Math.max(0, serverEndTimestamp - now);
				const remainingSeconds = Math.floor(remainingMs / 1000);

				setCurrentTime(remainingSeconds);

				// Play warning sound every 2 seconds when below warning threshold (15% or less)
				const warningThreshold = warningTimeThresholdRef.current;
				if (warningThreshold !== null && remainingSeconds <= warningThreshold && remainingSeconds > 0) {
					const timeBelowThreshold = warningThreshold - remainingSeconds;
					if (timeBelowThreshold === 0 || timeBelowThreshold % 2 === 0) {
						if (onWarningRef.current) {
							onWarningRef.current();
						} else {
							audioService.play(AudioKey.TIME_WARNING);
						}
					}
				}
			}, TIME_PERIODS_MS.SECOND);

			return () => clearInterval(interval);
		}

		// Fallback: If startTime is provided, calculate remaining time dynamically from startTime
		if (startTime !== undefined && initialTime !== undefined) {
			const totalTimeMs = initialTime * 1000;
			warningTimeThresholdRef.current = Math.floor(initialTime * 0.15);
			timeoutTriggeredRef.current = false;

			const interval = setInterval(() => {
				const now = Date.now();
				const elapsed = now - startTime;
				const remainingSeconds = Math.max(0, Math.floor((totalTimeMs - elapsed) / 1000));

				setCurrentTime(remainingSeconds);

				// Play warning sound every 2 seconds when below warning threshold (15% or less)
				const warningThreshold = warningTimeThresholdRef.current;
				if (warningThreshold !== null && remainingSeconds <= warningThreshold && remainingSeconds > 0) {
					const timeBelowThreshold = warningThreshold - remainingSeconds;
					if (timeBelowThreshold === 0 || timeBelowThreshold % 2 === 0) {
						if (onWarningRef.current) {
							onWarningRef.current();
						} else {
							audioService.play(AudioKey.TIME_WARNING);
						}
					}
				}
			}, TIME_PERIODS_MS.SECOND);

			return () => clearInterval(interval);
		}

		// Fallback: countdown from initialTime without startTime (legacy behavior)
		if (initialTime === undefined) return;

		warningTimeThresholdRef.current = Math.floor(initialTime * 0.15);
		timeoutTriggeredRef.current = false;

		const interval = setInterval(() => {
			setCurrentTime((prev: number) => {
				if (prev <= 1) {
					return 0;
				}

				if (warningTimeThresholdRef.current !== null && prev <= warningTimeThresholdRef.current) {
					const timeBelowThreshold = warningTimeThresholdRef.current - prev;
					if (timeBelowThreshold === 0 || timeBelowThreshold % 2 === 0) {
						if (onWarningRef.current) {
							onWarningRef.current();
						} else {
							audioService.play(AudioKey.TIME_WARNING);
						}
					}
				}

				return prev - 1;
			});
		}, TIME_PERIODS_MS.SECOND);

		return () => clearInterval(interval);
	}, [mode, initialTime, startTime, serverStartTimestamp, serverEndTimestamp]);

	// Handle timeout separately to avoid calling navigate during render
	useEffect(() => {
		if (mode === 'countdown' && currentTime === 0 && !timeoutTriggeredRef.current && onTimeoutRef.current) {
			timeoutTriggeredRef.current = true;
			// Use setTimeout to defer the callback to avoid calling it during render
			setTimeout(() => {
				onTimeoutRef.current?.();
			}, 0);
		}
	}, [mode, currentTime]);

	// Elapsed mode: count up from startTime
	useEffect(() => {
		if (mode !== 'elapsed' || startTime === undefined) return;

		const interval = setInterval(() => {
			const elapsed = calculateElapsedSeconds(startTime);
			setCurrentTime(elapsed);
		}, TIME_PERIODS_MS.SECOND);

		return () => clearInterval(interval);
	}, [mode, startTime]);

	// Calculate progress percentage
	// Only used for countdown mode (progress bar is hidden in elapsed mode)
	const getProgress = useCallback(() => {
		if (mode === 'countdown' && initialTime !== undefined && initialTime > 0) {
			return (currentTime / initialTime) * 100;
		}
		return 0;
	}, [mode, currentTime, initialTime]);

	// Get color based on percentage
	const getColorByPercentage = useCallback((percentage: number, prefix: 'text' | 'bg'): string => {
		if (percentage > 35) return `${prefix}-green-500`;
		if (percentage > 15) return `${prefix}-orange-500`;
		return `${prefix}-red-500`;
	}, []);

	// Get color based on mode and time
	const getTimerColor = useCallback(() => {
		switch (mode) {
			case 'countdown':
				if (initialTime !== undefined && initialTime > 0) {
					const percentage = (currentTime / initialTime) * 100;
					return getColorByPercentage(percentage, 'text');
				}
				return 'text-muted-foreground';
			case 'elapsed':
				return 'text-muted-foreground';
			default:
				return 'text-muted-foreground';
		}
	}, [mode, currentTime, initialTime, getColorByPercentage]);

	const getBarColor = useCallback(() => {
		switch (mode) {
			case 'countdown':
				if (initialTime !== undefined && initialTime > 0) {
					const percentage = (currentTime / initialTime) * 100;
					return getColorByPercentage(percentage, 'bg');
				}
				return 'bg-primary';
			case 'elapsed':
				return 'bg-primary';
			default:
				return 'bg-primary';
		}
	}, [mode, currentTime, initialTime, getColorByPercentage]);

	const progress = getProgress();
	const defaultLabel = (() => {
		switch (mode) {
			case 'countdown':
				return 'Game Time';
			case 'elapsed':
				return 'Time Elapsed';
			default:
				return 'Time Elapsed';
		}
	})();

	return (
		<div className={cn('mb-6', className)}>
			<div className='text-center mb-2'>
				<div className={cn('text-2xl font-medium', getTimerColor())}>{formatTime(currentTime)}</div>
				<p className='text-sm text-muted-foreground mt-1'>{label ?? defaultLabel}</p>
			</div>
			{showProgressBar && (
				<div className='relative h-4 bg-muted rounded-full overflow-hidden'>
					<motion.div
						className={cn('absolute inset-y-0 left-0', getBarColor())}
						initial={{ width: '100%' }}
						animate={{
							width: `${progress}%`,
						}}
						transition={{ duration: 0.3 }}
					/>
				</div>
			)}
		</div>
	);
}
