import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';

import {
	ANIMATION_COLORS,
	ANIMATION_FONTS,
	BACKGROUND_ANIMATION_CONFIG,
	Easing,
	TRIVIA_WORDS,
	WORD_DIRECTIONS,
} from '@/constants';
import type { AnimatedWord, ScreenPosition, WordDirection } from '@/types';

const randomBetween = (min: number, max: number): number => {
	return Math.random() * (max - min) + min;
};

const randomItem = <T,>(array: readonly T[]): T => {
	const item = array[Math.floor(Math.random() * array.length)];
	if (item == null) {
		throw new Error('Array is empty or item not found');
	}
	return item;
};

const calculateEndPosition = (start: ScreenPosition, direction: WordDirection): ScreenPosition => {
	const offset = BACKGROUND_ANIMATION_CONFIG.movementOffset;

	switch (direction) {
		case 'diagonal-up-right':
			return { x: start.x + offset, y: start.y - offset };
		case 'diagonal-up-left':
			return { x: start.x - offset, y: start.y - offset };
		case 'diagonal-down-right':
			return { x: start.x + offset, y: start.y + offset };
		case 'diagonal-down-left':
			return { x: start.x - offset, y: start.y + offset };
		case 'horizontal-right':
			return { x: start.x + offset, y: start.y };
		case 'horizontal-left':
			return { x: start.x - offset, y: start.y };
		case 'vertical-up':
			return { x: start.x, y: start.y - offset };
		case 'vertical-down':
			return { x: start.x, y: start.y + offset };
		default:
			return { x: start.x + offset, y: start.y + offset };
	}
};

const generateWord = (): AnimatedWord => {
	const direction = randomItem(WORD_DIRECTIONS);
	const startPosition: ScreenPosition = {
		x: randomBetween(BACKGROUND_ANIMATION_CONFIG.minStartPosition, BACKGROUND_ANIMATION_CONFIG.maxStartPosition),
		y: randomBetween(BACKGROUND_ANIMATION_CONFIG.minStartPosition, BACKGROUND_ANIMATION_CONFIG.maxStartPosition),
	};
	const endPosition = calculateEndPosition(startPosition, direction);

	return {
		id: `word-${Date.now()}-${Math.random()}`,
		text: randomItem(TRIVIA_WORDS),
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
	const [words, setWords] = useState<AnimatedWord[]>([]);
	const timeoutRef = useRef<Set<NodeJS.Timeout>>(new Set());

	// Initialize words on mount
	useEffect(() => {
		const timeouts = new Set<NodeJS.Timeout>();

		// Stagger the initial word creation
		for (let i = 0; i < BACKGROUND_ANIMATION_CONFIG.wordCount; i++) {
			const timeoutId = setTimeout(() => {
				const word = generateWord();
				setWords(prev => [...prev, word]);
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
	}, []);

	// Replace word when animation completes
	// Use useCallback to prevent creating new function on every render
	const handleAnimationComplete = useCallback((wordId: string) => {
		setWords(prev => {
			// Use functional update to avoid stale closure issues
			const filtered = prev.filter(w => w.id !== wordId);
			// Only add new word if we still have words in the array (prevent memory leaks)
			if (filtered.length < BACKGROUND_ANIMATION_CONFIG.wordCount) {
				return [...filtered, generateWord()];
			}
			return filtered;
		});
	}, []);

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
						ease: Easing.LINEAR,
						opacity: {
							times: [
								0,
								BACKGROUND_ANIMATION_CONFIG.fadeInPercent / 100,
								1 - BACKGROUND_ANIMATION_CONFIG.fadeOutPercent / 100,
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
