import { useState, type ElementType } from 'react';
import { useNavigate } from 'react-router-dom';

import { motion } from 'framer-motion';
import { Award, Clock, Flame, GamepadIcon, Key, Target, Trophy } from 'lucide-react';

import {
	Avatar,
	AvatarFallback,
	AvatarImage,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	ChangePasswordDialog,
	Input,
	Label,
	Skeleton,
} from '@/components';
import { useAppSelector, useUpdateUserProfile, useUserProfile, useUserStats } from '@/hooks';
import type { RootState } from '@/types';
import { formatPlayTime } from '@/utils';

function StatCard({
	icon: Icon,
	label,
	value,
	suffix,
	color,
}: {
	icon: ElementType;
	label: string;
	value: number | string;
	suffix?: string;
	color: string;
}) {
	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.95 }}
			animate={{ opacity: 1, scale: 1 }}
			className='text-center p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors'
		>
			<Icon className={`h-6 w-6 mx-auto mb-2 ${color}`} />
			<p className='text-3xl font-bold'>
				{value}
				{suffix}
			</p>
			<p className='text-sm text-muted-foreground'>{label}</p>
		</motion.div>
	);
}

function ProfileSkeleton() {
	return (
		<div className='space-y-6'>
			<div className='flex items-center gap-4'>
				<Skeleton className='h-20 w-20 rounded-full' />
				<div className='space-y-2'>
					<Skeleton className='h-6 w-48' />
					<Skeleton className='h-4 w-32' />
				</div>
			</div>
			<div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
				{[...Array(6)].map((_, i) => (
					<Skeleton key={i} className='h-24 rounded-lg' />
				))}
			</div>
		</div>
	);
}

export function UserProfile() {
	const navigate = useNavigate();
	const [isEditing, setIsEditing] = useState(false);
	const [editData, setEditData] = useState({ firstName: '', lastName: '' });
	const [showPasswordDialog, setShowPasswordDialog] = useState(false);

	const { currentUser } = useAppSelector((state: RootState) => state.user);
	const { data: userProfile, isLoading: profileLoading } = useUserProfile();
	const { data: userStats, isLoading: statsLoading } = useUserStats();
	const updateProfile = useUpdateUserProfile();

	const profile = userProfile?.profile;
	const isLoading = profileLoading || statsLoading;

	const handleEditStart = () => {
		setEditData({
			firstName: profile?.firstName || '',
			lastName: profile?.lastName || '',
		});
		setIsEditing(true);
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
			<motion.main
				role='main'
				aria-label='User Profile'
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				className='min-h-screen py-12 px-4'
			>
				<div className='max-w-4xl mx-auto'>
					<Card>
						<CardContent className='pt-6'>
							<ProfileSkeleton />
						</CardContent>
					</Card>
				</div>
			</motion.main>
		);
	}

	return (
		<motion.main
			role='main'
			aria-label='User Profile'
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			className='min-h-screen py-12 px-4'
		>
			<div className='max-w-4xl mx-auto space-y-8'>
				{/* Profile Header */}
				<Card>
					<CardHeader>
						<div className='flex items-center justify-between'>
							<div className='flex items-center gap-4'>
								<Avatar className='h-20 w-20'>
									<AvatarImage src={profile?.avatar} alt={getDisplayName()} />
									<AvatarFallback className='text-2xl'>{getUserInitials()}</AvatarFallback>
								</Avatar>
								{isEditing ? (
									<div className='space-y-2'>
										<div className='flex gap-2'>
											<div>
												<Label htmlFor='firstName'>First Name</Label>
												<Input
													id='firstName'
													value={editData.firstName}
													onChange={e => setEditData(prev => ({ ...prev, firstName: e.target.value }))}
													placeholder='First name'
												/>
											</div>
											<div>
												<Label htmlFor='lastName'>Last Name</Label>
												<Input
													id='lastName'
													value={editData.lastName}
													onChange={e => setEditData(prev => ({ ...prev, lastName: e.target.value }))}
													placeholder='Last name'
												/>
											</div>
										</div>
									</div>
								) : (
									<div>
										<CardTitle className='text-2xl'>{getDisplayName()}</CardTitle>
										<CardDescription>{currentUser?.email}</CardDescription>
									</div>
								)}
							</div>
							<div className='flex gap-2'>
								{isEditing ? (
									<>
										<Button variant='outline' onClick={() => setIsEditing(false)}>
											Cancel
										</Button>
										<Button onClick={handleSave} disabled={updateProfile.isPending}>
											{updateProfile.isPending ? 'Saving...' : 'Save'}
										</Button>
									</>
								) : (
									<Button variant='outline' onClick={handleEditStart}>
										Edit Profile
									</Button>
								)}
							</div>
						</div>
					</CardHeader>
				</Card>

				{/* Statistics */}
				<Card>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<Trophy className='h-5 w-5 text-yellow-500' />
							Your Statistics
						</CardTitle>
						<CardDescription>Track your trivia performance</CardDescription>
					</CardHeader>
					<CardContent>
						<div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
							<StatCard
								icon={GamepadIcon}
								label='Games Played'
								value={userStats?.gamesPlayed || 0}
								color='text-blue-500'
							/>
							<StatCard
								icon={Target}
								label='Total Score'
								value={(userStats?.score || 0).toLocaleString()}
								color='text-green-500'
							/>
							<StatCard
								icon={Award}
								label='Success Rate'
								value={Math.round(userStats?.successRate || 0)}
								suffix='%'
								color='text-purple-500'
							/>
							<StatCard
								icon={Trophy}
								label='Best Score'
								value={(userStats?.bestScore || 0).toLocaleString()}
								color='text-yellow-500'
							/>
							<StatCard icon={Flame} label='Best Streak' value={userStats?.bestStreak || 0} color='text-orange-500' />
							<StatCard
								icon={Clock}
								label='Play Time'
								value={formatPlayTime(userStats?.totalPlayTime || 0, 'minutes')}
								color='text-cyan-500'
							/>
						</div>
					</CardContent>
				</Card>

				{/* Quick Actions */}
				<Card>
					<CardHeader>
						<CardTitle>Quick Actions</CardTitle>
					</CardHeader>
					<CardContent className='flex flex-wrap gap-3'>
						<Button onClick={() => navigate('/history')}>View Game History</Button>
						<Button variant='outline' onClick={() => navigate('/analytics')}>
							View Analytics
						</Button>
					</CardContent>
				</Card>

				{/* Security */}
				<Card>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<Key className='h-5 w-5' />
							Security
						</CardTitle>
						<CardDescription>Manage your account security</CardDescription>
					</CardHeader>
					<CardContent>
						<Button variant='outline' onClick={() => setShowPasswordDialog(true)}>
							Change Password
						</Button>
					</CardContent>
				</Card>
			</div>

			{/* Change Password Dialog */}
			<ChangePasswordDialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog} />
		</motion.main>
	);
}
