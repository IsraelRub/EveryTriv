import { cva } from 'class-variance-authority';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle } from 'lucide-react';

import { getCorrectAnswerIndex } from '@shared/utils';

import { ANIMATION_DELAYS, AnswerButtonState, SPRING_CONFIGS } from '@/constants';
import type { AnswerButtonItemProps, AnswerButtonProps } from '@/types';
import { cn } from '@/utils';

const answerButtonVariants = cva(
	'p-3 md:p-4 rounded-lg border-2 border-solid transition-all text-left flex items-center min-h-[80px] h-full w-full',
	{
		variants: {
			state: {
				[AnswerButtonState.IDLE]: 'bg-blue-900/80 hover:bg-blue-800/90 border-border',
				[AnswerButtonState.SELECTED]: 'bg-blue-500/50 border-blue-500',
				[AnswerButtonState.CORRECT]: 'bg-green-500/40 border-green-500',
				[AnswerButtonState.WRONG]: 'bg-red-500/40 border-red-500',
				[AnswerButtonState.DISABLED]: 'opacity-50 border-border',
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

function AnswerButtonItem({
	answer,
	index,
	answered,
	selectedAnswer,
	currentQuestion,
	onClick,
	showResult = false,
	animationDelay = index * ANIMATION_DELAYS.STAGGER_SMALL,
	className,
	playerCount,
}: AnswerButtonItemProps) {
	const isSelected = selectedAnswer === index;

	// Determine if this answer is correct
	const isCorrect = showResult && currentQuestion ? index === getCorrectAnswerIndex(currentQuestion) : false;
	const isWrong = showResult && isSelected && !isCorrect;

	// Determine button state
	const buttonState: AnswerButtonState = showResult
		? isCorrect
			? AnswerButtonState.CORRECT
			: isWrong
				? AnswerButtonState.WRONG
				: AnswerButtonState.DISABLED
		: !answered
			? isSelected
				? AnswerButtonState.SELECTED
				: AnswerButtonState.IDLE
			: AnswerButtonState.DISABLED;

	return (
		<motion.button
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: animationDelay }}
			onClick={() => onClick(index)}
			disabled={answered}
			className={cn(answerButtonVariants({ state: buttonState }), className, 'relative')}
		>
			{playerCount !== undefined && playerCount > 0 && (
				<motion.span
					initial={{ scale: 0 }}
					animate={{ scale: 1 }}
					transition={SPRING_CONFIGS.ICON_SPRING}
					className='absolute top-1 right-1 bg-primary/20 text-primary text-xs font-medium px-1.5 py-0.5 rounded-full'
				>
					{playerCount}
				</motion.span>
			)}
			<div className='flex items-center gap-3 w-full'>
				<span className='flex-shrink-0 w-7 h-7 rounded-full bg-muted flex items-center justify-center font-medium text-sm'>
					{getAnswerLetter(index)}
				</span>
				<span className='flex-1 text-base leading-tight'>{answer.text}</span>
				{(isCorrect || isWrong) && (
					<motion.span
						initial={{ scale: 0 }}
						animate={{ scale: 1 }}
						transition={SPRING_CONFIGS.ICON_SPRING}
						className='flex-shrink-0'
					>
						{isCorrect ? (
							<CheckCircle className='h-4 w-4 text-green-500' />
						) : (
							<XCircle className='h-4 w-4 text-red-500' />
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
}

export function AnswerButton({
	answers,
	answered,
	selectedAnswer,
	currentQuestion,
	onAnswerClick,
	showResult = false,
	className,
	emptyStateMessage = 'No answers available',
	answerCounts,
}: AnswerButtonProps) {
	if (!answers || !Array.isArray(answers) || answers.length === 0) {
		return <div className={cn('text-center text-muted-foreground', className)}>{emptyStateMessage}</div>;
	}

	return (
		<div
			className={cn(
				'grid grid-rows-2 gap-x-4 gap-y-4 flex-1 min-h-0 items-center justify-items-center',
				answers.length <= 4 ? 'grid-cols-2' : 'grid-cols-3',
				className
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
				/>
			))}
		</div>
	);
}
