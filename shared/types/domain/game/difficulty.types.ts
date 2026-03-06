export interface DifficultyConfigEntry {
	order: number;
	label: string;
	dotColor: string;
	badgeClasses: string;
	baseScore?: number;
	promptGuidance?: string;
}
