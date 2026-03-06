import { memo } from 'react';
import { cva } from 'class-variance-authority';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle } from 'lucide-react';

import { getCorrectAnswerIndex } from '@shared/utils';

import { ANIMATION_DELAYS, AnswerButtonState, Colors, SPRING_CONFIGS } from '@/constants';
import type { AnswerButtonItemProps, AnswerButtonProps } from '@/types';
import { cn } from '@/utils';

const answerButtonVariants = cva(
	'p-3 md:p-4 rounded-lg border-2 border-solid transition-all text-left flex items-center min-h-[80px] h-full w-full',
	{
		variants: {
			state: {
				[AnswerButtonState.IDLE]: 'bg-blue-900/80 hover:bg-blue-800/90 border-white/80',
				[AnswerButtonState.SELECTED]: 'bg-blue-500/50 border-blue-500',
				[AnswerButtonState.CORRECT]: 'bg-green-500/40 border-white/80',
				[AnswerButtonState.WRONG]: 'bg-red-500/40 border-white/80',
				[AnswerButtonState.DISABLED]: 'opacity-50 border-white/80',
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

const getAnswerLetter = (index: number): string => {
	if (index < 0 || index > 25) {
		return '?';
	}
	return String.fromCharCode(65 + index);
};

const DIM_MAX_OPACITY = 0.45;

const AnswerButtonItem = memo(function AnswerButtonItem({
	answer,
	index,
	answered,
	selectedAnswer,
	currentQuestion,
	onClick,
	showResult = false,
	animationDelay = index * ANIMATION_DELAYS.STAGGER_SMALL,
	playerCount,
	totalPlayerCount,
}: AnswerButtonItemProps) {
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
	const count = playerCount ?? 0;
	const dimOpacity = showMultiplayerCount && totalPlayerCount > 0 ? (count / totalPlayerCount) * DIM_MAX_OPACITY : 0;

	return (
		<motion.button
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: animationDelay }}
			onClick={() => onClick(index)}
			disabled={answered}
			className={cn(answerButtonVariants({ state: buttonState }), 'relative overflow-hidden')}
		>
			{showMultiplayerCount && dimOpacity > 0 && (
				<div
					className='pointer-events-none absolute inset-0 rounded-[6px] bg-muted transition-opacity duration-300'
					style={{ opacity: dimOpacity }}
				/>
			)}
			<div className='relative z-10 flex items-center gap-3 w-full'>
				<span className='flex-shrink-0 w-7 h-7 rounded-full bg-muted flex items-center justify-center font-medium text-sm'>
					{getAnswerLetter(index)}
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
							<CheckCircle2 className={cn('h-4 w-4', Colors.GREEN_500.text)} />
						) : (
							<XCircle className={cn('h-4 w-4', Colors.RED_500.text)} />
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
		</motion.button>
	);
});

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
	if (!answers || !Array.isArray(answers) || answers.length === 0) {
		return <div className='text-center text-muted-foreground'>No answers available</div>;
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
				{answers.map((answer, index) => (
					<AnswerButtonItem
						key={index}
						answer={answer}
						index={index}
						answered={answered}
						selectedAnswer={selectedAnswer}
						currentQuestion={currentQuestion}
						onClick={onAnswerClick}
						showResult={showResult}
						playerCount={answerCounts?.[index]}
						totalPlayerCount={totalPlayerCount}
					/>
				))}
			</div>
			{showCorrectAnswerUnavailable && (
				<p className='text-sm text-muted-foreground text-center mt-2'>The correct answer could not be displayed </p>
			)}
		</div>
	);
});
