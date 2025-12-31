/**
 * User Component Types
 * @module UserComponentTypes
 * @description Type definitions for user-related components
 */

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
 * Profile edit dialog component props
 * @interface ProfileEditDialogProps
 * @description Props for the ProfileEditDialog component
 * @used_by client/src/components/user/ProfileEditDialog.tsx
 */
export interface ProfileEditDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}
