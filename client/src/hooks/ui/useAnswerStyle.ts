import { useMemo } from 'react';

import { getCorrectAnswerIndex } from '@shared/utils';

import type { UseAnswerStyleOptions } from '@/types';
import { cn } from '@/utils';

export const useAnswerStyle = (options: UseAnswerStyleOptions): string => {
	const { answerIndex, answered, selectedAnswer, currentQuestion, showResult = false } = options;

	return useMemo(() => {
		// If not answered yet, show selection state
		if (!answered && !showResult) {
			return selectedAnswer === answerIndex ? cn('bg-blue-500/50', 'ring-2', 'ring-blue-500/70') : 'hover:bg-accent/50';
		}

		// If answered or showing result, show correctness
		const isSelected = selectedAnswer === answerIndex;
		let isCorrect = false;

		if (currentQuestion) {
			// TriviaQuestion always has correctAnswerIndex, use it to determine correctness
			const correctIndex = getCorrectAnswerIndex(currentQuestion);
			isCorrect = answerIndex === correctIndex;
		}

		if (isCorrect) {
			return cn('bg-green-500/40', 'ring-2', 'ring-green-500/70');
		}

		if (isSelected && !isCorrect) {
			return cn('bg-red-500/40', 'ring-2', 'ring-red-500/70');
		}

		return 'opacity-50';
	}, [answerIndex, answered, selectedAnswer, currentQuestion, showResult]);
};
