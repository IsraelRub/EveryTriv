import type { AvatarSize, AvatarVariant } from '@/constants';

export interface CompleteProfileProps {
	onComplete?: (data: ProfileCompletionData) => void;
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

export interface GoogleAuthButtonProps {
	onClick: () => void | Promise<void>;
	disabled: boolean;
	text?: string;
}

export interface ProfileCompletionData {
	username: string;
	bio: string;
}

export interface UserAvatarSource {
	firstName?: string | null;
	lastName?: string | null;
	email?: string | null;
	avatar?: number | null;
	avatarUrl?: string | null;
}
