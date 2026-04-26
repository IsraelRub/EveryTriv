import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { cva } from 'class-variance-authority';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle } from 'lucide-react';

import { VALIDATION_COUNT } from '@shared/constants';
import { getCorrectAnswerIndex } from '@shared/utils';

import {
	AnimationDelays,
	ANSWER_LETTER_KEYS,
	AnswerButtonState,
	GameKey,
	ResultTarget,
	resultVariants,
	SPRING_CONFIGS,
	StatusDirection,
} from '@/constants';
import type { AnswerButtonProps } from '@/types';
import { cn } from '@/utils';

const answerButtonVariants = cva(
	'relative overflow-hidden flex flex-col p-3 md:p-4 rounded-lg border-2 border-solid transition-all text-left min-h-[80px] h-full w-full',
	{
		variants: {
			state: {
				[AnswerButtonState.IDLE]: 'bg-blue-900/80 hover:bg-blue-800/90 border-white/80 [&_.answer-bar]:bg-primary/70',
				[AnswerButtonState.SELECTED]: 'bg-blue-500/50 border-blue-500 [&_.answer-bar]:bg-primary/70',
				[AnswerButtonState.CORRECT]: 'bg-green-500/40 border-white/80 [&_.answer-bar]:bg-green-500',
				[AnswerButtonState.WRONG]: 'bg-red-500/40 border-white/80 [&_.answer-bar]:bg-red-500',
				[AnswerButtonState.DISABLED]: 'opacity-50 border-white/80 [&_.answer-bar]:bg-primary/70',
			},
		},
		compoundVariants: [
			{
				state: [AnswerButtonState.IDLE, AnswerButtonState.SELECTED],
				class: 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]',
			},
			{
				state: [AnswerButtonState.CORRECT, AnswerButtonState.WRONG, AnswerButtonState.DISABLED],
				class: 'cursor-not-allowed',
			},
		],
		defaultVariants: {
			state: AnswerButtonState.IDLE,
		},
	}
);

export const AnswerButton = memo(function AnswerButton({
	answers,
	answered,
	selectedAnswer,
	currentQuestion,
	onAnswerClick,
	showResult = false,
	answerCounts,
	totalPlayerCount,
}: AnswerButtonProps) {
	const { t } = useTranslation('game');
	if (!answers || !Array.isArray(answers) || answers.length === 0) {
		return <div className='text-center text-muted-foreground'>{t(GameKey.NO_ANSWERS_AVAILABLE)}</div>;
	}

	const correctAnswerIndex = currentQuestion ? getCorrectAnswerIndex(currentQuestion) : -1;
	const showCorrectAnswerUnavailable = showResult && selectedAnswer !== null && correctAnswerIndex === -1;

	const gridColsClass =
		answers.length <= 2
			? 'grid-cols-1 sm:grid-cols-2'
			: answers.length <= 4
				? 'grid-cols-1 sm:grid-cols-2'
				: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
	const gridRowsClass = answers.length <= 2 ? 'grid-rows-1' : 'grid-rows-2';

	return (
		<div className='flex flex-col flex-1 min-h-0'>
			<div
				className={cn(
					'grid gap-x-4 gap-y-4 flex-1 min-h-0 items-center justify-items-center',
					gridRowsClass,
					gridColsClass
				)}
			>
				{answers.map((answer, index) => {
					const isSelected = selectedAnswer === index;
					const isCorrect = showResult && currentQuestion ? index === getCorrectAnswerIndex(currentQuestion) : false;
					const isWrong = showResult && isSelected && !isCorrect;

					const buttonState: AnswerButtonState = showResult
						? isCorrect
							? AnswerButtonState.CORRECT
							: isWrong
								? AnswerButtonState.WRONG
								: AnswerButtonState.DISABLED
						: isSelected
							? AnswerButtonState.SELECTED
							: answered
								? AnswerButtonState.DISABLED
								: AnswerButtonState.IDLE;

					const showMultiplayerCount = totalPlayerCount != null && totalPlayerCount > 0;
					const count = answerCounts?.[index] ?? 0;
					const fillPercent = showMultiplayerCount && totalPlayerCount > 0 ? (count / totalPlayerCount) * 100 : 0;

					const minLetterIndex = 0;
					const maxLetterIndex = Math.min(ANSWER_LETTER_KEYS.length, VALIDATION_COUNT.ANSWER_COUNT.MAX) - 1;
					const letterKey = index >= minLetterIndex && index <= maxLetterIndex ? ANSWER_LETTER_KEYS[index] : undefined;
					const answerLetter = letterKey !== undefined ? t(letterKey) : '?';

					return (
						<motion.button
							key={index}
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: index * AnimationDelays.STAGGER_SMALL }}
							onClick={() => onAnswerClick(index)}
							disabled={answered}
							className={answerButtonVariants({ state: buttonState })}
						>
							<div className='relative z-10 flex items-center gap-3 w-full flex-1 min-w-0'>
								<span className='flex-shrink-0 w-7 h-7 rounded-full bg-muted flex items-center justify-center font-medium text-sm'>
									{answerLetter}
								</span>
								<span className='flex-1 text-base leading-tight min-w-0'>{answer.text}</span>
								{showMultiplayerCount && (
									<span className='flex-shrink-0 text-muted-foreground text-xs font-medium tabular-nums'>{count}</span>
								)}
								{(isCorrect || isWrong) && (
									<motion.span
										initial={{ scale: 0 }}
										animate={{ scale: 1 }}
										transition={SPRING_CONFIGS.ICON_SPRING}
										className='flex-shrink-0'
									>
										{isCorrect ? (
											<CheckCircle2
												className={resultVariants({
													direction: StatusDirection.POSITIVE,
													target: ResultTarget.ICON_SM,
												})}
											/>
										) : (
											<XCircle
												className={resultVariants({
													direction: StatusDirection.NEGATIVE,
													target: ResultTarget.ICON_SM,
												})}
											/>
										)}
									</motion.span>
								)}
								{isSelected && !showResult && (
									<motion.span
										initial={{ scale: 0 }}
										animate={{ scale: 1 }}
										transition={SPRING_CONFIGS.ICON_SPRING}
										className='flex-shrink-0'
									>
										<div className='h-4 w-4 rounded-full border-2 border-primary' />
									</motion.span>
								)}
							</div>
							{showMultiplayerCount && (
								<div className='relative z-10 w-full h-1.5 rounded-b-[6px] overflow-hidden flex-shrink-0 mt-2 bg-muted/50'>
									<div
										className='answer-bar h-full min-w-0 rounded-b-[4px] transition-[width] duration-300 ease-out'
										style={{ width: `clamp(0%, ${fillPercent}%, 100%)` }}
									/>
								</div>
							)}
						</motion.button>
					);
				})}
			</div>
			{showCorrectAnswerUnavailable && (
				<p className='text-sm text-muted-foreground text-center mt-2'>{t(GameKey.CORRECT_ANSWER_NOT_DISPLAYED)}</p>
			)}
		</div>
	);
});
