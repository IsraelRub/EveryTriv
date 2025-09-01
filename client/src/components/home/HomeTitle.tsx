/**
 * כותרת עמוד הבית (Hero)
 * מציג כותרת וסלוגן עם אנימציית כניסה.
 * @module HomeTitle
 * @used_by client/src/views/home/HomeView.tsx
 */
import type { HomeTitleProps } from '../../types/ui.types';
import { FadeInDown } from '../animations';

export default function HomeTitle({ className, delay = 0.2 }: HomeTitleProps) {
	return (
		<FadeInDown className={className} delay={delay}>
			<h1 className='text-4xl md:text-5xl font-bold text-white mb-3 gradient-text'>EveryTriv</h1>
			<small className='block text-base mt-2 text-white opacity-75'>
				Smart Trivia Platform with Custom Difficulty Levels
			</small>
		</FadeInDown>
	);
}
