import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

import { ERROR_MESSAGES } from '@shared/constants';

import {
	ANIMATION_COLORS,
	ANIMATION_CONFIG,
	ANIMATION_FONTS,
	BACKGROUND_ANIMATION_CONFIG,
	GameKey,
	WORD_DIRECTIONS,
	WordDirection,
} from '@/constants';
import type { AnimatedWord, ScreenPosition } from '@/types';
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

const calculateEndPosition = (start: ScreenPosition, direction: WordDirection): ScreenPosition => {
	const offset = BACKGROUND_ANIMATION_CONFIG.movementOffset;

	switch (direction) {
		case WordDirection.DiagonalUpRight:
			return { x: start.x + offset, y: start.y - offset };
		case WordDirection.DiagonalUpLeft:
			return { x: start.x - offset, y: start.y - offset };
		case WordDirection.DiagonalDownRight:
			return { x: start.x + offset, y: start.y + offset };
		case WordDirection.DiagonalDownLeft:
			return { x: start.x - offset, y: start.y + offset };
		case WordDirection.HorizontalRight:
			return { x: start.x + offset, y: start.y };
		case WordDirection.HorizontalLeft:
			return { x: start.x - offset, y: start.y };
		case WordDirection.VerticalUp:
			return { x: start.x, y: start.y - offset };
		case WordDirection.VerticalDown:
			return { x: start.x, y: start.y + offset };
		default:
			return { x: start.x + offset, y: start.y + offset };
	}
};

const createGenerateWord = (triviaWords: readonly string[]) => (): AnimatedWord => {
	const direction = randomItem(WORD_DIRECTIONS);
	const startPosition: ScreenPosition = {
		x: randomBetween(BACKGROUND_ANIMATION_CONFIG.minStartPosition, BACKGROUND_ANIMATION_CONFIG.maxStartPosition),
		y: randomBetween(BACKGROUND_ANIMATION_CONFIG.minStartPosition, BACKGROUND_ANIMATION_CONFIG.maxStartPosition),
	};
	const endPosition = calculateEndPosition(startPosition, direction);

	return {
		id: `word-${Date.now()}-${Math.random()}`,
		text: randomItem(triviaWords),
		startPosition,
		endPosition,
		direction,
		duration: randomBetween(BACKGROUND_ANIMATION_CONFIG.minDuration, BACKGROUND_ANIMATION_CONFIG.maxDuration),
		color: randomItem(ANIMATION_COLORS),
		font: randomItem(ANIMATION_FONTS),
		fontSize: randomBetween(BACKGROUND_ANIMATION_CONFIG.minFontSize, BACKGROUND_ANIMATION_CONFIG.maxFontSize),
		maxOpacity: randomBetween(BACKGROUND_ANIMATION_CONFIG.minOpacity, BACKGROUND_ANIMATION_CONFIG.maxOpacity),
		rotation: randomBetween(BACKGROUND_ANIMATION_CONFIG.minRotation, BACKGROUND_ANIMATION_CONFIG.maxRotation),
	};
};

export function BackgroundAnimation() {
	const { t } = useTranslation('game');
	const locale = useAppSelector(selectLocale);
	const triviaWords = useMemo(() => {
		const raw = t(GameKey.BACKGROUND_WORDS, { returnObjects: true, lng: locale });
		if (Array.isArray(raw) && raw.length > 0 && raw.every((x): x is string => typeof x === 'string')) {
			return raw;
		}
		const fallback = t(GameKey.BACKGROUND_WORDS_FALLBACK, { returnObjects: true, lng: locale });
		if (Array.isArray(fallback) && fallback.length > 0 && fallback.every((x): x is string => typeof x === 'string')) {
			return fallback;
		}
		return locale === 'he' ? ['טריוויה', 'ידע'] : ['Trivia', 'Knowledge'];
	}, [t, locale]);
	const generateWord = useMemo(() => createGenerateWord(triviaWords), [triviaWords]);

	const [words, setWords] = useState<AnimatedWord[]>([]);
	const timeoutRef = useRef<Set<NodeJS.Timeout>>(new Set());

	// Initialize words on mount and when locale changes
	useEffect(() => {
		setWords([]);
		const timeouts = new Set<NodeJS.Timeout>();

		for (let i = 0; i < BACKGROUND_ANIMATION_CONFIG.wordCount; i++) {
			const timeoutId = setTimeout(() => {
				setWords(prev => [...prev, generateWord()]);
			}, i * BACKGROUND_ANIMATION_CONFIG.spawnDelay);
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
				if (filtered.length < BACKGROUND_ANIMATION_CONFIG.wordCount) {
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
			words.map(word => (
				<motion.div
					key={word.id}
					initial={{
						x: `${word.startPosition.x}vw`,
						y: `${word.startPosition.y}vh`,
						opacity: 0,
						rotate: word.rotation,
					}}
					animate={{
						x: `${word.endPosition.x}vw`,
						y: `${word.endPosition.y}vh`,
						opacity: [0, word.maxOpacity, word.maxOpacity, 0],
						rotate: word.rotation,
					}}
					transition={{
						duration: word.duration,
						ease: ANIMATION_CONFIG.EASING_NAMES.LINEAR,
						opacity: {
							times: [0, BACKGROUND_ANIMATION_CONFIG.fadeFraction, 1 - BACKGROUND_ANIMATION_CONFIG.fadeFraction, 1],
							duration: word.duration,
						},
					}}
					onAnimationComplete={() => handleAnimationComplete(word.id)}
					className='absolute whitespace-nowrap select-none'
					style={{
						color: word.color,
						fontFamily: word.font,
						fontSize: `${word.fontSize}rem`,
						fontWeight: BACKGROUND_ANIMATION_CONFIG.fontWeight,
						willChange: 'transform, opacity',
						transform: 'translateZ(0)',
						backfaceVisibility: 'hidden',
						WebkitFontSmoothing: 'antialiased',
					}}
				>
					{word.text}
				</motion.div>
			)),
		[words, handleAnimationComplete]
	);

	return (
		<div
			className='fixed inset-0 overflow-hidden pointer-events-none'
			style={{ zIndex: BACKGROUND_ANIMATION_CONFIG.zIndex }}
		>
			{wordComponents}
		</div>
	);
}
