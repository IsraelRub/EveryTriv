/**
 * Settings View
 *
 * @module SettingsView
 * @description User settings and preferences management
 */

import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { motion } from 'framer-motion';

import { DEFAULT_USER_PREFERENCES, DifficultyLevel, VALID_DIFFICULTIES } from '@shared/constants';
import { clientLogger as logger } from '@shared/services';
import type { UpdateUserProfileData, UserPreferences } from '@shared/types';
import { getErrorMessage } from '@shared/utils';

import { AlertModal, Button, Card, Container, Icon, fadeInUp, GridLayout, scaleIn } from '../../components';
import { AlertVariant, AudioKey, ButtonVariant, CardVariant, ComponentSize, ContainerSize, Spacing } from '../../constants';
import { useChangePassword, useDeleteUserAccount, useUpdateUserProfile } from '../../hooks';
import { audioService } from '../../services';
import type { RootState } from '../../types';

export default function SettingsView() {
	const navigate = useNavigate();
	const { currentUser } = useSelector((state: RootState) => state.user);
	const [showPasswordModal, setShowPasswordModal] = useState(false);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [alertModal, setAlertModal] = useState<{
		open: boolean;
		title: string;
		message: string;
		variant: AlertVariant;
	}>({
		open: false,
		title: '',
		message: '',
		variant: AlertVariant.INFO,
	});
	const { mutate: updateProfile } = useUpdateUserProfile();
	const { mutate: deleteAccount, isPending: isDeleting } = useDeleteUserAccount();
	const { mutate: changePassword, isPending: isChangingPassword } = useChangePassword();

	const [settings, setSettings] = useState<Partial<UserPreferences>>({
		emailNotifications: DEFAULT_USER_PREFERENCES.emailNotifications,
		pushNotifications: DEFAULT_USER_PREFERENCES.pushNotifications,
		soundEnabled: DEFAULT_USER_PREFERENCES.soundEnabled,
		game: {
			defaultDifficulty: DEFAULT_USER_PREFERENCES.game.defaultDifficulty,
		},
	});

	const [saving, setSaving] = useState(false);

	type BooleanPreferenceKey = 'emailNotifications' | 'pushNotifications' | 'soundEnabled';

	type ToggleAction =
		| {
				key: BooleanPreferenceKey;
				value: boolean;
		  }
		| {
				key: 'defaultDifficulty';
				value: DifficultyLevel;
		  };

	const isDifficultyLevel = (value: string): value is DifficultyLevel =>
		VALID_DIFFICULTIES.some(difficulty => difficulty === value);

	const handleToggle = (action: ToggleAction) => {
		if (action.key === 'defaultDifficulty') {
			setSettings(prev => ({
				...prev,
				game: {
					...prev.game,
					defaultDifficulty: action.value,
				},
			}));
			return;
		}

			setSettings(prev => ({
				...prev,
			[action.key]: action.value,
			}));
	};

	const handleDifficultyChange = (value: string) => {
		if (!isDifficultyLevel(value)) {
			logger.validationWarn('defaultDifficulty', value, 'must be a valid difficulty option');
			return;
		}

		handleToggle({ key: 'defaultDifficulty', value });
	};

	const handleSave = () => {
		setSaving(true);
		audioService.play(AudioKey.BUTTON_CLICK);

		// Save to server via profile update
		const profileData: UpdateUserProfileData = {
			preferences: {
				emailNotifications: settings.emailNotifications,
				pushNotifications: settings.pushNotifications,
				soundEnabled: settings.soundEnabled,
				game: settings.game,
			},
		};
		updateProfile(profileData, {
			onSuccess: () => {
				audioService.play(AudioKey.SUCCESS);
				logger.gameInfo('Settings saved successfully');
				setAlertModal({
					open: true,
					title: 'Success',
					message: 'Settings saved successfully!',
					variant: AlertVariant.SUCCESS,
				});
				setSaving(false);
			},
			onError: (error: unknown) => {
				audioService.play(AudioKey.ERROR);
				logger.gameError('Failed to save settings', { error: getErrorMessage(error) });
				setAlertModal({
					open: true,
					title: 'Error',
					message: 'Failed to save settings. Please try again.',
					variant: AlertVariant.ERROR,
				});
				setSaving(false);
			},
		});
	};

	return (
		<main role='main' aria-label='Settings'>
			<Container size={ContainerSize.XL} className='min-h-screen py-8'>
				{/* Header */}
				<motion.header variants={fadeInUp} initial='hidden' animate='visible' className='text-center mb-12'>
					<h1 className='text-5xl font-bold text-white mb-4 gradient-text'>Settings</h1>
					<p className='text-xl text-slate-300'>Customize your trivia experience</p>
				</motion.header>

				{/* Settings Sections */}
				<GridLayout variant='balanced' gap={Spacing.LG}>
					{/* Notifications */}
					<motion.section
						variants={scaleIn}
						initial='hidden'
						animate='visible'
						transition={{ delay: 0.2 }}
						aria-label='Notification Settings'
					>
						<Card variant={CardVariant.GLASS} padding={Spacing.LG} className='rounded-lg h-full'>
							<h2 className='text-2xl font-bold text-white mb-6'>Notifications</h2>

							<div className='space-y-4'>
								<label className='flex items-center justify-between cursor-pointer'>
									<span className='text-white'>Email notifications</span>
									<input
										type='checkbox'
										checked={settings.emailNotifications}
										onChange={e => handleToggle({ key: 'emailNotifications', value: e.target.checked })}
										className='w-12 h-6 bg-slate-700 rounded-full relative appearance-none cursor-pointer checked:bg-blue-500 transition-colors'
									/>
								</label>

								<label className='flex items-center justify-between cursor-pointer'>
									<span className='text-white'>Push notifications</span>
									<input
										type='checkbox'
										checked={settings.pushNotifications}
										onChange={e => handleToggle({ key: 'pushNotifications', value: e.target.checked })}
										className='w-12 h-6 bg-slate-700 rounded-full relative appearance-none cursor-pointer checked:bg-blue-500 transition-colors'
									/>
								</label>
							</div>
						</Card>
					</motion.section>

					{/* Game Settings */}
					<motion.section
						variants={scaleIn}
						initial='hidden'
						animate='visible'
						transition={{ delay: 0.3 }}
						aria-label='Game Settings'
					>
						<Card variant={CardVariant.GLASS} padding={Spacing.LG} className='rounded-lg h-full'>
							<h2 className='text-2xl font-bold text-white mb-6'>Game</h2>

							<div className='space-y-4'>
								<div>
									<label className='block text-white mb-2'>Default difficulty</label>
									<select
										value={settings.game?.defaultDifficulty ?? DEFAULT_USER_PREFERENCES.game.defaultDifficulty}
										onChange={e => handleDifficultyChange(e.target.value)}
										className='w-full p-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
									>
										<option value='easy'>Easy</option>
										<option value='medium'>Medium</option>
										<option value='hard'>Hard</option>
									</select>
								</div>

								<label className='flex items-center justify-between cursor-pointer'>
									<span className='text-white'>Enable sounds</span>
									<input
										type='checkbox'
										checked={settings.soundEnabled}
										onChange={e => handleToggle({ key: 'soundEnabled', value: e.target.checked })}
										className='w-12 h-6 bg-slate-700 rounded-full relative appearance-none cursor-pointer checked:bg-blue-500 transition-colors'
									/>
								</label>
							</div>
						</Card>
					</motion.section>
				</GridLayout>

				{/* Save Button */}
				<motion.div
					variants={fadeInUp}
					initial='hidden'
					animate='visible'
					transition={{ delay: 0.6 }}
					className='mt-8 max-w-2xl mx-auto'
				>
					<Button
						onClick={handleSave}
						disabled={saving}
						variant={ButtonVariant.PRIMARY}
						className='w-full py-4 text-lg bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600'
					>
						{saving ? 'Saving...' : 'Save Settings'}
					</Button>
				</motion.div>

				{/* Account Section */}
				<motion.section
					variants={fadeInUp}
					initial='hidden'
					animate='visible'
					transition={{ delay: 0.8 }}
					className='mt-12'
					aria-label='Account Management'
				>
					<Card variant={CardVariant.GLASS} padding={Spacing.LG} className='rounded-lg max-w-2xl mx-auto'>
						<h2 className='text-2xl font-bold text-white mb-6'>Account</h2>

						<div className='space-y-4'>
							<div className='flex justify-between items-center'>
								<span className='text-slate-300'>Email</span>
								<span className='text-white'>{currentUser?.email || 'Not set'}</span>
							</div>

							<div className='flex justify-between items-center'>
								<span className='text-slate-300'>Username</span>
								<span className='text-white'>{currentUser?.username || 'Not set'}</span>
							</div>

							<hr className='border-slate-700' />

							<button
								onClick={() => {
									audioService.play(AudioKey.BUTTON_CLICK);
									setShowPasswordModal(true);
								}}
								className='text-blue-400 hover:text-blue-300 transition-colors'
							>
								Change Password
							</button>

							<button
								onClick={() => {
									audioService.play(AudioKey.BUTTON_CLICK);
									setShowDeleteModal(true);
								}}
								className='text-red-400 hover:text-red-300 transition-colors'
							>
								Delete Account
							</button>
						</div>
					</Card>
				</motion.section>
			</Container>

			{/* Change Password Modal */}
			{showPasswordModal && (
				<div className='fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4'>
					<motion.div
						initial={{ scale: 0.9, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						className='bg-slate-800 rounded-lg p-8 max-w-md w-full'
					>
						<h3 className='text-2xl font-bold text-white mb-4'>Change Password</h3>
						<form
							onSubmit={e => {
								e.preventDefault();
								const formData = new FormData(e.currentTarget);
								const currentPasswordValue = formData.get('currentPassword');
								const newPasswordValue = formData.get('newPassword');
								const confirmPasswordValue = formData.get('confirmPassword');

								if (!currentPasswordValue || typeof currentPasswordValue !== 'string') {
									return;
								}
								if (!newPasswordValue || typeof newPasswordValue !== 'string') {
									return;
								}
								if (!confirmPasswordValue || typeof confirmPasswordValue !== 'string') {
									return;
								}

								const currentPassword = currentPasswordValue;
								const newPassword = newPasswordValue;
								const confirmPassword = confirmPasswordValue;

								if (newPassword !== confirmPassword) {
									setAlertModal({
										open: true,
										title: 'Password Mismatch',
										message: 'New passwords do not match',
										variant: AlertVariant.ERROR,
									});
									return;
								}

								if (newPassword.length < 6) {
									setAlertModal({
										open: true,
										title: 'Password Too Short',
										message: 'New password must be at least 6 characters long',
										variant: AlertVariant.ERROR,
									});
									return;
								}

								changePassword(
									{ currentPassword, newPassword },
									{
										onSuccess: () => {
											logger.userInfo('Password changed successfully');
											audioService.play(AudioKey.SUCCESS);
											setAlertModal({
												open: true,
												title: 'Success',
												message: 'Password changed successfully!',
												variant: AlertVariant.SUCCESS,
											});
											setShowPasswordModal(false);
										},
										onError: error => {
											logger.userError('Failed to change password', { error: getErrorMessage(error) });
											audioService.play(AudioKey.ERROR);
											setAlertModal({
												open: true,
												title: 'Error',
												message: `Failed to change password: ${getErrorMessage(error)}`,
												variant: AlertVariant.ERROR,
											});
										},
									}
								);
							}}
						>
							<div className='space-y-4 mb-6'>
								<div>
									<label className='block text-sm font-medium text-slate-300 mb-2'>Current Password</label>
									<input
										type='password'
										name='currentPassword'
										required
										className='w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none'
										placeholder='Enter current password'
									/>
								</div>
								<div>
									<label className='block text-sm font-medium text-slate-300 mb-2'>New Password</label>
									<input
										type='password'
										name='newPassword'
										required
										minLength={6}
										className='w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none'
										placeholder='Enter new password (min 6 characters)'
									/>
								</div>
								<div>
									<label className='block text-sm font-medium text-slate-300 mb-2'>Confirm New Password</label>
									<input
										type='password'
										name='confirmPassword'
										required
										minLength={6}
										className='w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none'
										placeholder='Confirm new password'
									/>
								</div>
							</div>
							<div className='flex gap-4'>
								<button
									type='button'
									onClick={() => {
										audioService.play(AudioKey.BUTTON_CLICK);
										setShowPasswordModal(false);
										logger.userInfo('Password change cancelled');
									}}
									className='flex-1 px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors'
								>
									Cancel
								</button>
								<button
									type='submit'
									disabled={isChangingPassword}
									className='flex-1 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
								>
									{isChangingPassword ? 'Changing...' : 'Change Password'}
								</button>
							</div>
						</form>
					</motion.div>
				</div>
			)}

			{/* Delete Account Modal */}
			{showDeleteModal && (
				<div className='fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4'>
					<motion.div
						initial={{ scale: 0.9, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						className='bg-slate-800 rounded-lg p-8 max-w-md w-full border-2 border-red-500'
					>
						<h3 className='text-2xl font-bold text-red-400 mb-4 flex items-center gap-2'>
							<Icon name='warning' size={ComponentSize.LG} className='text-red-400' />
							Delete Account
						</h3>
						<p className='text-white font-semibold mb-2'>This action cannot be undone!</p>
						<p className='text-slate-300 mb-6'>
							Deleting your account will permanently remove all your data, including:
						</p>
						<ul className='text-slate-400 text-sm mb-6 space-y-2 list-disc list-inside'>
							<li>Game history and statistics</li>
							<li>Points and purchases</li>
							<li>Profile information</li>
							<li>All settings and preferences</li>
						</ul>
						<div className='flex gap-4'>
							<button
								onClick={() => {
									audioService.play(AudioKey.BUTTON_CLICK);
									setShowDeleteModal(false);
									logger.userInfo('Account deletion cancelled');
								}}
								className='flex-1 px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors'
							>
								Cancel
							</button>
							<button
								onClick={() => {
									audioService.play(AudioKey.ERROR);
									if (confirm('Are you absolutely sure? Type DELETE to confirm this action cannot be undone.')) {
										deleteAccount(undefined, {
											onSuccess: () => {
												logger.userWarn('Account deleted successfully');
												audioService.play(AudioKey.SUCCESS);
												setShowDeleteModal(false);
												navigate('/login');
											},
											onError: error => {
												logger.userError('Failed to delete account', { error: getErrorMessage(error) });
												audioService.play(AudioKey.ERROR);
												setAlertModal({
													open: true,
													title: 'Error',
													message: `Failed to delete account: ${getErrorMessage(error)}`,
													variant: AlertVariant.ERROR,
												});
											},
										});
									}
								}}
								disabled={isDeleting}
								className='flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
							>
								{isDeleting ? 'Deleting...' : 'Delete Forever'}
							</button>
						</div>
					</motion.div>
				</div>
			)}

			{/* Alert Modal */}
			<AlertModal
				open={alertModal.open}
				onClose={() => setAlertModal(prev => ({ ...prev, open: false }))}
				title={alertModal.title}
				message={alertModal.message}
				variant={alertModal.variant}
			/>
		</main>
	);
}
