import { useMemo, useState } from 'react';
import { Edit, Key } from 'lucide-react';

import { validateFirstName, validateLastName } from '@shared/validation';

import { ButtonVariant } from '@/constants';
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
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
} from '@/components';
import { useCurrentUserData, useUpdateUserProfile, useUserProfile } from '@/hooks';
import type { ProfileEditDialogProps } from '@/types';
import { getAvatarUrl, getUserInitials } from '@/utils';

export function ProfileEditDialog({ open, onOpenChange }: ProfileEditDialogProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [editData, setEditData] = useState({ firstName: '', lastName: '' });
	const [showAvatarSelector, setShowAvatarSelector] = useState(false);
	const [showChangePasswordDialog, setShowChangePasswordDialog] = useState(false);

	const currentUser = useCurrentUserData();
	const { data: userProfile, isLoading } = useUserProfile();
	const updateProfile = useUpdateUserProfile();

	const profile = userProfile?.profile;
	// Avatar field stores avatarId as number - get from profile
	const currentAvatarId = profile?.avatar ?? undefined;
	// Memoize avatar URL to ensure it updates when avatar changes
	const avatarUrl = useMemo(() => {
		return getAvatarUrl(currentAvatarId);
	}, [currentAvatarId]);

	const handleEditStart = () => {
		setEditData({
			firstName: profile?.firstName ?? '',
			lastName: profile?.lastName ?? '',
		});
		setIsEditing(true);
	};

	const handleSave = async () => {
		// Validate before saving
		const firstNameValidation = validateFirstName(editData.firstName);
		const lastNameValidation = validateLastName(editData.lastName, false);

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

	const getDisplayName = () => {
		if (profile?.firstName && profile?.lastName) {
			return `${profile.firstName} ${profile.lastName}`;
		}
		if (profile?.firstName) {
			return profile.firstName;
		}
		return currentUser?.email?.split('@')[0] ?? 'User';
	};

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
				<DialogContent className='max-w-2xl max-h-[90vh]'>
					<DialogHeader>
						<DialogTitle>Edit Profile</DialogTitle>
						<DialogDescription>Manage your profile information</DialogDescription>
					</DialogHeader>

					{isLoading ? (
						<div className='py-8 text-center text-muted-foreground'>Loading profile...</div>
					) : (
						<div className='space-y-6 py-4'>
							{/* Two Column Layout */}
							<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
								{/* Left Column: Avatar and Name */}
								<div className='flex items-center gap-4'>
									<div className='relative'>
										<Avatar className='h-20 w-20'>
											<AvatarImage key={currentAvatarId} src={avatarUrl} />
											<AvatarFallback className='text-2xl'>
												{getUserInitials(profile?.firstName, profile?.lastName, currentUser?.email)}
											</AvatarFallback>
										</Avatar>
										<Button
											variant={ButtonVariant.DEFAULT}
											className='absolute -bottom-1 -right-1 h-6 w-6 !rounded-full !p-0 !aspect-square flex items-center justify-center'
											onClick={() => setShowAvatarSelector(true)}
										>
											<svg className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
												<path
													strokeLinecap='round'
													strokeLinejoin='round'
													strokeWidth={2}
													d='M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z'
												/>
											</svg>
										</Button>
									</div>
									<div className='flex flex-col'>
										<h3 className='text-xl font-semibold'>{getDisplayName()}</h3>
										<p className='text-sm text-muted-foreground'>{currentUser?.email}</p>
									</div>
								</div>

								{/* Right Column: Buttons */}
								{!isEditing && (
									<div className='flex flex-col gap-3 justify-center items-center md:items-start'>
										<Button variant={ButtonVariant.DEFAULT} onClick={handleEditStart} className='w-full md:w-auto'>
											<Edit className='h-4 w-4 mr-2' />
											Edit Profile
										</Button>
										<Button
											variant={ButtonVariant.DEFAULT}
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
									<div className='flex gap-2 pt-2'>
										<Button variant={ButtonVariant.OUTLINE} onClick={() => setIsEditing(false)}>
											Cancel
										</Button>
										<Button onClick={handleSave} disabled={updateProfile.isPending}>
											{updateProfile.isPending ? 'Saving...' : 'Save'}
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
				currentAvatarId={currentAvatarId ?? undefined}
			/>

			{/* Change Password Dialog */}
			<ChangePasswordDialog open={showChangePasswordDialog} onOpenChange={setShowChangePasswordDialog} />
		</>
	);
}
