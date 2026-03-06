export interface UserStatsCacheEntry extends Record<string, unknown> {
	userId: string;
	email: string;
	credits: number;
	purchasedCredits: number;
	totalCredits: number;
	created_at: unknown;
	accountAge: number;
}

export interface UserSearchCacheResult extends Record<string, unknown> {
	id: string;
	email: string;
	firstName: string | null;
	lastName: string | null;
	avatar: number | null;
	displayName: string;
	role?: string;
	createdAt?: string;
	lastLogin?: string;
}

export interface UserSearchCacheEntry extends Record<string, unknown> {
	query: string;
	results: UserSearchCacheResult[];
	totalResults: number;
}
