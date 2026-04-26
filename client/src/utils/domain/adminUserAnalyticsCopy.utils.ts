import type { TFunction } from 'i18next';

import type { RecommendationPriority } from '@shared/constants';
import type { SystemRecommendation, UserInsightItem } from '@shared/types';
import { formatDate } from '@shared/utils';

const ADMIN_NS = 'admin';

export function formatUserInsightLine(item: UserInsightItem, t: TFunction): string {
	switch (item.kind) {
		case 'strength_topic':
			return t('userInsightCopy.strengthTopic', {
				ns: ADMIN_NS,
				topic: item.topic,
				rate: String(item.successRate),
				games: String(item.gamesPlayed),
			});
		case 'improvement_topic':
			return t('userInsightCopy.improvementTopic', {
				ns: ADMIN_NS,
				topic: item.topic,
				rate: String(item.successRate),
				games: String(item.gamesPlayed),
			});
		case 'best_streak':
			return t('userInsightCopy.bestStreak', { ns: ADMIN_NS, days: String(item.days) });
		case 'improve_weakest_topic':
			return t('userInsightCopy.improveWeakestTopic', { ns: ADMIN_NS, topic: item.topic });
		case 'recent_activity': {
			const actionLabel = t(`userInsightCopy.activityActions.${item.action}`, {
				ns: ADMIN_NS,
				defaultValue: item.action.replace(/_/g, ' '),
			});
			const dateStr = formatDate(item.date);
			const hasScores = item.score != null && item.gameQuestionCount != null && item.correctAnswers != null;
			let body = '';
			if (hasScores) {
				body = t('userInsightCopy.activityScoreDetail', {
					ns: ADMIN_NS,
					score: String(item.score),
					total: String(item.gameQuestionCount),
					correct: String(item.correctAnswers),
				});
			} else if (item.detail != null && item.detail !== '') {
				body = item.detail;
			} else if (item.topic != null && item.topic !== '') {
				body = t('userInsightCopy.activityTopicOnly', { ns: ADMIN_NS, topic: item.topic });
			}
			const bodySuffix = body !== '' ? `: ${body}` : '';
			return t('userInsightCopy.recentActivityLine', {
				ns: ADMIN_NS,
				date: dateStr,
				action: actionLabel,
				bodySuffix,
			});
		}
		case 'fallback_highlight':
			return t('userInsightCopy.fallbackHighlight', { ns: ADMIN_NS });
		default:
			return '';
	}
}

export interface TranslatedAdminRecommendation {
	title: string;
	description: string;
	message: string;
	action: string;
	estimatedImpact: string;
	implementationEffort: string;
}

export function translateAdminRecommendation(rec: SystemRecommendation, t: TFunction): TranslatedAdminRecommendation {
	const base = `userRecCopy.${rec.id}`;
	const params = rec.i18nParams ?? {};
	const title = t(`${base}.title`, { ns: ADMIN_NS, ...params });
	const description = t(`${base}.description`, { ns: ADMIN_NS, ...params });
	const message = t(`${base}.message`, { ns: ADMIN_NS, ...params });
	const action = t(`${base}.action`, { ns: ADMIN_NS, ...params });
	const estimatedImpact = t(`${base}.estimatedImpact`, {
		ns: ADMIN_NS,
		...params,
	});
	const effortKey = rec.implementationEffort;
	const implementationEffort = t(`userRecCopy.effort.${effortKey}`, { ns: ADMIN_NS });
	return { title, description, message, action, estimatedImpact, implementationEffort };
}

export function translateRecommendationPriority(priority: RecommendationPriority, t: TFunction): string {
	return t(`recommendationPriority.${priority}`, { ns: ADMIN_NS, defaultValue: priority });
}
