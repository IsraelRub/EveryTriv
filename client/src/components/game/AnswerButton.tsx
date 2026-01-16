import { motion } from 'framer-motion';
import { CheckCircle, XCircle } from 'lucide-react';

import { useAnswerStyle } from '@/hooks';
import type { AnswerButtonProps } from '@/types';
import { cn, getAnswerLetter } from '@/utils';

export function AnswerButton({
	answer,
	index,
	answered,
	selectedAnswer,
	currentQuestion,
	onClick,
	showResult = false,
	animationDelay = index * 0.05,
	className,
}: AnswerButtonProps) {
	const styleClasses = useAnswerStyle({
		answerIndex: index,
		answered,
		selectedAnswer,
		currentQuestion,
		showResult,
	});

	const isSelected = selectedAnswer === index;
	const isCorrect = showResult ? (answer.isCorrect ?? false) : false;
	const isWrong = showResult && isSelected && !isCorrect;

	return (
		<motion.button
			key={index}
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: animationDelay }}
			onClick={() => onClick(index)}
			disabled={answered}
			className={cn(
				'p-3 md:p-4 rounded-lg border-2 border-white transition-all text-left h-full flex items-center',
				styleClasses,
				answered ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]',
				className
			)}
		>
			<div className='flex items-center gap-3 w-full'>
				<span className='flex-shrink-0 w-7 h-7 rounded-full bg-muted flex items-center justify-center font-medium text-sm'>
					{getAnswerLetter(index)}
				</span>
				<span className='flex-1 text-base leading-tight'>{answer.text}</span>
				{showResult && isCorrect && (
					<motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className='flex-shrink-0'>
						<CheckCircle className='h-4 w-4 text-green-500' />
					</motion.span>
				)}
				{isWrong && (
					<motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className='flex-shrink-0'>
						<XCircle className='h-4 w-4 text-red-500' />
					</motion.span>
				)}
				{isSelected && !showResult && (
					<motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className='flex-shrink-0'>
						<div className='h-4 w-4 rounded-full border-2 border-primary' />
					</motion.span>
				)}
			</div>
		</motion.button>
	);
}
