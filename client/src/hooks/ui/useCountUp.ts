import { useEffect, useState } from 'react';

import { TIME_PERIODS_MS } from '@shared/constants';

import { Easing } from '@/constants';
import type { UseCountUpOptions } from '@/types';

export function useCountUp(target: number, options: UseCountUpOptions = {}): number {
	const {
		duration = TIME_PERIODS_MS.TWO_SECONDS,
		enabled = true,
		easing = Easing.LINEAR,
		resetTrigger,
	} = options;
	const [count, setCount] = useState(0);

	useEffect(() => {
		if (!enabled) {
			setCount(target);
			return;
		}

		if (target === 0) {
			setCount(0);
			return;
		}

		let startTime: number | null = null;
		let animationFrameId: number;

		const easingFunctions = {
			linear: (t: number) => t,
			easeOut: (t: number) => 1 - (1 - t) ** 3,
			easeIn: (t: number) => t ** 3,
			easeInOut: (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 3 / 2),
		};

		const animate = (currentTime: number) => {
			startTime ??= currentTime;

			const elapsed = currentTime - startTime;
			const progress = Math.min(elapsed / duration, 1);
			const easedProgress = easingFunctions[easing](progress);
			const currentCount = Math.floor(easedProgress * target);

			setCount(currentCount);

			if (progress < 1) {
				animationFrameId = requestAnimationFrame(animate);
			} else {
				setCount(target);
			}
		};

		setCount(0);
		animationFrameId = requestAnimationFrame(animate);

		return () => {
			if (animationFrameId) {
				cancelAnimationFrame(animationFrameId);
			}
		};
	}, [target, duration, enabled, easing, resetTrigger]);

	return count;
}
