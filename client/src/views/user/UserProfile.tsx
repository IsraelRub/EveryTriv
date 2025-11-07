// import { DifficultyLevel } from '@shared/constants';
import { MouseEvent, useEffect, useState } from 'react';

import { motion } from 'framer-motion';

import { DEFAULT_USER_PREFERENCES } from '@shared/constants';
import { clientLogger as logger } from '@shared/services';
import { getErrorMessage, mergeUserPreferences } from '@shared/utils';

import {
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	ConfirmModal,
	Container,
	fadeInDown,
	fadeInUp,
	GridLayout,
} from '../../components';
import { AlertVariant, ButtonVariant, CardVariant, ComponentSize, ContainerSize, Spacing } from '../../constants';
import {
	useAppDispatch,
	useAppSelector,
	useDeleteUserAccount,
	useUpdateSinglePreference,
	useUpdateUserField,
	useUpdateUserPreferences,
	useUpdateUserProfile,
	useUserProfile,
	useUserStats,
} from '../../hooks';
import { setAvatar, setUsername } from '../../redux/slices';
import { audioService } from '../../services';
import type { RootState } from '../../types';
import { formatNumber, getCurrentTimestamp } from '../../utils';

export default function UserProfile() {
	const username = useAppSelector((state: RootState) => state.user.username);
	const avatar = useAppSelector((state: RootState) => state.user.avatar);
	const dispatch = useAppDispatch();

	const [loading, setLoading] = useState(false);
	const [stats, setStats] = useState({
		totalGames: 0,
		totalScore: 0,
		averageScore: 0,
		bestStreak: 0,
	});
	const [email, setEmail] = useState('');
	const [bio, setBio] = useState('');
	const [location, setLocation] = useState('');
	const [preferences, setPreferences] = useState({
		soundEnabled: DEFAULT_USER_PREFERENCES.soundEnabled,
		musicEnabled: DEFAULT_USER_PREFERENCES.musicEnabled,
		animationsEnabled: DEFAULT_USER_PREFERENCES.animationsEnabled,
	});
	const [saving, setSaving] = useState(false);
	const [confirmModal, setConfirmModal] = useState<{
		open: boolean;
		onConfirm: () => void;
	}>({
		open: false,
		onConfirm: () => {},
	});

	// Use custom hooks for user profile
	const { data: userProfile } = useUserProfile();
	const updateProfileMutation = useUpdateUserProfile();

	// Use preferences hooks
	const updatePreferencesMutation = useUpdateUserPreferences();

	// Use account management hooks
	const deleteAccountMutation = useDeleteUserAccount();
	const updateUserField = useUpdateUserField();
	const updateSinglePreference = useUpdateSinglePreference();

	// Use user stats hook
	const { data: userStats } = useUserStats();

	useEffect(() => {
		// Update Redux state when profile data is loaded
		if (userProfile) {
			const profile = userProfile.profile;
			dispatch(setUsername(profile.username ?? ''));
			dispatch(setAvatar(profile.avatar ?? ''));
			setEmail(profile.email ?? '');
			setBio(profile.bio ?? '');
			setLocation('');

			// Set preferences from response
			if (userProfile.preferences) {
				const merged = mergeUserPreferences(null, userProfile.preferences);
				setPreferences({
					soundEnabled: merged.soundEnabled,
					musicEnabled: merged.musicEnabled,
					animationsEnabled: merged.animationsEnabled,
				});
			} else {
				setPreferences({
					soundEnabled: DEFAULT_USER_PREFERENCES.soundEnabled,
					musicEnabled: DEFAULT_USER_PREFERENCES.musicEnabled,
					animationsEnabled: DEFAULT_USER_PREFERENCES.animationsEnabled,
				});
			}
		}
	}, [userProfile, dispatch]);

	// Update stats when userStats data changes
	useEffect(() => {
		if (userStats) {
			setStats({
				totalGames: userStats.gamesPlayed ?? 0,
				totalScore: userStats.correctAnswers ?? 0,
				averageScore: userStats.averageScore ?? 0,
				bestStreak: 0,
			});
			logger.userInfo('User statistics updated from hook', {
				userId: userProfile?.profile?.id,
				totalGames: userStats.gamesPlayed,
				totalScore: userStats.correctAnswers,
				averageScore: userStats.averageScore,
				bestStreak: 0,
			});
		}
	}, [userStats, userProfile?.profile?.id]);

	const handleSavePreferences = async () => {
		setSaving(true);
		try {
			// Use preferences hook
			updatePreferencesMutation.mutate({
				animationsEnabled: preferences.animationsEnabled,
			});
			logger.userInfo('User preferences updated successfully', {
				userId: userProfile?.profile?.id,
				preferences: preferences,
			});
		} catch (err) {
			logger.userWarn('Failed to update user preferences', {
				error: getErrorMessage(err),
			});
			// Handle error silently - mutation hook will show user feedback
		} finally {
			setSaving(false);
		}
	};

	const handleSave = async (e?: MouseEvent<HTMLButtonElement>) => {
		e?.preventDefault();
		setLoading(true);
		try {
			updateProfileMutation.mutate({
				username,
				avatar,
				bio: bio,
			});
			logger.userInfo('User profile updated successfully', {
				userId: userProfile?.profile?.id,
				username: username,
				avatar: avatar,
				email: email,
				bio: bio,
				location: location,
			});
		} catch (err) {
			logger.userWarn('Failed to update user profile', {
				error: getErrorMessage(err),
				username,
			});
			// Handle error silently - mutation hook will show user feedback
		} finally {
			setLoading(false);
		}
	};

	const handleDeleteAccount = async () => {
		setConfirmModal({
			open: true,
			onConfirm: async () => {
				try {
					await deleteAccountMutation.mutateAsync();
					// Redirect to home page after successful deletion
					window.location.href = '/';
				} catch (error) {
					logger.userError('Failed to delete account', { error: getErrorMessage(error) });
				}
				setConfirmModal(prev => ({ ...prev, open: false }));
			},
		});
	};

	return (
		<main role='main' aria-label='User Profile'>
			<Container size={ContainerSize.XL} className='min-h-screen flex flex-col items-center justify-start p-4 pt-12'>
				<Card variant={CardVariant.TRANSPARENT} padding={Spacing.XL} className='w-full space-y-8'>
					{/* Header */}
					<motion.header
						variants={fadeInDown}
						initial='hidden'
						animate='visible'
						transition={{ delay: 0.2 }}
						className='text-center mb-12'
					>
						<h1 className='text-4xl md:text-5xl font-bold text-white mb-4 gradient-text'>User Profile</h1>
						<p className='text-xl text-slate-300'>Manage your account and preferences</p>
					</motion.header>

					{/* Profile Information */}
					<motion.section
						variants={fadeInUp}
						initial='hidden'
						animate='visible'
						transition={{ delay: 0.4 }}
						whileHover={{ scale: 1.02 }}
						className='w-full'
						aria-label='Profile Information'
					>
						<Card variant={CardVariant.GLASS}>
							<CardHeader>
								<CardTitle className='text-2xl font-bold text-white'>Profile Information</CardTitle>
							</CardHeader>
							<CardContent>
								<GridLayout variant='balanced' gap={Spacing.LG}>
									<div>
										<label className='block text-white font-medium mb-2'>Display Name</label>
										<div className='flex gap-2'>
											<input
												type='text'
												value={username}
												onChange={e => dispatch(setUsername(e.target.value))}
												className='flex-1 p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500'
												placeholder='Enter your display name'
											/>
											<Button
												variant={ButtonVariant.SECONDARY}
												size={ComponentSize.SM}
												onClick={() => updateUserField.mutate({ field: 'username', value: username })}
												disabled={updateUserField.isPending}
												className='px-4'
											>
												{updateUserField.isPending ? '...' : 'Save'}
											</Button>
										</div>
									</div>
									<div>
										<label className='block text-white font-medium mb-2'>Email</label>
										<div className='flex gap-2'>
											<input
												type='email'
												value={email}
												onChange={e => setEmail(e.target.value)}
												className='flex-1 p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500'
												placeholder='Enter your email'
											/>
											<Button
												variant={ButtonVariant.SECONDARY}
												size={ComponentSize.SM}
												onClick={() => updateUserField.mutate({ field: 'email', value: email })}
												disabled={updateUserField.isPending}
												className='px-4'
											>
												{updateUserField.isPending ? '...' : 'Save'}
											</Button>
										</div>
									</div>
									<div>
										<label className='block text-white font-medium mb-2'>Bio</label>
										<div className='flex gap-2'>
											<textarea
												value={bio}
												onChange={e => setBio(e.target.value)}
												className='flex-1 p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500'
												placeholder='Tell us about yourself'
												rows={3}
											/>
											<Button
												variant={ButtonVariant.SECONDARY}
												size={ComponentSize.SM}
												onClick={() => updateUserField.mutate({ field: 'bio', value: bio })}
												disabled={updateUserField.isPending}
												className='px-4 self-start'
											>
												{updateUserField.isPending ? '...' : 'Save'}
											</Button>
										</div>
									</div>
									<div>
										<label className='block text-white font-medium mb-2'>Location</label>
										<div className='flex gap-2'>
											<input
												type='text'
												value={location}
												onChange={e => setLocation(e.target.value)}
												className='flex-1 p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500'
												placeholder='Enter your location'
											/>
											<Button
												variant={ButtonVariant.SECONDARY}
												size={ComponentSize.SM}
												onClick={() => updateUserField.mutate({ field: 'location', value: location })}
												disabled={updateUserField.isPending}
												className='px-4'
											>
												{updateUserField.isPending ? '...' : 'Save'}
											</Button>
										</div>
									</div>
								</GridLayout>

								<div className='mt-6 text-center'>
									<Button
										variant={ButtonVariant.PRIMARY}
										onClick={handleSave}
										disabled={loading}
										className='px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600'
									>
										{loading ? 'Saving...' : 'Save Profile'}
									</Button>
								</div>
							</CardContent>
						</Card>
					</motion.section>

					{/* Statistics */}
					<motion.section
						variants={fadeInUp}
						initial='hidden'
						animate='visible'
						transition={{ delay: 0.6 }}
						aria-label='User Statistics'
						whileHover={{ scale: 1.02 }}
						className='w-full'
					>
						<Card variant={CardVariant.GLASS}>
							<CardHeader>
								<CardTitle className='text-2xl font-bold text-white'>Your Statistics</CardTitle>
							</CardHeader>
							<CardContent>
								<GridLayout variant='stats' gap={Spacing.LG}>
									<Card variant={CardVariant.GLASS} padding={Spacing.SM} className='text-center border border-white/10'>
										<CardContent>
											<div className='text-3xl font-bold text-white mb-2'>{stats.totalGames}</div>
											<div className='text-slate-300'>Total Games</div>
										</CardContent>
									</Card>
									<Card variant={CardVariant.GLASS} padding={Spacing.SM} className='text-center border border-white/10'>
										<CardContent>
											<div className='text-3xl font-bold text-green-400 mb-2'>{formatNumber(stats.totalScore)}</div>
											<div className='text-slate-300'>Total Score</div>
										</CardContent>
									</Card>
									<Card variant={CardVariant.GLASS} padding={Spacing.SM} className='text-center border border-white/10'>
										<CardContent>
											<div className='text-3xl font-bold text-blue-400 mb-2'>{formatNumber(stats.averageScore)}</div>
											<div className='text-slate-300'>Average Score</div>
										</CardContent>
									</Card>
									<Card variant={CardVariant.GLASS} padding={Spacing.SM} className='text-center border border-white/10'>
										<CardContent>
											<div className='text-3xl font-bold text-yellow-400 mb-2'>{stats.bestStreak}</div>
											<div className='text-slate-300'>Best Streak</div>
										</CardContent>
									</Card>
								</GridLayout>

								{/* Last Updated Info */}
								<div className='mt-4 text-center'>
									<p className='text-slate-400 text-sm'>Last updated: {getCurrentTimestamp()}</p>
								</div>
							</CardContent>
						</Card>
					</motion.section>

					{/* Preferences */}
					<motion.section
						variants={fadeInUp}
						initial='hidden'
						aria-label='User Preferences'
						animate='visible'
						transition={{ delay: 0.8 }}
						whileHover={{ scale: 1.02 }}
						className='w-full'
					>
						<Card variant={CardVariant.GLASS}>
							<CardHeader>
								<CardTitle className='text-2xl font-bold text-white'>Preferences</CardTitle>
							</CardHeader>
							<CardContent>
								<GridLayout variant='balanced' gap={Spacing.LG}>
									<div>
										<h3 className='text-lg font-semibold text-white mb-4'>Game Settings</h3>
										<div className='space-y-4'>
											<label className='flex items-center'>
												<input
													type='checkbox'
													checked={preferences.soundEnabled}
													onChange={e => {
														const newValue = e.target.checked;
														setPreferences({ ...preferences, soundEnabled: newValue });
														updateSinglePreference.mutate({
															preference: 'soundEnabled',
															value: newValue,
														});

														// Update audio service immediately
														if (userProfile?.preferences) {
															const mergedPreferences = mergeUserPreferences(null, userProfile.preferences);
															audioService.setUserPreferences({
																...mergedPreferences,
																soundEnabled: newValue,
															});
														}
													}}
													className='mr-3'
												/>
												<span className='text-white'>Enable Sound Effects</span>
											</label>
											<label className='flex items-center'>
												<input
													type='checkbox'
													checked={preferences.musicEnabled}
													onChange={e => {
														const newValue = e.target.checked;
														setPreferences({ ...preferences, musicEnabled: newValue });
														updateSinglePreference.mutate({
															preference: 'musicEnabled',
															value: newValue,
														});

														// Update audio service immediately
														if (userProfile?.preferences) {
															const mergedPreferences = mergeUserPreferences(null, userProfile.preferences);
															audioService.setUserPreferences({
																...mergedPreferences,
																musicEnabled: newValue,
															});
														}
													}}
													className='mr-3'
												/>
												<span className='text-white'>Enable Background Music</span>
											</label>
											<label className='flex items-center'>
												<input
													type='checkbox'
													checked={preferences.animationsEnabled}
													onChange={e => {
														const newValue = e.target.checked;
														setPreferences({ ...preferences, animationsEnabled: newValue });
														updateSinglePreference.mutate({
															preference: 'animationsEnabled',
															value: newValue,
														});
													}}
													className='mr-3'
												/>
												<span className='text-white'>Enable Animations</span>
											</label>
										</div>
									</div>
									<div>
										<h3 className='text-lg font-semibold text-white mb-4'>Privacy Settings</h3>
										<div className='space-y-4'>
											<p className='text-white/75'>Privacy settings are managed through your account settings.</p>
										</div>
									</div>
								</GridLayout>

								<div className='mt-6 text-center space-x-4'>
									<Button
										variant={ButtonVariant.SECONDARY}
										onClick={handleSavePreferences}
										disabled={saving}
										className='px-8 py-3'
									>
										{saving ? 'Saving...' : 'Save Preferences'}
									</Button>
								</div>
							</CardContent>
						</Card>
					</motion.section>

					{/* Account Management Section */}
					<motion.section
						variants={fadeInUp}
						initial='hidden'
						animate='visible'
						transition={{ delay: 0.6 }}
						aria-label='Account Management'
						className='w-full'
					>
						<Card
							variant={CardVariant.TRANSPARENT}
							className='bg-red-500/10 border border-red-500/20'
							padding={Spacing.LG}
						>
							<CardHeader>
								<CardTitle className='text-2xl font-bold text-white text-center'>Account Management</CardTitle>
							</CardHeader>
							<CardContent>
								<div className='text-center'>
									<Button
										variant={ButtonVariant.DANGER}
										onClick={handleDeleteAccount}
										disabled={deleteAccountMutation.isPending}
										className='px-8 py-3 bg-red-600 hover:bg-red-700'
									>
										{deleteAccountMutation.isPending ? 'Deleting...' : 'Delete Account'}
									</Button>
									<p className='text-red-300 text-sm mt-2'>
										This action cannot be undone. All your data will be permanently deleted.
									</p>
								</div>
							</CardContent>
						</Card>
					</motion.section>
				</Card>
			</Container>

			{/* Confirm Modal */}
			<ConfirmModal
				open={confirmModal.open}
				onClose={() => setConfirmModal(prev => ({ ...prev, open: false }))}
				onConfirm={confirmModal.onConfirm}
				title='Delete Account'
				message='Are you sure you want to delete your account? This action cannot be undone.'
				confirmText='Delete'
				cancelText='Cancel'
				variant={AlertVariant.ERROR}
			/>
		</main>
	);
}
