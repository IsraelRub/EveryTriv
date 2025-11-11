export interface UserStatsCacheEntry extends Record<string, unknown> {
	userId: string;
	username: string;
	credits: number;
	purchasedPoints: number;
	totalPoints: number;
	stats: Record<string, unknown>;
	created_at: unknown;
	accountAge: number;
}

export interface UserSearchCacheResult extends Record<string, unknown> {
	id: string;
	username: string;
	firstName: string | null;
	lastName: string | null;
	avatar: string | null;
	displayName: string;
}

export interface UserSearchCacheEntry extends Record<string, unknown> {
	query: string;
	results: UserSearchCacheResult[];
	totalResults: number;
}

export interface AuditLogEntry extends Record<string, unknown> {
	userId: string;
	action: string;
	timestamp: string;
	ip: string;
	userAgent: string;
}

