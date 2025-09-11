// import { DifficultyLevel } from '@shared';
import { formatNumber, getCurrentTimestamp, mergeWithDefaults } from '@shared';

import { MouseEvent, useEffect, useState } from 'react';

import { motion } from 'framer-motion';
import { fadeInDown, fadeInUp } from '../../components/animations';
import { Container, GridLayout, Section } from '../../components/layout';
import { Button } from '../../components/ui';
import { useAppDispatch, useAppSelector, useUpdateUserProfile, useUserProfile } from '../../hooks';
import { useUpdateUserPreferences, useDeleteUserAccount } from '../../hooks/api';
import { useUpdateUserField, useUpdateSinglePreference } from '../../hooks/api/useAccountManagement';
import { setAvatar, setUsername } from '../../redux/slices';
import { apiService, audioService } from '../../services';
import type { RootState } from '../../types/redux/state.types';

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
		soundEnabled: true,
		musicEnabled: true,
		animationsEnabled: true,
		profilePublic: false,
		showStats: true,
	});
	const [saving, setSaving] = useState(false);

	// Use custom hooks for user profile
	const { data: userProfile } = useUserProfile();
	const updateProfileMutation = useUpdateUserProfile();
	
	// Use preferences hooks
	const updatePreferencesMutation = useUpdateUserPreferences();
	
	// Use account management hooks
	const deleteAccountMutation = useDeleteUserAccount();
	const updateUserField = useUpdateUserField();
	const updateSinglePreference = useUpdateSinglePreference();

	useEffect(() => {
		// Update Redux state when profile data is loaded
		if (userProfile) {
			dispatch(setUsername((userProfile.username as string) || ''));
			dispatch(setAvatar((userProfile.avatar as string) || ''));
			setEmail((userProfile.email as string) || '');
			setBio('');
			setLocation('');

			// Set default preferences since User type doesn't include preferences
			setPreferences({
				soundEnabled: true,
				musicEnabled: true,
				animationsEnabled: true,
				profilePublic: false,
				showStats: true,
			});
		}
	}, [userProfile, dispatch]);

	// Fetch real user stats
	useEffect(() => {
		const fetchUserStats = async () => {
			try {
				// Use API service to get real user statistics
				const userStats = await apiService.getUserStats();
				if (userStats && typeof userStats === 'object') {
					// UserStatsData is already properly typed, no need for type assertion
					setStats({
						totalGames: userStats.gamesPlayed || 0,
						totalScore: userStats.correctAnswers || 0,
						averageScore: userStats.averageScore || 0,
						bestStreak: 0,
					});
				}
			} catch (error) {
				// Keep default values on error
			}
		};

		if (userProfile) {
			fetchUserStats();
		}
	}, [userProfile]);

	const handleSavePreferences = async () => {
		setSaving(true);
		try {
			// Use preferences hook
			updatePreferencesMutation.mutate({
				theme: preferences.soundEnabled ? 'dark' : 'light',
				language: 'en',
				notifications: preferences.animationsEnabled,
				favoriteTopics: [],
     // difficulty: DifficultyLevel.MEDIUM,
			});
		} catch (err) {
			// Handle error silently
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
			email,
			additional_info: bio,
		});
		} catch (err) {
			// Handle error silently
		} finally {
			setLoading(false);
		}
	};

	const handleDeleteAccount = async () => {
		if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
			try {
				await deleteAccountMutation.mutateAsync();
				// Redirect to home page after successful deletion
				window.location.href = '/';
			} catch (error) {
				console.error('Failed to delete account:', error);
			}
		}
	};

	return (
		<Container size='xl' className='min-h-screen flex flex-col items-center justify-start p-4 pt-20'>
			<Section padding='xl' className='w-full space-y-8'>
				{/* Header */}
				<motion.div 
					variants={fadeInDown} 
					initial="hidden" 
					animate="visible" 
					transition={{ delay: 0.2 }}
					className='text-center mb-12'
				>
					<h1 className='text-4xl md:text-5xl font-bold text-white mb-4 gradient-text'>User Profile</h1>
					<p className='text-xl text-slate-300'>Manage your account and preferences</p>
				</motion.div>

				{/* Profile Information */}
				<motion.div 
					variants={fadeInUp} 
					initial="hidden" 
					animate="visible" 
					transition={{ delay: 0.4 }}
					whileHover={{ scale: 1.02 }}
					className='w-full'
				>
					<Section background='glass' padding='lg' className='rounded-lg'>
						<h2 className='text-2xl font-bold text-white mb-6'>Profile Information</h2>
						<GridLayout variant='form' gap='lg'>
							<div>
								<label className='block text-white font-medium mb-2'>Display Name</label>
								<div className='flex gap-2'>
									<input
										type='text'
										value={username}
										onChange={(e) => dispatch(setUsername(e.target.value))}
										className='flex-1 p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500'
										placeholder='Enter your display name'
									/>
									<Button
										variant='secondary'
										size='sm'
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
										onChange={(e) => setEmail(e.target.value)}
										className='flex-1 p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500'
										placeholder='Enter your email'
									/>
									<Button
										variant='secondary'
										size='sm'
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
										onChange={(e) => setBio(e.target.value)}
										className='flex-1 p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500'
										placeholder='Tell us about yourself'
										rows={3}
									/>
									<Button
										variant='secondary'
										size='sm'
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
										onChange={(e) => setLocation(e.target.value)}
										className='flex-1 p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500'
										placeholder='Enter your location'
									/>
									<Button
										variant='secondary'
										size='sm'
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
								variant='primary'
								onClick={handleSave}
								disabled={loading}
								className='px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600'
							>
								{loading ? 'Saving...' : 'Save Profile'}
							</Button>
						</div>
					</Section>
				</motion.div>

				{/* Statistics */}
				<motion.div 
					variants={fadeInUp} 
					initial="hidden" 
					animate="visible" 
					transition={{ delay: 0.6 }}
					whileHover={{ scale: 1.02 }}
					className='w-full'
				>
					<Section background='glass' padding='lg' className='rounded-lg'>
						<h2 className='text-2xl font-bold text-white mb-6'>Your Statistics</h2>
						<GridLayout variant='stats' gap='lg'>
							<div className='text-center'>
								<div className='text-3xl font-bold text-white mb-2'>{stats.totalGames}</div>
								<div className='text-slate-300'>Total Games</div>
							</div>
							<div className='text-center'>
								<div className='text-3xl font-bold text-green-400 mb-2'>{formatNumber(stats.totalScore)}</div>
								<div className='text-slate-300'>Total Score</div>
							</div>
							<div className='text-center'>
								<div className='text-3xl font-bold text-blue-400 mb-2'>{formatNumber(stats.averageScore)}</div>
								<div className='text-slate-300'>Average Score</div>
							</div>
							<div className='text-center'>
								<div className='text-3xl font-bold text-yellow-400 mb-2'>{stats.bestStreak}</div>
								<div className='text-slate-300'>Best Streak</div>
							</div>
						</GridLayout>
						
						{/* Last Updated Info */}
						<div className='mt-4 text-center'>
							<p className='text-slate-400 text-sm'>
								Last updated: {getCurrentTimestamp()}
							</p>
						</div>
					</Section>
				</motion.div>

				{/* Preferences */}
				<motion.div 
					variants={fadeInUp} 
					initial="hidden" 
					animate="visible" 
					transition={{ delay: 0.8 }}
					whileHover={{ scale: 1.02 }}
					className='w-full'
				>
					<Section background='glass' padding='lg' className='rounded-lg'>
						<h2 className='text-2xl font-bold text-white mb-6'>Preferences</h2>
						<GridLayout variant='content' gap='lg'>
							<div>
								<h3 className='text-lg font-semibold text-white mb-4'>Game Settings</h3>
								<div className='space-y-4'>
									<label className='flex items-center'>
										<input
											type='checkbox'
											checked={preferences.soundEnabled}
											onChange={(e) => {
												const newValue = e.target.checked;
												setPreferences({ ...preferences, soundEnabled: newValue });
												updateSinglePreference.mutate({ preference: 'soundEnabled', value: newValue });
												
												// Update audio service immediately
												if (userProfile?.preferences) {
													const mergedPreferences = mergeWithDefaults(userProfile.preferences);
													audioService.setUserPreferences({
														...mergedPreferences,
														soundEnabled: newValue
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
											onChange={(e) => {
												const newValue = e.target.checked;
												setPreferences({ ...preferences, musicEnabled: newValue });
												updateSinglePreference.mutate({ preference: 'musicEnabled', value: newValue });
												
												// Update audio service immediately
												if (userProfile?.preferences) {
													const mergedPreferences = mergeWithDefaults(userProfile.preferences);
													audioService.setUserPreferences({
														...mergedPreferences,
														musicEnabled: newValue
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
											onChange={(e) => {
												const newValue = e.target.checked;
												setPreferences({ ...preferences, animationsEnabled: newValue });
												updateSinglePreference.mutate({ preference: 'animationsEnabled', value: newValue });
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
									<label className='flex items-center'>
										<input
											type='checkbox'
											checked={preferences.profilePublic}
											onChange={(e) => {
												const newValue = e.target.checked;
												setPreferences({ ...preferences, profilePublic: newValue });
												updateSinglePreference.mutate({ preference: 'profilePublic', value: newValue });
											}}
											className='mr-3'
										/>
										<span className='text-white'>Public Profile</span>
									</label>
									<label className='flex items-center'>
										<input
											type='checkbox'
											checked={preferences.showStats}
											onChange={(e) => {
												const newValue = e.target.checked;
												setPreferences({ ...preferences, showStats: newValue });
												updateSinglePreference.mutate({ preference: 'showStats', value: newValue });
											}}
											className='mr-3'
										/>
										<span className='text-white'>Show Statistics</span>
									</label>
								</div>
							</div>
						</GridLayout>

						<div className='mt-6 text-center space-x-4'>
							<Button variant='secondary' onClick={handleSavePreferences} disabled={saving} className='px-8 py-3'>
								{saving ? 'Saving...' : 'Save Preferences'}
							</Button>
						</div>
					</Section>
				</motion.div>

				{/* Account Management Section */}
				<motion.div 
					variants={fadeInUp}
					initial="hidden" 
					animate="visible" 
					transition={{ delay: 0.6 }}
					className='w-full'
				>
					<Section padding='lg' className='bg-red-500/10 border border-red-500/20 rounded-xl'>
						<h2 className='text-2xl font-bold text-white mb-6 text-center'>Account Management</h2>
						<div className='text-center'>
							<Button 
								variant='danger' 
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
					</Section>
				</motion.div>
			</Section>
		</Container>
	);
}

