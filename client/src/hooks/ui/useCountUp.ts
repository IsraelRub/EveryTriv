import { useEffect, useState } from 'react';

import { TIME_PERIODS_MS } from '@shared/constants';
import { calculateDuration } from '@shared/utils';

import type { UseCountUpOptions } from '@/types';

export function useCountUp(target: number, options: UseCountUpOptions = {}): number {
	const { duration = TIME_PERIODS_MS.FIVE_SECONDS, enabled = true, resetTrigger } = options;
	const [count, setCount] = useState(0);

	useEffect(() => {
		if (!enabled) {
			setCount(target);
			return;
		}

		setCount(0);
		if (target === 0) return;

		let startTime: number | null = null;
		let animationFrameId: number;

		const animate = (currentTime: number) => {
			startTime ??= currentTime;

			const elapsed = calculateDuration(startTime);
			const progress = Math.min(elapsed / duration, 1);
			const eased = 1 - (1 - progress) * (1 - progress);
			const currentCount = Math.floor(eased * target);

			setCount(currentCount);

			if (progress < 1) {
				animationFrameId = requestAnimationFrame(animate);
			} else {
				setCount(target);
			}
		};

		animationFrameId = requestAnimationFrame(animate);

		return () => {
			if (animationFrameId) {
				cancelAnimationFrame(animationFrameId);
			}
		};
	}, [target, duration, enabled, resetTrigger]);

	return count;
}
