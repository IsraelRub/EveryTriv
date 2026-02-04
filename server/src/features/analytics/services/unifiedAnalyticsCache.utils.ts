import type { ComparisonTarget, TimePeriod } from '@shared/constants';

export interface UnifiedQuerySignatureInput {
	includeSections?: string[];
	startDate?: Date;
	endDate?: Date;
	groupBy?: TimePeriod;
	activityLimit?: number;
	trendLimit?: number;
	includeActivity?: boolean;
	targetUserId?: string;
	comparisonTarget?: ComparisonTarget;
}

/**
 * Builds a stable JSON string signature for unified analytics cache key.
 * Normalizes includeSections (sorted), dates (ISO), and optional query fields.
 */
export function buildUnifiedQuerySignature(includeSections?: string[], options?: UnifiedQuerySignatureInput): string {
	const sections =
		includeSections && includeSections.length > 0
			? [...includeSections].map(s => s.toLowerCase()).sort()
			: ['statistics', 'performance'];
	const start = options?.startDate instanceof Date ? options.startDate.toISOString() : undefined;
	const end = options?.endDate instanceof Date ? options.endDate.toISOString() : undefined;
	const obj: Record<string, unknown> = {
		activityLimit: options?.activityLimit,
		comparisonTarget: options?.comparisonTarget,
		groupBy: options?.groupBy,
		include: sections,
		includeActivity: options?.includeActivity,
		endDate: end,
		startDate: start,
		targetUserId: options?.targetUserId,
		trendLimit: options?.trendLimit,
	};
	const keys = Object.keys(obj).sort();
	const normalized: Record<string, unknown> = {};
	for (const k of keys) {
		normalized[k] = obj[k];
	}
	return JSON.stringify(normalized);
}
