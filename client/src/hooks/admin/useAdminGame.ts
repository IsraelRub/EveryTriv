import { useQuery } from '@tanstack/react-query';

import { ERROR_MESSAGES, VALIDATION_COUNT } from '@shared/constants';

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

	const triviaPageLimit = VALIDATION_COUNT.ADMIN_TRIVIA_LIST.DEFAULT_LIMIT;
	const triviaPageOffset = 0;

	return useQuery({
		queryKey: [...QUERY_KEYS.admin.allTriviaQuestions(), triviaPageLimit, triviaPageOffset],
		queryFn: async () => {
			if (!isAdmin) {
				throw new Error(ERROR_MESSAGES.validation.ADMIN_ACCESS_DENIED);
			}
			return gameService.getAllTriviaQuestions({ limit: triviaPageLimit, offset: triviaPageOffset });
		},
		enabled: enabled !== undefined ? enabled && isAdmin : isAdmin,
		...QUERY_CACHE_PRESETS.staleOneHourGcTwoHours,
	});
};
