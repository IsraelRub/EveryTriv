/**
 * Current difficulty display
 * Shows current difficulty tag and option to open custom difficulty history.
 * @module CurrentDifficulty
 * @used_by client/src/views/home
 */
import { motion } from 'framer-motion';

import { getDifficultyDisplayText, isCustomDifficulty } from '@shared/validation';

import { ButtonVariant, ComponentSize } from '../../constants';
import type { CurrentDifficultyProps } from '../../types';
import { formatTopic, getDifficultyIcon } from '../../utils';
import { fadeInUp } from '../animations';
import { Icon } from '../IconLibrary';
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
		<motion.div variants={fadeInUp} initial='hidden' animate='visible' transition={{ delay }} className={className}>
			<div className='text-center mb-6 flex items-center justify-center gap-3'>
				<div className='bg-blue-500/20 backdrop-blur-sm border border-blue-300/30 text-white text-base px-4 py-2 rounded-lg flex items-center gap-2'>
					<Icon name={getDifficultyIcon(difficulty)} size={ComponentSize.LG} className='text-white' />
					<span>
						<strong>{formatTopic(topic || 'No topic')}</strong> - {getDifficultyDisplayText(difficulty)}
					</span>
				</div>
				{isCustomDifficulty(difficulty) && (
					<Button
						size={ComponentSize.SM}
						variant={ButtonVariant.GHOST}
						onClick={onShowHistory}
						className='text-white/70 hover:text-white border border-white/20 hover:border-white/40'
					>
						<Icon name='history' size={ComponentSize.SM} className='mr-1' /> History
					</Button>
				)}
			</div>
		</motion.div>
	);
}
