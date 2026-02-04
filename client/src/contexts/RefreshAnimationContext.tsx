import { createContext, useContext } from 'react';

/** Increments on header Refresh completion; StatCards with countUp use it to re-run count-up animation. */
export const RefreshAnimationContext = createContext<number>(0);

export function useRefreshAnimationGeneration(): number {
	return useContext(RefreshAnimationContext);
}
