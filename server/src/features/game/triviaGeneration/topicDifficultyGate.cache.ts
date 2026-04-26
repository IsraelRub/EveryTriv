import { TOPIC_DIFFICULTY_GATE_CACHE_MAX_KEYS, TOPIC_DIFFICULTY_GATE_CACHE_TTL_MS } from '@shared/validation';

import type { TopicDifficultyGateCacheEntry } from '@internal/types';

export class TopicDifficultyGateCache {
	private readonly maxKeys: number;
	private readonly ttlMs: number;
	private readonly map = new Map<string, TopicDifficultyGateCacheEntry>();

	constructor(
		maxKeys: number = TOPIC_DIFFICULTY_GATE_CACHE_MAX_KEYS,
		ttlMs: number = TOPIC_DIFFICULTY_GATE_CACHE_TTL_MS
	) {
		this.maxKeys = maxKeys;
		this.ttlMs = ttlMs;
	}

	get(key: string): TopicDifficultyGateCacheEntry | undefined {
		const row = this.map.get(key);
		if (row == null) {
			return undefined;
		}
		if (Date.now() > row.expiresAt) {
			this.map.delete(key);
			return undefined;
		}
		this.map.delete(key);
		this.map.set(key, row);
		return row;
	}

	set(key: string, entry: Omit<TopicDifficultyGateCacheEntry, 'expiresAt'> & { expiresAt?: number }): void {
		const expiresAt = entry.expiresAt ?? Date.now() + this.ttlMs;
		const next: TopicDifficultyGateCacheEntry = {
			status: entry.status,
			...(entry.reason !== undefined ? { reason: entry.reason } : {}),
			expiresAt,
		};

		if (this.map.has(key)) {
			this.map.delete(key);
		} else if (this.map.size >= this.maxKeys) {
			const oldest = this.map.keys().next().value;
			if (oldest !== undefined) {
				this.map.delete(oldest);
			}
		}
		this.map.set(key, next);
	}
}
