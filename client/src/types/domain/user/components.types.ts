import type { AvatarSize, AvatarVariant } from '@/constants';

export interface ProfileCompletionData {
	username: string;
	bio: string;
}

export interface CompleteProfileProps {
	onComplete?: (data: ProfileCompletionData) => void;
}

export interface UserAvatarSource {
	firstName?: string | null;
	lastName?: string | null;
	email?: string | null;
	avatar?: number | null;
	avatarUrl?: string | null;
}

export type UserAvatarProps = {
	source?: UserAvatarSource | null;
	size?: AvatarSize;
	fallbackLetter?: string;
	avatarId?: number | null;
	src?: string | null;

	name?: string | null;

	pointerEventsNone?: boolean;

	variant?: AvatarVariant;
};

export interface AvatarSelectorProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	currentAvatarId: number | undefined;
	currentAvatarUrl?: string | null;
	onAvatarSaved?: () => void;
}

export interface ProfileEditDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export interface ChangePasswordDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export type ChangePasswordValidationErrorKey =
	| 'currentPasswordRequired'
	| 'passwordInvalid'
	| 'passwordConfirmationInvalid';

export interface GoogleAuthButtonProps {
	onClick: () => void | Promise<void>;
	disabled: boolean;
	text?: string;
}

export type ProfileNameField = 'firstName' | 'lastName';
