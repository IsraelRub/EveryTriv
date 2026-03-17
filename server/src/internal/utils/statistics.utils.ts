import { mean, sumBy } from '@shared/utils';

import type { MeanVarianceStddev } from '../types';

export function computeMeanVarianceStddev(values: number[]): MeanVarianceStddev {
	if (values.length === 0) return { mean: 0, variance: 0, standardDeviation: 0 };
	const m = mean(values);
	const variance = sumBy(values, v => (v - m) ** 2) / values.length;
	const standardDeviation = variance ** 0.5;
	return { mean: m, variance, standardDeviation };
}
