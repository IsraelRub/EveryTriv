import { ChangeEvent, useMemo, useState } from 'react';

import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Key } from 'lucide-react';

import { ButtonSize, ButtonVariant, ToastVariant } from '@/constants';

import {
	Avatar,
	AvatarFallback,
	AvatarImage,
	AvatarSelector,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Input,
	Label,
	ProfileSkeleton,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from '@/components';

import { useAppSelector, useChangePassword, useToast, useUpdateUserProfile, useUserProfile } from '@/hooks';

import type { PasswordFieldErrors, RootState } from '@/types';

import { getAvatarUrl } from '@/utils';
import { validatePasswordForm, validatePasswordLength, validatePasswordMatch } from '@/utils/validation';

export function UserProfile() {
	const [activeTab, setActiveTab] = useState('profile');
	const [isEditing, setIsEditing] = useState(false);
	const [editData, setEditData] = useState({ firstName: '', lastName: '' });
	const [showPasswordForm, setShowPasswordForm] = useState(false);
	const [passwordData, setPasswordData] = useState({
		currentPassword: '',
		newPassword: '',
		confirmPassword: '',
	});
	const [passwordFieldErrors, setPasswordFieldErrors] = useState<PasswordFieldErrors>({});
	const [showAvatarSelector, setShowAvatarSelector] = useState(false);

	const { currentUser, avatar: reduxAvatar } = useAppSelector((state: RootState) => state.user);
	const { data: userProfile, isLoading: profileLoading } = useUserProfile();
	const updateProfile = useUpdateUserProfile();
	const changePassword = useChangePassword();
	const { toast } = useToast();

	const profile = userProfile?.profile;
	const isLoading = profileLoading;
	// Avatar field stores avatarId as number - prioritize Redux state for immediate updates
	const currentAvatarId = reduxAvatar ?? profile?.avatar ?? undefined;
	// Memoize avatar URL to ensure it updates when avatar changes
	const avatarUrl = useMemo(() => {
		return getAvatarUrl(currentAvatarId);
	}, [currentAvatarId]);

	const handleEditStart = () => {
		setEditData({
			firstName: profile?.firstName || '',
			lastName: profile?.lastName || '',
		});
		setIsEditing(true);
	};

	const handlePasswordFormToggle = () => {
		setShowPasswordForm(!showPasswordForm);
		if (!showPasswordForm) {
			setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
			setPasswordFieldErrors({});
		}
	};

	const validatePasswordField = (name: string, value: string): string | null => {
		if (name === 'currentPassword') {
			if (!value.trim()) return 'Current password is required';
		}
		if (name === 'newPassword') {
			const validation = validatePasswordLength(value);
			if (!validation.isValid) {
				return validation.errors[0] || 'Invalid password';
			}
		}
		if (name === 'confirmPassword') {
			const validation = validatePasswordMatch(passwordData.newPassword, value);
			if (!validation.isValid) {
				return validation.errors[0] || 'Invalid password confirmation';
			}
		}
		return null;
	};

	const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setPasswordData(prev => ({
			...prev,
			[name]: value,
		}));

		const fieldError = validatePasswordField(name, value);
		setPasswordFieldErrors(prev => ({
			...prev,
			[name]: fieldError || undefined,
		}));

		if (name === 'newPassword' && passwordData.confirmPassword) {
			const confirmError = validatePasswordField('confirmPassword', passwordData.confirmPassword);
			setPasswordFieldErrors(prev => ({
				...prev,
				confirmPassword: confirmError || undefined,
			}));
		}
	};

	const isPasswordFormValid = (): boolean => {
		if (!passwordData.currentPassword.trim()) return false;
		const passwordValidation = validatePasswordForm({
			newPassword: passwordData.newPassword,
			confirmPassword: passwordData.confirmPassword,
		});
		return passwordValidation.isValid;
	};

	const handleSave = async () => {
		try {
			await updateProfile.mutateAsync({
				firstName: editData.firstName,
				lastName: editData.lastName,
			});
			setIsEditing(false);
		} catch {
			// Error handled by mutation
		}
	};

	const handlePasswordSave = async () => {
		const currentPasswordError = validatePasswordField('currentPassword', passwordData.currentPassword);
		const newPasswordError = validatePasswordField('newPassword', passwordData.newPassword);
		const confirmPasswordError = validatePasswordField('confirmPassword', passwordData.confirmPassword);

		const newFieldErrors: typeof passwordFieldErrors = {};
		if (currentPasswordError) newFieldErrors.currentPassword = currentPasswordError;
		if (newPasswordError) newFieldErrors.newPassword = newPasswordError;
		if (confirmPasswordError) newFieldErrors.confirmPassword = confirmPasswordError;

		setPasswordFieldErrors(newFieldErrors);

		if (currentPasswordError || newPasswordError || confirmPasswordError) {
			return;
		}

		if (!isPasswordFormValid()) {
			return;
		}

		try {
			await changePassword.mutateAsync({
				currentPassword: passwordData.currentPassword,
				newPassword: passwordData.newPassword,
			});
			setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
			setPasswordFieldErrors({});
			setShowPasswordForm(false);
			toast({
				title: 'Password Changed',
				description: 'Your password has been updated successfully.',
			});
		} catch {
			toast({
				title: 'Error',
				description: 'Failed to change password. Please check your current password.',
				variant: ToastVariant.DESTRUCTIVE,
			});
		}
	};

	const getUserInitials = () => {
		if (profile?.firstName) {
			return profile.firstName.charAt(0).toUpperCase();
		}
		if (currentUser?.email) {
			return currentUser.email.charAt(0).toUpperCase();
		}
		return 'U';
	};

	const getDisplayName = () => {
		if (profile?.firstName && profile?.lastName) {
			return `${profile.firstName} ${profile.lastName}`;
		}
		if (profile?.firstName) {
			return profile.firstName;
		}
		return currentUser?.email?.split('@')[0] || 'User';
	};

	if (isLoading) {
		return (
			<motion.main initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className='min-h-screen py-12 px-4'>
				<div className='max-w-4xl mx-auto'>
					<Card>
						<CardContent className='pt-6 overflow-hidden'>
							<ProfileSkeleton />
						</CardContent>
					</Card>
				</div>
			</motion.main>
		);
	}

	return (
		<motion.main initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className='min-h-screen py-12 px-4'>
			<div className='max-w-4xl mx-auto space-y-8'>
				{/* Profile Header */}
				<Card>
					<CardHeader>
						<div className='flex items-center gap-4 mb-6'>
							<div className='relative'>
								<Avatar className='h-20 w-20'>
									<AvatarImage key={currentAvatarId} src={avatarUrl} alt={getDisplayName()} />
									<AvatarFallback className='text-2xl'>{getUserInitials()}</AvatarFallback>
								</Avatar>
								<Button
									variant={ButtonVariant.OUTLINE}
									size={ButtonSize.SM}
									className='absolute -bottom-1 -right-1 h-6 w-6 rounded-full p-0'
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
							<div>
								<CardTitle className='text-2xl'>{getDisplayName()}</CardTitle>
								<CardDescription>{currentUser?.email}</CardDescription>
							</div>
						</div>

						{/* Tabs */}
						<Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
							<TabsList className='grid w-full grid-cols-2'>
								<TabsTrigger value='profile'>Profile</TabsTrigger>
								<TabsTrigger value='password'>
									<Key className='h-4 w-4 mr-2' />
									Password
								</TabsTrigger>
							</TabsList>

							{/* Profile Tab */}
							<TabsContent value='profile' className='mt-6'>
								{isEditing ? (
									<div className='space-y-4'>
										<div className='flex gap-2'>
											<div className='flex-1'>
												<Label htmlFor='firstName'>First Name</Label>
												<Input
													id='firstName'
													value={editData.firstName}
													onChange={e => setEditData(prev => ({ ...prev, firstName: e.target.value }))}
													placeholder='First name'
												/>
											</div>
											<div className='flex-1'>
												<Label htmlFor='lastName'>Last Name</Label>
												<Input
													id='lastName'
													value={editData.lastName}
													onChange={e => setEditData(prev => ({ ...prev, lastName: e.target.value }))}
													placeholder='Last name'
												/>
											</div>
										</div>
										<div className='flex gap-2'>
											<Button variant={ButtonVariant.OUTLINE} onClick={() => setIsEditing(false)}>
												Cancel
											</Button>
											<Button onClick={handleSave} disabled={updateProfile.isPending}>
												{updateProfile.isPending ? 'Saving...' : 'Save'}
											</Button>
										</div>
									</div>
								) : (
									<div className='flex justify-end'>
										<Button variant={ButtonVariant.OUTLINE} onClick={handleEditStart}>
											Edit Profile
										</Button>
									</div>
								)}
							</TabsContent>

							{/* Password Tab */}
							<TabsContent value='password' className='mt-6'>
								{!showPasswordForm ? (
									<div className='space-y-4'>
										<p className='text-muted-foreground'>Click the button below to change your password.</p>
										<Button onClick={handlePasswordFormToggle} variant={ButtonVariant.OUTLINE}>
											<Key className='h-4 w-4 mr-2' />
											Change Password
										</Button>
									</div>
								) : (
									<div className='space-y-4'>
										<div className='space-y-2'>
											<Label htmlFor='current-password'>Current Password</Label>
											<Input
												id='current-password'
												name='currentPassword'
												type='password'
												value={passwordData.currentPassword}
												onChange={handlePasswordChange}
												className={passwordFieldErrors.currentPassword ? 'border-destructive' : ''}
												placeholder='Enter current password'
											/>
											{passwordFieldErrors.currentPassword && (
												<p className='text-sm text-destructive flex items-center gap-1'>
													<AlertCircle className='h-3 w-3' />
													{passwordFieldErrors.currentPassword}
												</p>
											)}
										</div>
										<div className='space-y-2'>
											<Label htmlFor='new-password'>New Password</Label>
											<Input
												id='new-password'
												name='newPassword'
												type='password'
												value={passwordData.newPassword}
												onChange={handlePasswordChange}
												className={passwordFieldErrors.newPassword ? 'border-destructive' : ''}
												placeholder='Enter new password'
											/>
											{passwordFieldErrors.newPassword && (
												<p className='text-sm text-destructive flex items-center gap-1'>
													<AlertCircle className='h-3 w-3' />
													{passwordFieldErrors.newPassword}
												</p>
											)}
										</div>
										<div className='space-y-2'>
											<Label htmlFor='confirm-password'>Confirm New Password</Label>
											<div className='relative'>
												<Input
													id='confirm-password'
													name='confirmPassword'
													type='password'
													value={passwordData.confirmPassword}
													onChange={handlePasswordChange}
													className={passwordFieldErrors.confirmPassword ? 'border-destructive' : ''}
													placeholder='Confirm new password'
												/>
												{passwordData.confirmPassword &&
													passwordData.newPassword === passwordData.confirmPassword &&
													!passwordFieldErrors.confirmPassword && (
														<CheckCircle2 className='absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500' />
													)}
											</div>
											{passwordFieldErrors.confirmPassword && (
												<p className='text-sm text-destructive flex items-center gap-1'>
													<AlertCircle className='h-3 w-3' />
													{passwordFieldErrors.confirmPassword}
												</p>
											)}
										</div>
										<div className='flex gap-2'>
											<Button variant={ButtonVariant.OUTLINE} onClick={handlePasswordFormToggle}>
												Cancel
											</Button>
											<Button onClick={handlePasswordSave} disabled={changePassword.isPending}>
												{changePassword.isPending ? 'Changing...' : 'Change Password'}
											</Button>
										</div>
									</div>
								)}
							</TabsContent>
						</Tabs>
					</CardHeader>
				</Card>
			</div>

			{/* Avatar Selector */}
			<AvatarSelector
				open={showAvatarSelector}
				onOpenChange={setShowAvatarSelector}
				currentAvatarId={currentAvatarId ?? undefined}
			/>
		</motion.main>
	);
}
