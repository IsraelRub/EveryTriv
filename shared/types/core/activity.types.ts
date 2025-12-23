/**
 * Activity Types (shared)
 * @module ActivityTypes
 * @description Activity tracking type definitions shared between client and server
 */

/**
 * Activity entry interface
 * @interface ActivityEntry
 * @description Structure for user activity tracking
 */
export interface ActivityEntry {
	date: string;
	action: string;
	detail?: string;
	topic?: string;
	durationSeconds?: number;
}
