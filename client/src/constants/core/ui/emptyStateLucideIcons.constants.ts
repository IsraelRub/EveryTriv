import { FileQuestion, SearchX, UserX } from 'lucide-react';

export const EMPTY_STATE_LUCIDE_ICON = {
	searchNoResults: SearchX,
	triviaNoQuestionsInDb: FileQuestion,
	tableNoRows: UserX,
} as const;
