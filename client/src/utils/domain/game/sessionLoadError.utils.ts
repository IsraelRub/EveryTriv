import { ERROR_MESSAGES, HTTP_STATUS_CODES } from '@shared/constants';
import { extractValidationErrors, getErrorMessage, isRecord } from '@shared/utils';

const TRIVIA_DECLINED_MESSAGES: readonly string[] = [
	ERROR_MESSAGES.game.TRIVIA_DECLINED_UNCLEAR_TOPIC,
	ERROR_MESSAGES.game.TRIVIA_DECLINED_UNCLEAR_DIFFICULTY,
	ERROR_MESSAGES.game.TRIVIA_DECLINED_UNCLEAR_TOPIC_AND_DIFFICULTY,
	ERROR_MESSAGES.game.TRIVIA_DECLINED_INSUFFICIENT_VERIFIABLE_FACTS,
];

const TRIVIA_DECLINED_MESSAGE_SET = new Set<string>(TRIVIA_DECLINED_MESSAGES);

function messageIndicatesTriviaDeclined(message: string): boolean {
	return TRIVIA_DECLINED_MESSAGE_SET.has(message.trim());
}

export function isTriviaGenerationDeclinedLoadError(error: unknown): boolean {
	if (!isRecord(error) || !('response' in error) || !isRecord(error.response)) {
		return false;
	}
	const status = error.response.status;
	if (status !== HTTP_STATUS_CODES.BAD_REQUEST) {
		return false;
	}
	if (messageIndicatesTriviaDeclined(getErrorMessage(error))) {
		return true;
	}
	return extractValidationErrors(error).some(e => messageIndicatesTriviaDeclined(e));
}
