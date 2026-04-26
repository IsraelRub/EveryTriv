import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Key, Pencil } from 'lucide-react';

import { LengthKey } from '@shared/constants';
import { getDisplayNameFromUserFields } from '@shared/utils';
import { validateStringLength } from '@shared/validation';

import {
	AuthKey,
	AvatarSize,
	ButtonSize,
	CommonKey,
	DISPLAY_NAME_FALLBACKS,
	ErrorsKey,
	LoadingKey,
	VariantBase,
} from '@/constants';
import type { ProfileEditDialogProps } from '@/types';
import { getTranslatedErrorMessage, translateValidationMessage } from '@/utils';
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
import { toast, useCurrentUserData, useUpdateUserProfile, useUserProfile } from '@/hooks';

export function ProfileEditDialog({ open, onOpenChange }: ProfileEditDialogProps) {
	const { t } = useTranslation(['auth', 'loading', 'common', 'errors']);
	const [isEditing, setIsEditing] = useState(false);
	const [editData, setEditData] = useState({ firstName: '', lastName: '' });
	const [fieldErrors, setFieldErrors] = useState<{ firstName?: string; lastName?: string }>({});
	const [showAvatarSelector, setShowAvatarSelector] = useState(false);
	const [showChangePasswordDialog, setShowChangePasswordDialog] = useState(false);

	const currentUser = useCurrentUserData();
	const { data: userProfile, isLoading } = useUserProfile();
	const updateProfile = useUpdateUserProfile();

	const profile = userProfile?.profile;
	const avatarUrlForDisplay = profile?.avatarUrl ?? currentUser?.avatarUrl;
	const hasCustomAvatarUrl = avatarUrlForDisplay != null && avatarUrlForDisplay !== '';
	const avatarForDisplay = hasCustomAvatarUrl
		? (profile?.avatar ?? undefined)
		: (profile?.avatar ?? currentUser?.avatar);
	const currentAvatarId = profile?.avatar ?? undefined;

	const handleEditStart = () => {
		setEditData({
			firstName: profile?.firstName ?? '',
			lastName: profile?.lastName ?? '',
		});
		setFieldErrors({});
		setIsEditing(true);
	};

	const handleSave = async () => {
		const firstNameValidation = validateStringLength(editData.firstName, LengthKey.FIRST_NAME);
		const lastNameValidation = validateStringLength(editData.lastName, LengthKey.LAST_NAME);

		if (!firstNameValidation.isValid || !lastNameValidation.isValid) {
			setFieldErrors({
				firstName:
					!firstNameValidation.isValid && firstNameValidation.errors[0]
						? translateValidationMessage(firstNameValidation.errors[0], t)
						: undefined,
				lastName:
					!lastNameValidation.isValid && lastNameValidation.errors[0]
						? translateValidationMessage(lastNameValidation.errors[0], t)
						: undefined,
			});
			return;
		}
		setFieldErrors({});

		try {
			// Always send lastName, even if empty (server will convert empty string to null)
			await updateProfile.mutateAsync({
				firstName: editData.firstName.trim(),
				lastName: editData.lastName.trim(),
			});
			setIsEditing(false);
			onOpenChange(false);
		} catch (error) {
			toast.error({
				title: t(ErrorsKey.SOMETHING_WENT_WRONG),
				description: getTranslatedErrorMessage(t, error),
			});
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
			setFieldErrors({});
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

					{!isLoading ? (
						<div className='dialog-body'>
							{/* Two Column Layout */}
							<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
								{/* Left Column: Avatar and Name */}
								<div className='flex items-center gap-4'>
									<div className='relative'>
										{(profile ?? currentUser) && (
											<UserAvatar
												key={avatarUrlForDisplay ?? 'no-avatar-url'}
												size={AvatarSize.XL}
												source={{
													firstName: profile?.firstName ?? currentUser?.firstName,
													lastName: profile?.lastName ?? currentUser?.lastName,
													email: currentUser?.email,
													avatar: avatarForDisplay,
													avatarUrl: avatarUrlForDisplay,
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
											<Pencil className='h-4 w-4 me-2' />
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
											<Label>{t(AuthKey.FIRST_NAME)}</Label>
											<Input
												id='firstName'
												value={editData.firstName}
												onChange={e => {
													const value = e.target.value;
													setEditData(prev => ({ ...prev, firstName: value }));
													if (fieldErrors.firstName) {
														const res = validateStringLength(value, LengthKey.FIRST_NAME);
														setFieldErrors(prev => ({
															...prev,
															firstName:
																res.isValid || !res.errors[0]
																	? undefined
																	: translateValidationMessage(res.errors[0], t),
														}));
													}
												}}
												placeholder={t(AuthKey.FIRST_NAME)}
												error={!!fieldErrors.firstName}
											/>
											{fieldErrors.firstName && <p className='text-sm text-destructive'>{fieldErrors.firstName}</p>}
										</div>
										<div className='space-y-2'>
											<Label>{t(AuthKey.LAST_NAME)}</Label>
											<Input
												id='lastName'
												value={editData.lastName}
												onChange={e => {
													const value = e.target.value;
													setEditData(prev => ({ ...prev, lastName: value }));
													if (fieldErrors.lastName) {
														const res = validateStringLength(value, LengthKey.LAST_NAME);
														setFieldErrors(prev => ({
															...prev,
															lastName:
																res.isValid || !res.errors[0]
																	? undefined
																	: translateValidationMessage(res.errors[0], t),
														}));
													}
												}}
												placeholder={t(AuthKey.LAST_NAME)}
												error={!!fieldErrors.lastName}
											/>
											{fieldErrors.lastName && <p className='text-sm text-destructive'>{fieldErrors.lastName}</p>}
										</div>
									</div>
									<div className='flex gap-2 pt-2 flex-shrink-0'>
										<Button variant={VariantBase.OUTLINE} onClick={() => setIsEditing(false)}>
											{t(CommonKey.CANCEL)}
										</Button>
										<Button onClick={handleSave} disabled={updateProfile.isPending}>
											{!updateProfile.isPending ? t(CommonKey.SAVE) : t(LoadingKey.SAVING)}
										</Button>
									</div>
								</div>
							)}
						</div>
					) : (
						<div className='py-8 text-center text-muted-foreground flex-1'>{t(LoadingKey.LOADING_PROFILE)}</div>
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
