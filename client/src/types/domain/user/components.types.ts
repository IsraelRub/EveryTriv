import type { AvatarSize } from '@/constants';

export interface ProfileCompletionData {
	username: string;
	bio: string;
}

export interface CompleteProfileProps {
	onComplete?: (data: ProfileCompletionData) => void;
}

/** User-like source: navigation, profile, leaderboard. Single source of truth for deriving display name and avatar. */
export interface UserAvatarUserSource {
	firstName?: string | null;
	lastName?: string | null;
	email?: string | null;
	avatar?: number | null;
}

/** Player-like source: multiplayer lobby/game/summary. Single source of truth for deriving display name and avatar. */
export interface UserAvatarPlayerSource {
	displayName?: string | null;
	avatar?: number | null;
}

/** Exactly one of user, player, or name is required. Use AVATAR_FALLBACK_LETTER for fallbackLetter (P or U). */
export type UserAvatarProps = {
	className?: string;
	fallbackClassName?: string;
	size?: AvatarSize;
	fallbackLetter?: string;
	avatarId?: number | null;
	src?: string | null;
	name?: string | null;
} & (
	| { user: UserAvatarUserSource; player?: never }
	| { player: UserAvatarPlayerSource; user?: never }
	| { name: string; user?: never; player?: never }
);

export interface AvatarSelectorProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	currentAvatarId: number | undefined;
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

/** Profile name field key for complete-profile form. */
export type ProfileNameField = 'firstName' | 'lastName';
