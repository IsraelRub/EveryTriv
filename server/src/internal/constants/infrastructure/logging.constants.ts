import { MEBIBYTE } from '@shared/constants';

export const SERVER_LOG_FILE_DEFAULTS = {
	maxFileBytes: 10 * MEBIBYTE,
	maxArchivedFiles: 5,
	maxArchivedFilesCap: 100,
} as const;
