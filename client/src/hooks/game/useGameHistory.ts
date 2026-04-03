import { useQuery } from '@tanstack/react-query';

import { TIME_PERIODS_MS } from '@shared/constants';

import { QUERY_KEYS } from '@/constants';
import { gameHistoryService } from '@/services';
import { useIsAuthenticated } from '../useAuth';

export const useGameHistory = (limit: number = 20, offset: number = 0) => {
	return useQuery({
		queryKey: QUERY_KEYS.trivia.gameHistory('current', limit, offset),
		queryFn: () => gameHistoryService.getUserGameHistory(limit, offset),
		staleTime: TIME_PERIODS_MS.FIFTEEN_MINUTES,
		enabled: useIsAuthenticated(),
		refetchOnWindowFocus: true,
	});
};
