import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

import { TIME_PERIODS_MS } from '@shared/constants';
import { calculateDuration, calculateElapsedSeconds, calculatePercentage } from '@shared/utils';

import { AudioKey, Colors, TIMER_WARNING_RATIO, TimerMode, TRANSITION_DURATIONS } from '@/constants';
import { audioService } from '@/services';
import type { GameTimerProps } from '@/types';
import { cn, formatTime } from '@/utils';

const WARNING_BEEP_INTERVAL_MS = 3 * TIME_PERIODS_MS.SECOND;

function isInWarningZone(remainingSeconds: number, warningThreshold: number | null): boolean {
	return warningThreshold !== null && remainingSeconds <= warningThreshold && remainingSeconds > 0;
}

function playWarning(onWarning: (() => void) | undefined): void {
	if (onWarning) onWarning();
	else audioService.play(AudioKey.TIME_WARNING);
}

function computeWarningThresholdSeconds(totalSeconds: number): number {
	return Math.floor(totalSeconds * TIMER_WARNING_RATIO);
}

function runInterval(callback: () => void, periodMs: number): () => void {
	const id = setInterval(callback, periodMs);
	return () => clearInterval(id);
}

/**
 * Attempts to play a warning beep. Uses wall-clock time to enforce a minimum
 * gap of WARNING_BEEP_INTERVAL_MS between beeps, which guards against
 * StrictMode double-invocation and overlapping intervals.
 */
function tryPlayWarning(
	remaining: number,
	threshold: number | null,
	lastBeepTimeRef: React.MutableRefObject<number>,
	onWarning: (() => void) | undefined
): void {
	if (!isInWarningZone(remaining, threshold)) return;
	const now = Date.now();
	if (now - lastBeepTimeRef.current >= WARNING_BEEP_INTERVAL_MS) {
		lastBeepTimeRef.current = now;
		playWarning(onWarning);
	}
}

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
}: GameTimerProps) {
	const [currentTime, setCurrentTime] = useState(() => {
		if (mode === TimerMode.COUNTDOWN && initialTime !== undefined) {
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
	// Wall-clock timestamp of the last warning beep. Using wall-clock time
	// (rather than remaining-seconds) makes it immune to StrictMode
	// double-invocation and overlapping intervals.
	const lastBeepTimeRef = useRef(0);

	useEffect(() => {
		if (mode !== TimerMode.COUNTDOWN) return;

		const onWarning = onWarningRef.current ?? undefined;
		// Reset so the first tick in the warning zone plays immediately
		lastBeepTimeRef.current = 0;

		// Priority: serverEndTimestamp > startTime + initialTime > initialTime only
		if (serverEndTimestamp !== undefined) {
			const totalTimeSeconds = Math.floor(
				(serverEndTimestamp - (serverStartTimestamp ?? Date.now())) / TIME_PERIODS_MS.SECOND
			);
			warningTimeThresholdRef.current = computeWarningThresholdSeconds(totalTimeSeconds);
			timeoutTriggeredRef.current = false;
			const threshold = warningTimeThresholdRef.current;
			return runInterval(() => {
				const remaining = Math.floor(Math.max(0, serverEndTimestamp - Date.now()) / TIME_PERIODS_MS.SECOND);
				setCurrentTime(remaining);
				tryPlayWarning(remaining, threshold, lastBeepTimeRef, onWarning);
			}, TIME_PERIODS_MS.SECOND);
		}

		if (startTime !== undefined && initialTime !== undefined) {
			const totalTimeMs = initialTime * TIME_PERIODS_MS.SECOND;
			warningTimeThresholdRef.current = computeWarningThresholdSeconds(initialTime);
			timeoutTriggeredRef.current = false;
			const threshold = warningTimeThresholdRef.current;
			return runInterval(() => {
				const elapsed = calculateDuration(startTime);
				const remaining = Math.max(0, Math.floor((totalTimeMs - elapsed) / TIME_PERIODS_MS.SECOND));
				setCurrentTime(remaining);
				tryPlayWarning(remaining, threshold, lastBeepTimeRef, onWarning);
			}, TIME_PERIODS_MS.SECOND);
		}

		if (initialTime === undefined) return;

		warningTimeThresholdRef.current = computeWarningThresholdSeconds(initialTime);
		timeoutTriggeredRef.current = false;
		const threshold = warningTimeThresholdRef.current;
		let localTime = initialTime;
		return runInterval(() => {
			if (localTime <= 0) return;
			localTime = localTime <= 1 ? 0 : localTime - 1;
			setCurrentTime(localTime);
			tryPlayWarning(localTime, threshold, lastBeepTimeRef, onWarningRef.current ?? undefined);
		}, TIME_PERIODS_MS.SECOND);
	}, [mode, initialTime, startTime, serverStartTimestamp, serverEndTimestamp]);

	// Handle timeout separately to avoid calling navigate during render
	useEffect(() => {
		if (mode === TimerMode.COUNTDOWN && currentTime === 0 && !timeoutTriggeredRef.current && onTimeoutRef.current) {
			timeoutTriggeredRef.current = true;
			// Use setTimeout to defer the callback to avoid calling it during render
			setTimeout(() => {
				onTimeoutRef.current?.();
			}, 0);
		}
	}, [mode, currentTime]);

	// Elapsed mode: count up from startTime
	useEffect(() => {
		if (mode !== TimerMode.ELAPSED || startTime === undefined) return;

		return runInterval(() => {
			setCurrentTime(calculateElapsedSeconds(startTime));
		}, TIME_PERIODS_MS.SECOND);
	}, [mode, startTime]);

	const getColorByPercentage = useCallback((percentage: number, prefix: 'text' | 'bg'): string => {
		if (percentage > 35) return prefix === 'text' ? Colors.GREEN_500.text : Colors.GREEN_500.bg;
		if (percentage > 15) return prefix === 'text' ? Colors.YELLOW_500.text : Colors.YELLOW_500.bg;
		return prefix === 'text' ? Colors.RED_500.text : Colors.RED_500.bg;
	}, []);

	const countdownPercentage =
		mode === TimerMode.COUNTDOWN && initialTime !== undefined && initialTime > 0
			? calculatePercentage(currentTime, initialTime, false)
			: null;

	const getColorByMode = useCallback(
		(prefix: 'text' | 'bg', defaultClass: string): string => {
			if (mode !== TimerMode.COUNTDOWN || countdownPercentage === null) return defaultClass;
			return getColorByPercentage(countdownPercentage, prefix);
		},
		[mode, countdownPercentage, getColorByPercentage]
	);

	const progress = countdownPercentage ?? 0;
	const defaultLabel = mode === TimerMode.COUNTDOWN ? 'Game Time' : 'Time Elapsed';

	return (
		<div className='mb-6'>
			<div className='text-center mb-2'>
				<div className={cn('text-2xl font-medium', getColorByMode('text', 'text-muted-foreground'))}>
					{formatTime(currentTime)}
				</div>
				<p className='text-sm text-muted-foreground mt-1'>{label ?? defaultLabel}</p>
			</div>
			{showProgressBar && (
				<div className='relative h-4 bg-muted rounded-full overflow-hidden'>
					<motion.div
						className={cn('absolute inset-y-0 left-0', getColorByMode('bg', 'bg-primary'))}
						initial={{ width: '100%' }}
						animate={{ width: `${progress}%` }}
						transition={{ duration: TRANSITION_DURATIONS.NORMAL }}
					/>
				</div>
			)}
		</div>
	);
}
