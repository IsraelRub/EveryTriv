import { DifficultyLevel } from 'everytriv-shared/constants';
import { formatNumber,getCurrentTimestamp } from 'everytriv-shared/utils';
import { MouseEvent, useEffect, useState } from 'react';

import { FadeInDown, FadeInUp } from '../../components/animations';
import { Container, GridLayout, Section } from '../../components/layout';
import { Button } from '../../components/ui';
import { useAppDispatch, useAppSelector, useUpdateUserProfile, useUserProfile } from '../../hooks';
import { setAvatar, setUsername } from '../../redux/features';
import { apiService } from '../../services';
import type { RootState } from '../../types';

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
					const statsObj = userStats as unknown as Record<string, unknown>;
					setStats({
						totalGames: (statsObj.totalGames as number) || 0,
						totalScore: (statsObj.totalScore as number) || 0,
						averageScore: (statsObj.averageScore as number) || 0,
						bestStreak: (statsObj.bestStreak as number) || 0,
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
			// Save preferences to user profile
			await apiService.updateUserProfile({
				preferences: {
					theme: preferences.soundEnabled ? 'dark' : 'light',
					language: 'en',
					notifications: preferences.animationsEnabled,
					favoriteTopics: [],
					difficulty: DifficultyLevel.MEDIUM,
				},
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

	return (
		<Container size='xl' className='min-h-screen flex flex-col items-center justify-start p-4 pt-20'>
			<Section padding='xl' className='w-full space-y-8'>
				{/* Header */}
				<FadeInDown className='text-center mb-12' delay={0.2}>
					<h1 className='text-4xl md:text-5xl font-bold text-white mb-4 gradient-text'>User Profile</h1>
					<p className='text-xl text-slate-300'>Manage your account and preferences</p>
				</FadeInDown>

				{/* Profile Information */}
				<FadeInUp delay={0.4}>
					<Section background='glass' padding='lg' className='rounded-lg'>
						<h2 className='text-2xl font-bold text-white mb-6'>Profile Information</h2>
						<GridLayout variant='form' gap='lg'>
							<div>
								<label className='block text-white font-medium mb-2'>Display Name</label>
								<input
									type='text'
									value={username}
									onChange={(e) => dispatch(setUsername(e.target.value))}
									className='w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500'
									placeholder='Enter your display name'
								/>
							</div>
							<div>
								<label className='block text-white font-medium mb-2'>Email</label>
								<input
									type='email'
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									className='w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500'
									placeholder='Enter your email'
								/>
							</div>
							<div>
								<label className='block text-white font-medium mb-2'>Bio</label>
								<textarea
									value={bio}
									onChange={(e) => setBio(e.target.value)}
									className='w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500'
									placeholder='Tell us about yourself'
									rows={3}
								/>
							</div>
							<div>
								<label className='block text-white font-medium mb-2'>Location</label>
								<input
									type='text'
									value={location}
									onChange={(e) => setLocation(e.target.value)}
									className='w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500'
									placeholder='Enter your location'
								/>
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
				</FadeInUp>

				{/* Statistics */}
				<FadeInUp delay={0.6}>
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
				</FadeInUp>

				{/* Preferences */}
				<FadeInUp delay={0.8}>
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
											onChange={(e) => setPreferences({ ...preferences, soundEnabled: e.target.checked })}
											className='mr-3'
										/>
										<span className='text-white'>Enable Sound Effects</span>
									</label>
									<label className='flex items-center'>
										<input
											type='checkbox'
											checked={preferences.musicEnabled}
											onChange={(e) => setPreferences({ ...preferences, musicEnabled: e.target.checked })}
											className='mr-3'
										/>
										<span className='text-white'>Enable Background Music</span>
									</label>
									<label className='flex items-center'>
										<input
											type='checkbox'
											checked={preferences.animationsEnabled}
											onChange={(e) => setPreferences({ ...preferences, animationsEnabled: e.target.checked })}
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
											onChange={(e) => setPreferences({ ...preferences, profilePublic: e.target.checked })}
											className='mr-3'
										/>
										<span className='text-white'>Public Profile</span>
									</label>
									<label className='flex items-center'>
										<input
											type='checkbox'
											checked={preferences.showStats}
											onChange={(e) => setPreferences({ ...preferences, showStats: e.target.checked })}
											className='mr-3'
										/>
										<span className='text-white'>Show Statistics</span>
									</label>
								</div>
							</div>
						</GridLayout>

						<div className='mt-6 text-center'>
							<Button variant='secondary' onClick={handleSavePreferences} disabled={saving} className='px-8 py-3'>
								{saving ? 'Saving...' : 'Save Preferences'}
							</Button>
						</div>
					</Section>
				</FadeInUp>
			</Section>
		</Container>
	);
}
