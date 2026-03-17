import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Key, Pencil } from 'lucide-react';

import { getDisplayNameFromUserFields } from '@shared/utils';
import { LengthKey, validateStringLength } from '@shared/validation';

import {
	AuthKey,
	AvatarSize,
	ButtonSize,
	CommonKey,
	DISPLAY_NAME_FALLBACKS,
	LoadingKey,
	VariantBase,
} from '@/constants';
import type { ProfileEditDialogProps } from '@/types';
import {
	AvatarSelector,
	Button,
	ChangePasswordDialog,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	Input,
	Label,
	UserAvatar,
} from '@/components';
import { useCurrentUserData, useUpdateUserProfile, useUserProfile } from '@/hooks';

export function ProfileEditDialog({ open, onOpenChange }: ProfileEditDialogProps) {
	const { t } = useTranslation(['auth', 'loading', 'common']);
	const [isEditing, setIsEditing] = useState(false);
	const [editData, setEditData] = useState({ firstName: '', lastName: '' });
	const [showAvatarSelector, setShowAvatarSelector] = useState(false);
	const [showChangePasswordDialog, setShowChangePasswordDialog] = useState(false);

	const currentUser = useCurrentUserData();
	const { data: userProfile, isLoading } = useUserProfile();
	const updateProfile = useUpdateUserProfile();

	const profile = userProfile?.profile;
	const currentAvatarId = profile?.avatar ?? undefined;

	const handleEditStart = () => {
		setEditData({
			firstName: profile?.firstName ?? '',
			lastName: profile?.lastName ?? '',
		});
		setIsEditing(true);
	};

	const handleSave = async () => {
		const firstNameValidation = validateStringLength(editData.firstName, LengthKey.FIRST_NAME);
		const lastNameValidation = validateStringLength(editData.lastName, LengthKey.LAST_NAME);

		if (!firstNameValidation.isValid || !lastNameValidation.isValid) {
			// Validation errors are handled by server, but we can prevent submission
			// The server will return proper error messages
			return;
		}

		try {
			// Always send lastName, even if empty (server will convert empty string to null)
			await updateProfile.mutateAsync({
				firstName: editData.firstName.trim(),
				lastName: editData.lastName.trim(),
			});
			setIsEditing(false);
		} catch {
			// Error handled by mutation
		}
	};

	const displayName = getDisplayNameFromUserFields({
		firstName: profile?.firstName ?? currentUser?.firstName,
		lastName: profile?.lastName ?? currentUser?.lastName,
		email: currentUser?.email,
	});

	const handleDialogClose = (shouldClose: boolean) => {
		if (shouldClose) {
			// Reset all state when closing
			setIsEditing(false);
			setEditData({ firstName: '', lastName: '' });
		}
		onOpenChange(shouldClose);
	};

	return (
		<>
			<Dialog open={open} onOpenChange={handleDialogClose}>
				<DialogContent className='max-w-2xl max-h-[90vh] flex flex-col'>
					<DialogHeader className='flex-shrink-0'>
						<DialogTitle>{t(AuthKey.EDIT_PROFILE)}</DialogTitle>
						<DialogDescription>{t(AuthKey.MANAGE_PROFILE_INFO)}</DialogDescription>
					</DialogHeader>

					{isLoading ? (
						<div className='py-8 text-center text-muted-foreground flex-1'>{t(LoadingKey.LOADING_PROFILE)}</div>
					) : (
						<div className='dialog-body'>
							{/* Two Column Layout */}
							<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
								{/* Left Column: Avatar and Name */}
								<div className='flex items-center gap-4'>
									<div className='relative'>
										{(profile ?? currentUser) && (
											<UserAvatar
												size={AvatarSize.XL}
												source={{
													firstName: profile?.firstName ?? currentUser?.firstName,
													lastName: profile?.lastName ?? currentUser?.lastName,
													email: currentUser?.email,
													avatar: currentAvatarId ?? profile?.avatar ?? currentUser?.avatar,
													avatarUrl: profile?.avatarUrl ?? currentUser?.avatarUrl,
												}}
												fallbackLetter={DISPLAY_NAME_FALLBACKS.USER_SHORT}
											/>
										)}
										<Button
											variant={VariantBase.DEFAULT}
											size={ButtonSize.ICON_SM}
											className='absolute -bottom-1 -right-1 !rounded-full flex items-center justify-center'
											onClick={() => setShowAvatarSelector(true)}
										>
											<Pencil className='h-3 w-3' />
										</Button>
									</div>
									<div className='flex flex-col'>
										<h3 className='text-xl font-semibold'>{displayName}</h3>
										<p className='text-sm text-muted-foreground'>{currentUser?.email}</p>
									</div>
								</div>

								{/* Right Column: Buttons */}
								{!isEditing && (
									<div className='flex flex-col gap-3 justify-center items-center md:items-start'>
										<Button variant={VariantBase.DEFAULT} onClick={handleEditStart} className='w-full md:w-auto'>
											<Edit className='h-4 w-4 me-2' />
											{t(AuthKey.EDIT_PROFILE_BUTTON)}
										</Button>
										<Button
											variant={VariantBase.DEFAULT}
											onClick={() => setShowChangePasswordDialog(true)}
											className='w-full md:w-auto'
										>
											<Key className='h-4 w-4 me-2' />
											{t(AuthKey.CHANGE_PASSWORD)}
										</Button>
									</div>
								)}
							</div>

							{/* Profile Information Section */}
							{isEditing && (
								<div className='space-y-4 pt-4 border-t'>
									<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
										<div className='space-y-2'>
											<Label htmlFor='firstName'>{t(AuthKey.FIRST_NAME)}</Label>
											<Input
												id='firstName'
												value={editData.firstName}
												onChange={e => setEditData(prev => ({ ...prev, firstName: e.target.value }))}
												placeholder={t(AuthKey.FIRST_NAME)}
											/>
										</div>
										<div className='space-y-2'>
											<Label htmlFor='lastName'>{t(AuthKey.LAST_NAME)}</Label>
											<Input
												id='lastName'
												value={editData.lastName}
												onChange={e => setEditData(prev => ({ ...prev, lastName: e.target.value }))}
												placeholder={t(AuthKey.LAST_NAME)}
											/>
										</div>
									</div>
									<div className='flex gap-2 pt-2 flex-shrink-0'>
										<Button variant={VariantBase.OUTLINE} onClick={() => setIsEditing(false)}>
											{t(CommonKey.CANCEL)}
										</Button>
										<Button onClick={handleSave} disabled={updateProfile.isPending}>
											{updateProfile.isPending ? t(LoadingKey.SAVING) : t(CommonKey.SAVE)}
										</Button>
									</div>
								</div>
							)}
						</div>
					)}
				</DialogContent>
			</Dialog>

			{/* Avatar Selector */}
			<AvatarSelector
				open={showAvatarSelector}
				onOpenChange={setShowAvatarSelector}
				currentAvatarId={currentAvatarId}
				currentAvatarUrl={profile?.avatarUrl ?? currentUser?.avatarUrl}
			/>

			{/* Change Password Dialog */}
			<ChangePasswordDialog open={showChangePasswordDialog} onOpenChange={setShowChangePasswordDialog} />
		</>
	);
}
