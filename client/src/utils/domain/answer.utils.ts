export const getAnswerLetter = (index: number): string => {
	if (index < 0 || index > 25) {
		return '?';
	}
	return String.fromCharCode(65 + index);
};

export const getAnswerIndexFromLetter = (letter: string): number => {
	if (letter?.length !== 1) {
		return -1;
	}
	const upperLetter = letter.toUpperCase();
	const index = upperLetter.charCodeAt(0) - 65;
	return index >= 0 && index <= 25 ? index : -1;
};
