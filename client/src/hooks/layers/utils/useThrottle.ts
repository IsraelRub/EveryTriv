import { useCallback, useEffect, useRef } from 'react';

export function useThrottle<T extends (...args: never[]) => unknown>(func: T, delay: number): T {
	const lastCall = useRef(0);
	const lastCallTimer = useRef<ReturnType<typeof setTimeout>>();

	// Cleanup timeout on unmount
	useEffect(() => {
		return () => {
			if (lastCallTimer.current) {
				clearTimeout(lastCallTimer.current);
			}
		};
	}, []);

	return useCallback(
		((...args: never[]) => {
			const now = Date.now();

			if (now - lastCall.current >= delay) {
				lastCall.current = now;
				func(...args);
			} else {
				if (lastCallTimer.current) {
					clearTimeout(lastCallTimer.current);
				}

				lastCallTimer.current = setTimeout(
					() => {
						lastCall.current = Date.now();
						func(...args);
					},
					delay - (now - lastCall.current)
				);
			}
		}) as T,
		[func, delay]
	);
}
