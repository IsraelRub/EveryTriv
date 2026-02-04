import type { ChartDataPoint } from '@/types';

export function getBarColorBySuccessRate(successRate: number): string {
	const clamped = Math.max(0, Math.min(100, successRate));
	const hue = clamped < 50 ? (clamped / 50) * 40 : 40 + ((clamped - 50) / 50) * 80;
	return `hsl(${hue}, 70%, 45%)`;
}

export function sortChartDataByValue(data: ChartDataPoint[]): ChartDataPoint[] {
	return [...data].sort((a, b) => b.value - a.value);
}

export function processChartDataWithOthers(
	data: ChartDataPoint[],
	maxItems: number,
	minPercentage?: number
): ChartDataPoint[] {
	if (!data || data.length === 0) return [];

	const sorted = sortChartDataByValue(data);
	const totalSum = calculateChartDataSum(sorted);

	// First, filter out items below minPercentage if provided
	let itemsToShow: ChartDataPoint[] = sorted;
	let othersData: ChartDataPoint[] = [];

	if (minPercentage !== undefined && minPercentage > 0) {
		const minValue = (totalSum * minPercentage) / 100;
		itemsToShow = sorted.filter(item => item.value >= minValue);
		othersData = sorted.filter(item => item.value < minValue);
	}

	// Then, limit to maxItems
	const topItems = itemsToShow.slice(0, maxItems);
	const remainingItems = itemsToShow.slice(maxItems);
	othersData = [...othersData, ...remainingItems];

	const othersSum = calculateChartDataSum(othersData);

	if (othersSum > 0) {
		return [
			...topItems,
			{
				name: 'Others',
				value: othersSum,
			},
		];
	}

	return topItems;
}

export function calculateChartDataSum(data: ChartDataPoint[]): number {
	if (!data || data.length === 0) return 0;
	return data.reduce((sum, item) => sum + item.value, 0);
}
