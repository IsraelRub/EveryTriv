export interface ProfileCompletionData {
	username: string;
	bio: string;
}

export interface CompleteProfileProps {
	onComplete?: (data: ProfileCompletionData) => void;
}

export interface AvatarSelectorProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	currentAvatarId?: number;
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
	disabled?: boolean;
	text?: string;
}
