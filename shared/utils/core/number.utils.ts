export function getCurrentTimestampInSeconds(): number {
	return Math.floor(Date.now() / 1000);
}

export function calculateElapsedSeconds(startTime: number): number {
	return Math.floor((Date.now() - startTime) / 1000);
}

export function calculateDuration(startTime: number): number {
	return Date.now() - startTime;
}

export function calculateSuccessRate(totalQuestionsAnswered: number, correctAnswers: number): number {
	if (totalQuestionsAnswered === 0) {
		return 0;
	}
	const percentage = (correctAnswers / totalQuestionsAnswered) * 100;
	return Math.round(percentage);
}
