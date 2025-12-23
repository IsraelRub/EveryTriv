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
import { CallbackStatus as CallbackStatusEnum } from '@shared/constants';

export type CallbackStatus = (typeof CallbackStatusEnum)[keyof typeof CallbackStatusEnum];

/**
 * Profile completion data
 * @interface ProfileCompletionData
 * @description Data passed to profile completion callback
 * @used_by client/src/components/auth/CompleteProfile.tsx
 */
export interface ProfileCompletionData {
	username: string;
	bio: string;
}

/**
 * Complete profile props interface
 * @interface CompleteProfileProps
 * @description Props for the CompleteProfile component
 */
export interface CompleteProfileProps {
	onComplete?: (data: ProfileCompletionData) => void;
}

/**
 * Avatar selector component props
 * @interface AvatarSelectorProps
 * @description Props for the AvatarSelector component
 * @used_by client/src/components/user/AvatarSelector.tsx
 */
export interface AvatarSelectorProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	currentAvatarId?: number;
}

/**
 * Change password dialog component props
 * @interface ChangePasswordDialogProps
 * @description Props for the ChangePasswordDialog component
 * @used_by client/src/components/user/ChangePasswordDialog.tsx
 */
export interface ChangePasswordDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}
