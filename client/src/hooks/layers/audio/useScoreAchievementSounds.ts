import { useEffect } from 'react';

import { AudioKey } from '../../../constants';
import { useAudio, useOperationTimer } from '../../contexts';
import { usePrevious } from '../utils';

/**
 * Enhanced achievement sound hook with configurable thresholds
 * Replaces both useScoreAchievementSounds and useConfigurableAchievementSounds
 */
export const useScoreAchievementSounds = (
	score: number,
	total: number,
	options: {
		thresholds?: { perfect: number; excellent: number; good: number; milestone: number };
		sounds?: {
			perfect: AudioKey;
			excellent: AudioKey;
			good: AudioKey;
			milestone: AudioKey;
			small: AudioKey;
			minor: AudioKey;
		};
		enableMinor?: boolean;
	} = {}
): void => {
	const { start, complete } = useOperationTimer('achievement-sound');
	const { playSound } = useAudio();
	const previousScore = usePrevious(score);

	const {
		thresholds = { perfect: 100, excellent: 80, good: 60, milestone: 5 },
		sounds = {
			perfect: AudioKey.NEW_ACHIEVEMENT,
			excellent: AudioKey.LEVEL_UP,
			good: AudioKey.SUCCESS,
			milestone: AudioKey.POINT_STREAK,
			small: AudioKey.POINT_EARNED,
			minor: AudioKey.CLICK,
		},
		enableMinor = true,
	} = options;

	useEffect(() => {
		if (previousScore !== undefined && score > previousScore) {
			start();
			const scoreIncrease = score - previousScore;
			const percentage = (score / total) * 100;

			// Play different sounds based on configured thresholds
			if (percentage >= thresholds.perfect) {
				playSound(sounds.perfect);
			} else if (percentage >= thresholds.excellent) {
				playSound(sounds.excellent);
			} else if (percentage >= thresholds.good) {
				playSound(sounds.good);
			} else if (scoreIncrease >= thresholds.milestone) {
				playSound(sounds.milestone);
			} else if (scoreIncrease >= 2) {
				playSound(sounds.small);
			} else if (enableMinor) {
				playSound(sounds.minor);
			}
			complete();
		}
	}, [score, total, previousScore, playSound, start, complete, thresholds, sounds, enableMinor]);
};
