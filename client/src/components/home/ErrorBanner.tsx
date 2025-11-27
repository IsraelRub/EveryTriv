/**
 * Error Banner Component for Home View
 * @module ErrorBanner
 * @used_by client/src/views/home/HomeView.tsx
 */
import { motion } from 'framer-motion';

import { isCustomDifficulty } from '@shared/validation';

import { ComponentSize } from '../../constants';
import type { ErrorBannerProps } from '../../types';
import { Icon } from '../ui/IconLibrary';

export default function ErrorBanner({ message, difficulty }: ErrorBannerProps) {
	if (!message) return null;
	return (
		<motion.div
			className='bg-red-500 bg-opacity-20 border border-red-500 text-red-100 px-4 py-3 rounded mt-4'
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5 }}
		>
			<strong>Error:</strong> {message}
			{difficulty && isCustomDifficulty(difficulty) && (
				<div className='mt-2 text-sm text-red-300 flex items-center gap-2'>
					<Icon name='lightbulb' size={ComponentSize.SM} className='text-yellow-400' />
					Make sure your custom difficulty description is clear and specific. &quot;beginner cooking skills&quot;,
					&quot;professional sports knowledge&quot;
				</div>
			)}
		</motion.div>
	);
}
