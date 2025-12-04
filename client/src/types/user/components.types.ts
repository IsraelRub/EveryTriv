/**
 * User Component Types
 * @module UserComponentTypes
 * @description Type definitions for user-related components
 */

/**
 * OAuth callback status type
 * @type CallbackStatus
 * @description Status of OAuth callback processing
 */
export type CallbackStatus = 'processing' | 'success' | 'error';

/**
 * Complete profile props interface
 * @interface CompleteProfileProps
 * @description Props for the CompleteProfile component
 */
export interface CompleteProfileProps {
	onComplete?: (data: { username: string; bio: string }) => void;
}
