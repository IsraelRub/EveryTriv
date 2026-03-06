import { useState } from 'react';
import { Edit, Key, Pencil } from 'lucide-react';

import { validateName } from '@shared/validation';

import { AvatarSize, ButtonSize, DISPLAY_NAME_FALLBACKS, LoadingMessages, VariantBase } from '@/constants';
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
import type { ProfileEditDialogProps } from '@/types';
import { getDisplayNameFromUser } from '@/utils';

export function ProfileEditDialog({ open, onOpenChange }: ProfileEditDialogProps) {
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
		// Validate before saving
		const firstNameValidation = validateName(editData.firstName, { fieldName: 'First name', required: true });
		const lastNameValidation = validateName(editData.lastName, { fieldName: 'Last name', required: false });

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

	const displayName =
		(getDisplayNameFromUser({
			firstName: profile?.firstName ?? currentUser?.firstName,
			lastName: profile?.lastName ?? currentUser?.lastName,
			email: currentUser?.email,
		}) ||
			currentUser?.email?.split('@')[0]) ??
		DISPLAY_NAME_FALLBACKS.USER;

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
						<DialogTitle>Edit Profile</DialogTitle>
						<DialogDescription>Manage your profile information</DialogDescription>
					</DialogHeader>

					{isLoading ? (
						<div className='py-8 text-center text-muted-foreground flex-1'>{LoadingMessages.LOADING_PROFILE}</div>
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
												fallbackClassName='text-2xl'
												user={{
													firstName: profile?.firstName ?? currentUser?.firstName,
													lastName: profile?.lastName ?? currentUser?.lastName,
													email: currentUser?.email,
													avatar: currentAvatarId ?? profile?.avatar ?? currentUser?.avatar,
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
											<Edit className='h-4 w-4 mr-2' />
											Edit Profile
										</Button>
										<Button
											variant={VariantBase.DEFAULT}
											onClick={() => setShowChangePasswordDialog(true)}
											className='w-full md:w-auto'
										>
											<Key className='h-4 w-4 mr-2' />
											Change Password
										</Button>
									</div>
								)}
							</div>

							{/* Profile Information Section */}
							{isEditing && (
								<div className='space-y-4 pt-4 border-t'>
									<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
										<div className='space-y-2'>
											<Label htmlFor='firstName'>First Name</Label>
											<Input
												id='firstName'
												value={editData.firstName}
												onChange={e => setEditData(prev => ({ ...prev, firstName: e.target.value }))}
												placeholder='First name'
											/>
										</div>
										<div className='space-y-2'>
											<Label htmlFor='lastName'>Last Name</Label>
											<Input
												id='lastName'
												value={editData.lastName}
												onChange={e => setEditData(prev => ({ ...prev, lastName: e.target.value }))}
												placeholder='Last name'
											/>
										</div>
									</div>
									<div className='flex gap-2 pt-2 flex-shrink-0'>
										<Button variant={VariantBase.OUTLINE} onClick={() => setIsEditing(false)}>
											Cancel
										</Button>
										<Button onClick={handleSave} disabled={updateProfile.isPending}>
											{updateProfile.isPending ? LoadingMessages.SAVING : 'Save'}
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
			/>

			{/* Change Password Dialog */}
			<ChangePasswordDialog open={showChangePasswordDialog} onOpenChange={setShowChangePasswordDialog} />
		</>
	);
}
