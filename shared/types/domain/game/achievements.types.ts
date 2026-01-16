export interface Achievement {
	id: string;
	name: string;
	description: string;
	icon: string;
	unlockedAt?: string;
	progress?: number;
	maxProgress?: number;
	category: string;
	points: number;
}
