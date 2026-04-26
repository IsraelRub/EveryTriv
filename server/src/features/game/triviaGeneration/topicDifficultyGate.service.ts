import { BadRequestException, Injectable } from '@nestjs/common';

import { ERROR_MESSAGES, Locale, OUTPUT_LANGUAGE_LABELS } from '@shared/constants';
import type { GameDifficulty } from '@shared/types';
import { buildTopicDifficultyGateCacheKey, shouldSkipTopicDifficultyGate } from '@shared/validation';

import { TRIVIA_GENERATION_DECLINED_REASON, type TriviaGenerationDeclinedReason } from '@internal/constants';
import { serverLogger as logger } from '@internal/services';

import { GroqTriviaProvider } from './providers/groq';
import { TopicDifficultyGateCache } from './topicDifficultyGate.cache';

@Injectable()
export class TopicDifficultyGateService {
	private readonly cache = new TopicDifficultyGateCache();
	private readonly provider = new GroqTriviaProvider();

	async enforceTopicDifficultyGate(params: {
		topic: string;
		difficulty: GameDifficulty;
		outputLanguage: Locale;
	}): Promise<void> {
		if (shouldSkipTopicDifficultyGate(params)) {
			return;
		}

		const key = buildTopicDifficultyGateCacheKey(params.topic, params.difficulty, params.outputLanguage);
		const cached = this.cache.get(key);
		if (cached?.status === 'accepted') {
			return;
		}
		if (cached?.status === 'rejected') {
			this.throwDeclined(this.parseCachedReason(cached.reason));
			return;
		}

		const declineReason = await this.provider.evaluateTopicDifficultyGate({
			topic: params.topic,
			difficulty: params.difficulty,
			outputLanguage: params.outputLanguage,
			outputLanguageLabel: OUTPUT_LANGUAGE_LABELS[params.outputLanguage],
		});

		if (declineReason != null) {
			this.cache.set(key, { status: 'rejected', reason: declineReason });
			this.throwDeclined(declineReason);
			return;
		}

		this.cache.set(key, { status: 'accepted' });
	}

	async validateTopicDifficultyForClient(params: {
		topic: string;
		difficulty: GameDifficulty;
		outputLanguage: Locale;
	}): Promise<{ ok: true }> {
		await this.enforceTopicDifficultyGate(params);
		return { ok: true };
	}

	private parseCachedReason(raw: string | undefined): TriviaGenerationDeclinedReason {
		if (raw === TRIVIA_GENERATION_DECLINED_REASON.UNCLEAR_TOPIC) {
			return TRIVIA_GENERATION_DECLINED_REASON.UNCLEAR_TOPIC;
		}
		if (raw === TRIVIA_GENERATION_DECLINED_REASON.UNCLEAR_DIFFICULTY) {
			return TRIVIA_GENERATION_DECLINED_REASON.UNCLEAR_DIFFICULTY;
		}
		if (raw === TRIVIA_GENERATION_DECLINED_REASON.UNCLEAR_TOPIC_AND_DIFFICULTY) {
			return TRIVIA_GENERATION_DECLINED_REASON.UNCLEAR_TOPIC_AND_DIFFICULTY;
		}
		if (raw === TRIVIA_GENERATION_DECLINED_REASON.INSUFFICIENT_VERIFIABLE_FACTS) {
			return TRIVIA_GENERATION_DECLINED_REASON.INSUFFICIENT_VERIFIABLE_FACTS;
		}
		logger.gameError('Topic gate cache had unknown reason', { reason: raw });
		return TRIVIA_GENERATION_DECLINED_REASON.UNCLEAR_TOPIC_AND_DIFFICULTY;
	}

	private throwDeclined(reason: TriviaGenerationDeclinedReason): never {
		let message: string;
		switch (reason) {
			case TRIVIA_GENERATION_DECLINED_REASON.UNCLEAR_TOPIC:
				message = ERROR_MESSAGES.game.TRIVIA_DECLINED_UNCLEAR_TOPIC;
				break;
			case TRIVIA_GENERATION_DECLINED_REASON.UNCLEAR_DIFFICULTY:
				message = ERROR_MESSAGES.game.TRIVIA_DECLINED_UNCLEAR_DIFFICULTY;
				break;
			case TRIVIA_GENERATION_DECLINED_REASON.UNCLEAR_TOPIC_AND_DIFFICULTY:
				message = ERROR_MESSAGES.game.TRIVIA_DECLINED_UNCLEAR_TOPIC_AND_DIFFICULTY;
				break;
			case TRIVIA_GENERATION_DECLINED_REASON.INSUFFICIENT_VERIFIABLE_FACTS:
				message = ERROR_MESSAGES.game.TRIVIA_DECLINED_INSUFFICIENT_VERIFIABLE_FACTS;
				break;
		}
		throw new BadRequestException({
			message,
			errors: [message],
		});
	}
}
