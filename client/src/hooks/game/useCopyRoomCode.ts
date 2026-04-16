import { getErrorMessage } from '@shared/utils';

import { clientLogger as logger } from '@/services';
import { useClipboardCopy } from '../useClipboardCopy';

export function useCopyRoomCode(roomCode: string | null | undefined): {
	copied: boolean;
	copy: () => Promise<void>;
} {
	return useClipboardCopy({
		text: roomCode,
		onSuccess: () => {
			logger.userSuccess('Room code copied to clipboard', {
				roomCode: roomCode ?? undefined,
			});
		},
		onError: (error: unknown) => {
			logger.userError('Failed to copy room code', {
				errorInfo: { message: getErrorMessage(error) },
			});
		},
	});
}
