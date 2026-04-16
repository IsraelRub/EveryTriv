import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

import { ERROR_MESSAGES, Locale } from '@shared/constants';
import { VALIDATORS } from '@shared/validation';

import {
	ANIMATION_COLORS,
	ANIMATION_CONFIG,
	ANIMATION_FONTS,
	BACKGROUND_ANIMATION_CONFIG,
	BACKGROUND_WORD_MOTION_PATH_POOL,
	BackgroundWordMotionPath,
	GameKey,
	WORD_DIRECTION_OFFSET_UNIT,
	WORD_DIRECTIONS,
} from '@/constants';
import type { AnimatedWord, Point2d } from '@/types';
import { buildBackgroundWordPath, motionPathKeyframeTimes } from '@/utils';
import { useAppSelector } from '@/hooks';
import { selectLocale } from '@/redux/selectors';

const randomBetween = (min: number, max: number): number => {
	return Math.random() * (max - min) + min;
};

const randomItem = <T,>(array: readonly T[]): T => {
	const item = array[Math.floor(Math.random() * array.length)];
	if (item == null) {
		throw new Error(ERROR_MESSAGES.client.ARRAY_EMPTY_OR_ITEM_NOT_FOUND);
	}
	return item;
};

export function BackgroundAnimation() {
	const { t } = useTranslation('game');
	const locale = useAppSelector(selectLocale);
	const triviaWords = useMemo(() => {
		const raw = t(GameKey.BACKGROUND_WORDS, { returnObjects: true, lng: locale });
		if (Array.isArray(raw) && raw.length > 0 && raw.every((x): x is string => VALIDATORS.string(x))) {
			return raw;
		}
		return locale === Locale.HE ? ['טריוויה', 'ידע'] : ['Trivia', 'Knowledge'];
	}, [t, locale]);

	const generateWord = useCallback((): AnimatedWord => {
		const direction = randomItem(WORD_DIRECTIONS);
		const motionPath = randomItem(BACKGROUND_WORD_MOTION_PATH_POOL);
		const startPosition: Point2d = {
			x: randomBetween(
				BACKGROUND_ANIMATION_CONFIG.position.minStartPosition,
				BACKGROUND_ANIMATION_CONFIG.position.maxStartPosition
			),
			y: randomBetween(
				BACKGROUND_ANIMATION_CONFIG.position.minStartPosition,
				BACKGROUND_ANIMATION_CONFIG.position.maxStartPosition
			),
		};
		const offset = BACKGROUND_ANIMATION_CONFIG.position.movementOffset;
		const { dx, dy } = WORD_DIRECTION_OFFSET_UNIT[direction];
		const endPosition: Point2d = {
			x: startPosition.x + dx * offset,
			y: startPosition.y + dy * offset,
		};
		const pathPositions = buildBackgroundWordPath({
			start: startPosition,
			end: endPosition,
			motionPath,
			waveAmplitude: randomBetween(
				BACKGROUND_ANIMATION_CONFIG.path.waveAmplitudeMin,
				BACKGROUND_ANIMATION_CONFIG.path.waveAmplitudeMax
			),
			waveCycles: randomBetween(
				BACKGROUND_ANIMATION_CONFIG.path.waveCyclesMin,
				BACKGROUND_ANIMATION_CONFIG.path.waveCyclesMax
			),
			arcBulge: randomBetween(
				BACKGROUND_ANIMATION_CONFIG.path.arcBulgeMin,
				BACKGROUND_ANIMATION_CONFIG.path.arcBulgeMax
			),
			zigzagAmplitude: randomBetween(
				BACKGROUND_ANIMATION_CONFIG.path.zigzagMin,
				BACKGROUND_ANIMATION_CONFIG.path.zigzagMax
			),
			serpentineOut: randomBetween(
				BACKGROUND_ANIMATION_CONFIG.path.serpentineMin,
				BACKGROUND_ANIMATION_CONFIG.path.serpentineMax
			),
			serpentineIn: randomBetween(
				BACKGROUND_ANIMATION_CONFIG.path.serpentineMin,
				BACKGROUND_ANIMATION_CONFIG.path.serpentineMax
			),
		});
		const rotationDrift =
			motionPath === BackgroundWordMotionPath.Straight ? randomBetween(-5, 5) : randomBetween(-12, 12);

		return {
			id: `word-${Date.now()}-${Math.random()}`,
			text: randomItem(triviaWords),
			startPosition,
			endPosition,
			direction,
			pathPositions,
			rotationDrift,
			duration: randomBetween(
				BACKGROUND_ANIMATION_CONFIG.timing.minDuration,
				BACKGROUND_ANIMATION_CONFIG.timing.maxDuration
			),
			color: randomItem(ANIMATION_COLORS),
			font: randomItem(ANIMATION_FONTS),
			fontSize: randomBetween(
				BACKGROUND_ANIMATION_CONFIG.appearance.minFontSize,
				BACKGROUND_ANIMATION_CONFIG.appearance.maxFontSize
			),
			maxOpacity: randomBetween(
				BACKGROUND_ANIMATION_CONFIG.appearance.minOpacity,
				BACKGROUND_ANIMATION_CONFIG.appearance.maxOpacity
			),
			rotation: randomBetween(
				BACKGROUND_ANIMATION_CONFIG.appearance.minRotation,
				BACKGROUND_ANIMATION_CONFIG.appearance.maxRotation
			),
		};
	}, [triviaWords]);

	const [words, setWords] = useState<AnimatedWord[]>([]);
	const timeoutRef = useRef<Set<NodeJS.Timeout>>(new Set());

	// Initialize words on mount and when locale changes
	useEffect(() => {
		setWords([]);
		const timeouts = new Set<NodeJS.Timeout>();

		for (let i = 0; i < BACKGROUND_ANIMATION_CONFIG.layout.wordCount; i++) {
			const timeoutId = setTimeout(() => {
				setWords(prev => [...prev, generateWord()]);
			}, i * BACKGROUND_ANIMATION_CONFIG.layout.spawnDelay);
			timeouts.add(timeoutId);
		}

		timeoutRef.current = timeouts;

		return () => {
			timeoutRef.current.forEach(id => {
				if (id) {
					clearTimeout(id);
				}
			});
			timeoutRef.current.clear();
		};
	}, [locale, generateWord]);

	// Replace word when animation completes. Depends on generateWord so new words use current locale.
	const handleAnimationComplete = useCallback(
		(wordId: string) => {
			setWords(prev => {
				const filtered = prev.filter(w => w.id !== wordId);
				if (filtered.length < BACKGROUND_ANIMATION_CONFIG.layout.wordCount) {
					return [...filtered, generateWord()];
				}
				return filtered;
			});
		},
		[generateWord]
	);

	// Memoize word components to prevent unnecessary re-renders
	const wordComponents = useMemo(
		() =>
			words.map(word => {
				const pathTimes = motionPathKeyframeTimes(word.pathPositions.length);
				return (
					<motion.div
						key={word.id}
						initial={{
							x: `${word.startPosition.x}vw`,
							y: `${word.startPosition.y}vh`,
							opacity: 0,
							rotate: word.rotation,
						}}
						animate={{
							x: word.pathPositions.map(p => `${p.x}vw`),
							y: word.pathPositions.map(p => `${p.y}vh`),
							opacity: [0, word.maxOpacity, word.maxOpacity, 0],
							rotate: [word.rotation, word.rotation + word.rotationDrift],
						}}
						transition={{
							duration: word.duration,
							x: {
								duration: word.duration,
								times: [...pathTimes],
								ease: ANIMATION_CONFIG.EASING_NAMES.LINEAR,
							},
							y: {
								duration: word.duration,
								times: [...pathTimes],
								ease: ANIMATION_CONFIG.EASING_NAMES.LINEAR,
							},
							rotate: {
								duration: word.duration,
								ease: ANIMATION_CONFIG.EASING_NAMES.LINEAR,
							},
							opacity: {
								times: [
									0,
									BACKGROUND_ANIMATION_CONFIG.timing.fadeFraction,
									1 - BACKGROUND_ANIMATION_CONFIG.timing.fadeFraction,
									1,
								],
								duration: word.duration,
							},
						}}
						onAnimationComplete={() => handleAnimationComplete(word.id)}
						className='absolute whitespace-nowrap select-none'
						style={{
							color: word.color,
							fontFamily: word.font,
							fontSize: `${word.fontSize}rem`,
							fontWeight: BACKGROUND_ANIMATION_CONFIG.layout.fontWeight,
							willChange: 'transform, opacity',
							transform: 'translateZ(0)',
							backfaceVisibility: 'hidden',
							WebkitFontSmoothing: 'antialiased',
						}}
					>
						{word.text}
					</motion.div>
				);
			}),
		[words, handleAnimationComplete]
	);

	return (
		<div
			className='fixed inset-0 overflow-hidden pointer-events-none'
			style={{ zIndex: BACKGROUND_ANIMATION_CONFIG.layout.zIndex }}
		>
			{wordComponents}
		</div>
	);
}
