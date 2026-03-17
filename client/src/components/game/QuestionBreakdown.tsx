import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle } from 'lucide-react';

import { ANIMATION_DELAYS, GameKey, ResultTarget, resultVariants, SPRING_CONFIGS, StatusDirection } from '@/constants';
import type { QuestionBreakdownProps } from '@/types';
import { Card } from '@/components';

export const QuestionBreakdown = memo(function QuestionBreakdown({
	entries,
	animationDelay = ANIMATION_DELAYS.STAGGER_NORMAL +
		ANIMATION_DELAYS.SEQUENCE_STEP +
		ANIMATION_DELAYS.SEQUENCE_STATS_BASE,
}: QuestionBreakdownProps) {
	const { t } = useTranslation();

	if (entries.length === 0) return null;

	return (
		<motion.div
			initial={{ opacity: 0, y: 20, scale: 0.95 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			transition={{ delay: animationDelay, ...SPRING_CONFIGS.GENTLE }}
			className='text-left'
		>
			<h3 className='text-lg font-semibold mb-4'>{t(GameKey.QUESTION_BREAKDOWN)}</h3>
			<div className='space-y-3 max-h-64 overflow-y-auto'>
				{entries.map((q, index) => {
					const direction = q.isCorrect ? StatusDirection.POSITIVE : StatusDirection.NEGATIVE;
					return (
						<Card key={index} className={resultVariants({ direction, target: ResultTarget.CARD })}>
							<div className='flex items-start gap-2'>
								{q.isCorrect ? (
									<CheckCircle2 className={resultVariants({ direction, target: ResultTarget.ICON_MD })} />
								) : (
									<XCircle className={resultVariants({ direction, target: ResultTarget.ICON_MD })} />
								)}
								<div className='flex-1 min-w-0 space-y-1'>
									<p className='text-sm font-medium line-clamp-2 break-words'>{q.question}</p>
									{q.correctAnswerText !== undefined && q.correctAnswerText !== '' && (
										<p className='text-xs text-muted-foreground'>
											{t(GameKey.BREAKDOWN_CORRECT_ANSWER)}{' '}
											<span className='font-medium text-foreground'>{q.correctAnswerText}</span>
										</p>
									)}
									{!q.isCorrect && q.userAnswerText !== undefined && q.userAnswerText !== '' && (
										<p className='text-xs text-muted-foreground'>
											{t(GameKey.BREAKDOWN_YOUR_ANSWER)}{' '}
											<span className='font-medium text-foreground'>{q.userAnswerText}</span>
										</p>
									)}
								</div>
							</div>
						</Card>
					);
				})}
			</div>
		</motion.div>
	);
});
