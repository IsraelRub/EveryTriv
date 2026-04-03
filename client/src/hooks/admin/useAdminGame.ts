import { useQuery } from '@tanstack/react-query';

import { ERROR_MESSAGES } from '@shared/constants';

import { QUERY_CACHE_PRESETS, QUERY_KEYS } from '@/constants';
import { gameService } from '@/services';
import { useUserRole } from '../useAuth';

export const useGameStatistics = (enabled?: boolean) => {
	const { isAdmin } = useUserRole();

	return useQuery({
		queryKey: QUERY_KEYS.admin.gameStatistics(),
		queryFn: async () => {
			if (!isAdmin) {
				throw new Error(ERROR_MESSAGES.validation.ADMIN_ACCESS_DENIED);
			}
			return gameService.getGameStatistics();
		},
		enabled: enabled !== undefined ? enabled && isAdmin : isAdmin,
		...QUERY_CACHE_PRESETS.staleFifteenGcThirty,
	});
};

export const useAllTriviaQuestions = (enabled?: boolean) => {
	const { isAdmin } = useUserRole();

	return useQuery({
		queryKey: QUERY_KEYS.admin.allTriviaQuestions(),
		queryFn: async () => {
			if (!isAdmin) {
				throw new Error(ERROR_MESSAGES.validation.ADMIN_ACCESS_DENIED);
			}
			return gameService.getAllTriviaQuestions();
		},
		enabled: enabled !== undefined ? enabled && isAdmin : isAdmin,
		...QUERY_CACHE_PRESETS.staleOneHourGcTwoHours,
	});
};
