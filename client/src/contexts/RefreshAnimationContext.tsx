import { createContext, useContext } from 'react';

export const RefreshAnimationContext = createContext<number>(0);

export function useRefreshAnimationGeneration(): number {
	return useContext(RefreshAnimationContext);
}
