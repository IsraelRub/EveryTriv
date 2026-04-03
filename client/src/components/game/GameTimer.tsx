import { MutableRefObject, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

import { TIME_PERIODS_MS } from '@shared/constants';
import { calculateDuration, calculateElapsedSeconds, calculatePercentage } from '@shared/utils';

import {
	AudioKey,
	GameKey,
	TIMER_PHASE_CLASS,
	TIMER_WARNING_RATIO,
	TimerColorPrefix,
	TimerMode,
	TRANSITION_DURATIONS,
} from '@/constants';
import type { GameTimerProps } from '@/types';
import { audioService } from '@/services';
import { cn, formatTime } from '@/utils';

function computeWarningThresholdSeconds(totalSeconds: number): number {
	return Math.floor(totalSeconds * TIMER_WARNING_RATIO);
}

function runInterval(callback: () => void, periodMs: number): () => void {
	const id = setInterval(callback, periodMs);
	return () => clearInterval(id);
}

function tryPlayWarning(
	remaining: number,
	threshold: number | null,
	lastBeepRemainingRef: MutableRefObject<number>,
	onWarning: (() => void) | undefined
): void {
	if (threshold === null || remaining > threshold || remaining <= 0 || remaining === lastBeepRemainingRef.current)
		return;
	lastBeepRemainingRef.current = remaining;
	if (onWarning) onWarning();
	else audioService.play(AudioKey.TIME_WARNING);
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
	// Last "remaining" value we beeped for; one beep per remaining-second avoids
	// skips when setInterval ticks run close together (e.g. after heavy render).
	const lastBeepRemainingRef = useRef(-1);

	useEffect(() => {
		if (mode !== TimerMode.COUNTDOWN) return;

		const onWarning = onWarningRef.current ?? undefined;
		lastBeepRemainingRef.current = -1;

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
				tryPlayWarning(remaining, threshold, lastBeepRemainingRef, onWarning);
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
				tryPlayWarning(remaining, threshold, lastBeepRemainingRef, onWarning);
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
			tryPlayWarning(localTime, threshold, lastBeepRemainingRef, onWarningRef.current ?? undefined);
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

	const getColorByPercentage = useCallback((percentage: number, prefix: TimerColorPrefix): string => {
		if (percentage > 35) {
			return prefix === TimerColorPrefix.TEXT ? TIMER_PHASE_CLASS.safeText : TIMER_PHASE_CLASS.safeBg;
		}
		if (percentage > 15) {
			return prefix === TimerColorPrefix.TEXT ? TIMER_PHASE_CLASS.warnText : TIMER_PHASE_CLASS.warnBg;
		}
		return prefix === TimerColorPrefix.TEXT ? TIMER_PHASE_CLASS.criticalText : TIMER_PHASE_CLASS.criticalBg;
	}, []);

	const countdownPercentage =
		mode === TimerMode.COUNTDOWN && initialTime !== undefined && initialTime > 0
			? calculatePercentage(currentTime, initialTime, false)
			: null;

	const getColorByMode = useCallback(
		(prefix: TimerColorPrefix, defaultClass: string): string => {
			if (mode !== TimerMode.COUNTDOWN || countdownPercentage === null) return defaultClass;
			return getColorByPercentage(countdownPercentage, prefix);
		},
		[mode, countdownPercentage, getColorByPercentage]
	);

	const { t } = useTranslation('game');
	const displayLabel = label ?? (mode === TimerMode.COUNTDOWN ? t(GameKey.GAME_TIME) : t(GameKey.TIME_ELAPSED));

	return (
		<div className='mb-6'>
			<div className='text-center'>
				<p className='text-sm text-muted-foreground mb-0.5'>{displayLabel}</p>
				<div
					className={cn('text-2xl font-medium mb-1.5', getColorByMode(TimerColorPrefix.TEXT, 'text-muted-foreground'))}
				>
					{formatTime(currentTime)}
				</div>
			</div>
			{showProgressBar && (
				<div className='relative h-4 bg-muted rounded-full overflow-hidden'>
					<motion.div
						className={cn('absolute inset-y-0 left-0', getColorByMode(TimerColorPrefix.BG, 'bg-primary'))}
						animate={{ width: `clamp(0%, ${countdownPercentage ?? 0}%, 100%)` }}
						transition={{ duration: TRANSITION_DURATIONS.NORMAL }}
					/>
				</div>
			)}
		</div>
	);
}
