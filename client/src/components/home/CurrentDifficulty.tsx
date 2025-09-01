/**
 * תצוגת קושי נוכחי
 * מציג תג קושי כעת ואפשרות לפתיחת היסטוריית קושי מותאם.
 * @module CurrentDifficulty
 * @used_by client/src/views/home/HomeView.tsx
 */
import { formatTopic } from 'everytriv-shared/utils';

import type { CurrentDifficultyProps } from '../../types/ui.types';
import { getDifficultyDisplayText, getDifficultyIcon, isCustomDifficulty } from '../../utils/customDifficulty.utils';
import { FadeInUp } from '../animations';
import { Icon } from '../icons';
import { Button } from '../ui/Button';

export default function CurrentDifficulty({
	className,
	delay = 0.4,
	topic,
	difficulty,
	onShowHistory,
}: CurrentDifficultyProps) {
	if (!difficulty) return null;
	return (
		<FadeInUp className={className} delay={delay}>
			<div className='text-center mb-6 flex items-center justify-center gap-3'>
				<div className='bg-blue-500/20 backdrop-blur-sm border border-blue-300/30 text-white text-base px-4 py-2 rounded-lg flex items-center gap-2'>
					<Icon name={getDifficultyIcon(difficulty)} size='lg' className='text-white' />
					<span>
						<strong>{formatTopic(topic || 'No topic')}</strong> - {getDifficultyDisplayText(difficulty)}
					</span>
				</div>
				{isCustomDifficulty(difficulty) && (
					<Button
						size='sm'
						variant='ghost'
						onClick={onShowHistory}
						className='text-white/70 hover:text-white border border-white/20 hover:border-white/40'
					>
						<Icon name='history' size='sm' className='mr-1' /> History
					</Button>
				)}
			</div>
		</FadeInUp>
	);
}
