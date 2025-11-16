/**
 * Admin Dashboard
 *
 * @module AdminDashboard
 * @description Admin dashboard for managing users, content, and system settings
 */

import { useState } from 'react';

import { motion } from 'framer-motion';

import {
	Button,
	Card,
	ConfirmModal,
	Container,
	fadeInUp,
	FeatureErrorBoundary,
	GridLayout,
	Icon,
	scaleIn,
} from '../../components';
import { AlertVariant, ButtonVariant, CardVariant, ComponentSize, ContainerSize, Spacing } from '../../constants';
import {
	useCompareUserPerformance,
	useDeleteUser,
	useGetUserById,
	useUpdateUserCredits,
	useUpdateUserStatus,
	useUserAchievementsById,
	useUserActivityById,
	useUserInsightsById,
	useUserPerformanceById,
	useUserProgressById,
	useUserRecommendationsById,
	useUserStatisticsById,
	useUserSummaryById,
	useUserTrendsById,
} from '../../hooks';

export default function AdminDashboard() {
	return (
		<FeatureErrorBoundary featureName='Admin Dashboard'>
			<AdminDashboardContent />
		</FeatureErrorBoundary>
	);
}

type UserStatusOption = 'active' | 'suspended' | 'banned';
const USER_STATUS_VALUES: UserStatusOption[] = ['active', 'suspended', 'banned'];

const ADMIN_TABS: readonly ['users', 'analytics', 'settings'] = ['users', 'analytics', 'settings'];

const isUserStatus = (value: string): value is UserStatusOption => USER_STATUS_VALUES.some(status => status === value);

type AnalyticsViewType =
	| 'statistics'
	| 'performance'
	| 'progress'
	| 'activity'
	| 'insights'
	| 'recommendations'
	| 'achievements'
	| 'trends'
	| 'comparison'
	| 'summary';

const ANALYTICS_VIEWS: readonly AnalyticsViewType[] = [
	'statistics',
	'performance',
	'progress',
	'activity',
	'insights',
	'recommendations',
	'achievements',
	'trends',
	'comparison',
	'summary',
] as const;

function AdminDashboardContent() {
	const [activeTab, setActiveTab] = useState<'users' | 'analytics' | 'settings'>('users');
	const [selectedUserId, setSelectedUserId] = useState('');
	const [analyticsUserId, setAnalyticsUserId] = useState('');
	const [analyticsView, setAnalyticsView] = useState<AnalyticsViewType>('statistics');
	const [creditsAmount, setCreditsAmount] = useState(0);
	const [creditsReason, setCreditsReason] = useState('');
	const [userStatus, setUserStatus] = useState<UserStatusOption>('active');
	const [confirmModal, setConfirmModal] = useState<{
		open: boolean;
		userId: string;
		onConfirm: () => void;
	}>({
		open: false,
		userId: '',
		onConfirm: () => {},
	});

	// Admin hooks
	const updateUserCredits = useUpdateUserCredits();
	const updateUserStatus = useUpdateUserStatus();
	const deleteUser = useDeleteUser();
	const getUserById = useGetUserById();

	// Admin analytics hooks
	const userStatistics = useUserStatisticsById(analyticsUserId);
	const userPerformance = useUserPerformanceById(analyticsUserId);
	const userProgress = useUserProgressById(analyticsUserId);
	const userActivity = useUserActivityById(analyticsUserId);
	const userInsights = useUserInsightsById(analyticsUserId);
	const userRecommendations = useUserRecommendationsById(analyticsUserId);
	const userAchievements = useUserAchievementsById(analyticsUserId);
	const userTrends = useUserTrendsById(analyticsUserId);
	const userComparison = useCompareUserPerformance(analyticsUserId);
	const userSummary = useUserSummaryById(analyticsUserId, false);

	const handleUpdateCredits = () => {
		if (selectedUserId === '' || creditsAmount <= 0) return;

		updateUserCredits.mutate({
			userId: selectedUserId,
			amount: creditsAmount,
			reason: creditsReason,
		});
	};

	const handleUpdateStatus = () => {
		if (!selectedUserId) return;

		updateUserStatus.mutate({
			userId: selectedUserId,
			status: userStatus,
		});
	};

	const handleDeleteUser = () => {
		if (!selectedUserId) return;

		setConfirmModal({
			open: true,
			userId: selectedUserId,
			onConfirm: () => {
				deleteUser.mutate(selectedUserId);
				setConfirmModal(prev => ({ ...prev, open: false }));
			},
		});
	};

	return (
		<main role='main' aria-label='Admin Dashboard'>
			<Container size={ContainerSize.XL} className='min-h-screen flex flex-col items-center justify-start p-4 pt-20'>
				<Card variant={CardVariant.TRANSPARENT} padding={Spacing.XL} className='w-full space-y-8'>
					{/* Header */}
					<motion.header
						variants={fadeInUp}
						initial='hidden'
						animate='visible'
						transition={{ delay: 0.2 }}
						className='text-center mb-12'
					>
						<h1 className='text-5xl font-bold text-white mb-4 gradient-text'>Admin Dashboard</h1>
						<p className='text-xl text-slate-300'>Manage users, content, and system settings</p>
					</motion.header>

					{/* Tabs */}
					<motion.nav
						variants={fadeInUp}
						initial='hidden'
						animate='visible'
						transition={{ delay: 0.4 }}
						className='flex justify-center mb-8'
						aria-label='Admin Dashboard Navigation'
					>
						<div className='bg-slate-800/60 rounded-lg p-1 border border-white/10'>
							{ADMIN_TABS.map(tab => (
								<button
									key={tab}
									onClick={() => setActiveTab(tab)}
									className={`px-6 py-3 rounded-md text-sm font-medium transition-colors capitalize ${
										activeTab === tab ? 'bg-blue-500 text-white' : 'text-slate-300 hover:text-white'
									}`}
								>
									{tab}
								</button>
							))}
						</div>
					</motion.nav>

					{/* Users Management */}
					{activeTab === 'users' && (
						<motion.section
							variants={scaleIn}
							aria-label='Users Management'
							initial='hidden'
							animate='visible'
							transition={{ delay: 0.6 }}
							whileHover={{ scale: 1.02 }}
						>
							<div className='glass-strong rounded-lg p-8'>
								<h2 className='text-2xl font-bold text-white mb-6'>User Management</h2>

								<GridLayout variant='content' gap={Spacing.XL}>
									{/* User Search */}
									<div>
										<h3 className='text-lg font-semibold text-white mb-4'>Find User</h3>
										<div className='space-y-4'>
											<div>
												<label className='block text-white font-medium mb-2'>User ID</label>
												<input
													type='text'
													value={selectedUserId}
													onChange={e => setSelectedUserId(e.target.value)}
													className='w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500'
													placeholder='Enter user ID'
												/>
											</div>
											<Button
												variant={ButtonVariant.SECONDARY}
												onClick={() => getUserById.mutate(selectedUserId)}
												disabled={!selectedUserId || getUserById.isPending}
												className='w-full'
											>
												{getUserById.isPending ? 'Searching...' : 'Search User'}
											</Button>
										</div>
									</div>

									{/* User Actions */}
									<div>
										<h3 className='text-lg font-semibold text-white mb-4'>User Actions</h3>
										<div className='space-y-4'>
											{/* Update Credits */}
											<Card
												variant={CardVariant.TRANSPARENT}
												padding={Spacing.LG}
												className='rounded-lg border border-blue-400/30 bg-blue-500/10'
											>
												<h4 className='text-white font-medium mb-3'>Update Credits</h4>
												<div className='space-y-3'>
													<input
														type='number'
														value={creditsAmount}
														onChange={e => setCreditsAmount(Number(e.target.value))}
														className='w-full p-2 bg-white/10 border border-white/20 rounded text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500'
														placeholder='Credits amount'
													/>
													<input
														type='text'
														value={creditsReason}
														onChange={e => setCreditsReason(e.target.value)}
														className='w-full p-2 bg-white/10 border border-white/20 rounded text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500'
														placeholder='Reason for update'
													/>
													<Button
														variant={ButtonVariant.SECONDARY}
														onClick={handleUpdateCredits}
														disabled={selectedUserId === '' || creditsAmount <= 0 || updateUserCredits.isPending}
														className='w-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-400/30'
													>
														{updateUserCredits.isPending ? 'Updating...' : 'Update Credits'}
													</Button>
												</div>
											</Card>

											{/* Update Status */}
											<Card
												variant={CardVariant.TRANSPARENT}
												padding={Spacing.LG}
												className='rounded-lg border border-yellow-400/30 bg-yellow-500/10'
											>
												<h4 className='text-white font-medium mb-3'>Update Status</h4>
												<div className='space-y-3'>
													<select
														value={userStatus}
														onChange={event => {
															const { value } = event.target;
															if (isUserStatus(value)) {
																setUserStatus(value);
															}
														}}
														className='w-full p-2 bg-white/10 border border-white/20 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
													>
														<option value='active'>Active</option>
														<option value='suspended'>Suspended</option>
														<option value='banned'>Banned</option>
													</select>
													<Button
														variant={ButtonVariant.SECONDARY}
														onClick={handleUpdateStatus}
														disabled={!selectedUserId || updateUserStatus.isPending}
														className='w-full bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border border-yellow-400/30'
													>
														{updateUserStatus.isPending ? 'Updating...' : 'Update Status'}
													</Button>
												</div>
											</Card>

											{/* Delete User */}
											<Card
												variant={CardVariant.TRANSPARENT}
												padding={Spacing.LG}
												className='rounded-lg border border-red-400/30 bg-red-500/10'
											>
												<h4 className='text-white font-medium mb-3'>Delete User</h4>
												<Button
													variant={ButtonVariant.SECONDARY}
													onClick={handleDeleteUser}
													disabled={!selectedUserId || deleteUser.isPending}
													className='w-full bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-400/30'
												>
													{deleteUser.isPending ? 'Deleting...' : 'Delete User'}
												</Button>
											</Card>
										</div>
									</div>
								</GridLayout>
							</div>
						</motion.section>
					)}

					{/* Analytics */}
					{activeTab === 'analytics' && (
						<motion.section
							aria-label='Analytics Dashboard'
							variants={scaleIn}
							initial='hidden'
							animate='visible'
							transition={{ delay: 0.6 }}
							whileHover={{ scale: 1.02 }}
						>
							<div className='glass-strong rounded-lg p-8'>
								<h2 className='text-2xl font-bold text-white mb-6'>User Analytics (Admin Only)</h2>

								{/* User ID Input */}
								<div className='mb-6'>
									<label className='block text-white font-medium mb-2'>User ID</label>
									<div className='flex gap-4'>
										<input
											type='text'
											value={analyticsUserId}
											onChange={e => setAnalyticsUserId(e.target.value)}
											className='flex-1 p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500'
											placeholder='Enter user ID to view analytics'
										/>
										<select
											value={analyticsView}
											onChange={e => setAnalyticsView(e.target.value as AnalyticsViewType)}
											className='p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
										>
											{ANALYTICS_VIEWS.map(view => (
												<option key={view} value={view}>
													{view.charAt(0).toUpperCase() + view.slice(1)}
												</option>
											))}
										</select>
									</div>
								</div>

								{/* Analytics Content */}
								{analyticsUserId ? (
									<div className='space-y-6'>
										{analyticsView === 'statistics' && (
											<Card
												variant={CardVariant.TRANSPARENT}
												padding={Spacing.LG}
												className='rounded-lg border border-blue-400/30'
											>
												<h3 className='text-xl font-bold text-white mb-4'>User Statistics</h3>
												{userStatistics.isLoading && (
													<div className='text-slate-300 text-center py-8'>Loading statistics...</div>
												)}
												{userStatistics.error && (
													<div className='text-red-400 text-center py-8'>
														Error loading statistics: {userStatistics.error.message}
													</div>
												)}
												{userStatistics.data && (
													<GridLayout variant='balanced' gap={Spacing.MD}>
														<Card variant={CardVariant.TRANSPARENT} padding={Spacing.MD} className='text-center'>
															<div className='text-2xl font-bold text-blue-400 mb-1'>
																{userStatistics.data.data?.totalGames ?? 0}
															</div>
															<div className='text-slate-300 text-sm'>Total Games</div>
														</Card>
														<Card variant={CardVariant.TRANSPARENT} padding={Spacing.MD} className='text-center'>
															<div className='text-2xl font-bold text-green-400 mb-1'>
																{userStatistics.data.data?.totalQuestions ?? 0}
															</div>
															<div className='text-slate-300 text-sm'>Total Questions</div>
														</Card>
														<Card variant={CardVariant.TRANSPARENT} padding={Spacing.MD} className='text-center'>
															<div className='text-2xl font-bold text-purple-400 mb-1'>
																{userStatistics.data.data?.successRate?.toFixed(1) ?? 0}%
															</div>
															<div className='text-slate-300 text-sm'>Success Rate</div>
														</Card>
														<Card variant={CardVariant.TRANSPARENT} padding={Spacing.MD} className='text-center'>
															<div className='text-2xl font-bold text-yellow-400 mb-1'>
																{userStatistics.data.data?.averageScore?.toFixed(1) ?? 0}
															</div>
															<div className='text-slate-300 text-sm'>Average Score</div>
														</Card>
													</GridLayout>
												)}
											</Card>
										)}

										{analyticsView === 'performance' && (
											<Card
												variant={CardVariant.TRANSPARENT}
												padding={Spacing.LG}
												className='rounded-lg border border-green-400/30'
											>
												<h3 className='text-xl font-bold text-white mb-4'>User Performance</h3>
												{userPerformance.isLoading && (
													<div className='text-slate-300 text-center py-8'>Loading performance...</div>
												)}
												{userPerformance.error && (
													<div className='text-red-400 text-center py-8'>
														Error loading performance: {userPerformance.error.message}
													</div>
												)}
												{userPerformance.data && (
													<div className='space-y-4'>
														<div className='flex justify-between items-center'>
															<span className='text-slate-300'>Best Streak:</span>
															<span className='text-white font-semibold'>
																{userPerformance.data.data?.bestStreak ?? 0} days
															</span>
														</div>
														<div className='flex justify-between items-center'>
															<span className='text-slate-300'>Current Streak:</span>
															<span className='text-white font-semibold'>
																{userPerformance.data.data?.streakDays ?? 0} days
															</span>
														</div>
														<div className='flex justify-between items-center'>
															<span className='text-slate-300'>Improvement Rate:</span>
															<span className='text-white font-semibold'>
																{userPerformance.data.data?.improvementRate?.toFixed(2) ?? 0}%
															</span>
														</div>
													</div>
												)}
											</Card>
										)}

										{analyticsView === 'activity' && (
											<Card
												variant={CardVariant.TRANSPARENT}
												padding={Spacing.LG}
												className='rounded-lg border border-purple-400/30'
											>
												<h3 className='text-xl font-bold text-white mb-4'>User Activity</h3>
												{userActivity.isLoading && (
													<div className='text-slate-300 text-center py-8'>Loading activity...</div>
												)}
												{userActivity.error && (
													<div className='text-red-400 text-center py-8'>
														Error loading activity: {userActivity.error.message}
													</div>
												)}
												{userActivity.data && (
													<div className='space-y-2'>
														{userActivity.data.data && userActivity.data.data.length > 0 ? (
															userActivity.data.data.slice(0, 10).map((activity, index) => (
																<Card
																	key={index}
																	variant={CardVariant.TRANSPARENT}
																	padding={Spacing.SM}
																	className='border border-white/10'
																>
																	<div className='text-slate-300 text-sm'>{activity.action ?? 'Activity'}</div>
																	{activity.detail && <div className='text-slate-400 text-xs'>{activity.detail}</div>}
																	<div className='text-slate-400 text-xs'>
																		{activity.date ? new Date(activity.date).toLocaleString() : 'Unknown time'}
																	</div>
																</Card>
															))
														) : (
															<div className='text-slate-400 text-center py-4'>No activity found</div>
														)}
													</div>
												)}
											</Card>
										)}

										{analyticsView === 'achievements' && (
											<Card
												variant={CardVariant.TRANSPARENT}
												padding={Spacing.LG}
												className='rounded-lg border border-yellow-400/30'
											>
												<h3 className='text-xl font-bold text-white mb-4'>User Achievements</h3>
												{userAchievements.isLoading && (
													<div className='text-slate-300 text-center py-8'>Loading achievements...</div>
												)}
												{userAchievements.error && (
													<div className='text-red-400 text-center py-8'>
														Error loading achievements: {userAchievements.error.message}
													</div>
												)}
												{userAchievements.data && (
													<div className='space-y-2'>
														{userAchievements.data.data && userAchievements.data.data.length > 0 ? (
															userAchievements.data.data.map((achievement, index) => (
																<Card
																	key={index}
																	variant={CardVariant.TRANSPARENT}
																	padding={Spacing.MD}
																	className='border border-yellow-400/20'
																>
																	<div className='text-white font-semibold'>{achievement.name ?? 'Achievement'}</div>
																	<div className='text-slate-300 text-sm'>{achievement.description ?? ''}</div>
																</Card>
															))
														) : (
															<div className='text-slate-400 text-center py-4'>No achievements found</div>
														)}
													</div>
												)}
											</Card>
										)}

										{analyticsView === 'summary' && (
											<Card
												variant={CardVariant.TRANSPARENT}
												padding={Spacing.LG}
												className='rounded-lg border border-indigo-400/30'
											>
												<h3 className='text-xl font-bold text-white mb-4'>User Summary</h3>
												{userSummary.isLoading && (
													<div className='text-slate-300 text-center py-8'>Loading summary...</div>
												)}
												{userSummary.error && (
													<div className='text-red-400 text-center py-8'>
														Error loading summary: {userSummary.error.message}
													</div>
												)}
												{userSummary.data && (
													<div className='space-y-4'>
														{userSummary.data.data?.insights && userSummary.data.data.insights.length > 0 ? (
															<div className='space-y-2'>
																{userSummary.data.data.insights.map((insight, index) => (
																	<div key={index} className='text-slate-300'>
																		{insight}
																	</div>
																))}
															</div>
														) : (
															<div className='text-slate-300'>No summary available</div>
														)}
													</div>
												)}
											</Card>
										)}

										{(analyticsView === 'progress' ||
											analyticsView === 'insights' ||
											analyticsView === 'recommendations' ||
											analyticsView === 'trends' ||
											analyticsView === 'comparison') && (
											<Card
												variant={CardVariant.TRANSPARENT}
												padding={Spacing.LG}
												className='rounded-lg border border-blue-400/30'
											>
												<h3 className='text-xl font-bold text-white mb-4 capitalize'>{analyticsView}</h3>
												<div className='text-slate-300 text-center py-8'>
													{analyticsView === 'progress' && userProgress.isLoading && 'Loading progress...'}
													{analyticsView === 'progress' && userProgress.error && `Error: ${userProgress.error.message}`}
													{analyticsView === 'progress' && userProgress.data && (
														<div>Progress data loaded ({userProgress.data.data?.topics?.length ?? 0} topics)</div>
													)}
													{analyticsView === 'insights' && userInsights.isLoading && 'Loading insights...'}
													{analyticsView === 'insights' && userInsights.error && `Error: ${userInsights.error.message}`}
													{analyticsView === 'insights' && userInsights.data && 'Insights data loaded'}
													{analyticsView === 'recommendations' &&
														userRecommendations.isLoading &&
														'Loading recommendations...'}
													{analyticsView === 'recommendations' &&
														userRecommendations.error &&
														`Error: ${userRecommendations.error.message}`}
													{analyticsView === 'recommendations' &&
														userRecommendations.data &&
														`${userRecommendations.data.data?.length ?? 0} recommendations`}
													{analyticsView === 'trends' && userTrends.isLoading && 'Loading trends...'}
													{analyticsView === 'trends' && userTrends.error && `Error: ${userTrends.error.message}`}
													{analyticsView === 'trends' &&
														userTrends.data &&
														`${userTrends.data.data?.length ?? 0} trend points`}
													{analyticsView === 'comparison' && userComparison.isLoading && 'Loading comparison...'}
													{analyticsView === 'comparison' &&
														userComparison.error &&
														`Error: ${userComparison.error.message}`}
													{analyticsView === 'comparison' && userComparison.data && 'Comparison data loaded'}
												</div>
											</Card>
										)}
									</div>
								) : (
									<Card
										variant={CardVariant.TRANSPARENT}
										padding={Spacing.LG}
										className='rounded-lg border border-slate-400/30'
									>
										<div className='text-slate-400 text-center py-8'>Enter a user ID above to view their analytics</div>
									</Card>
								)}
							</div>
						</motion.section>
					)}

					{/* Settings */}
					{activeTab === 'settings' && (
						<motion.section
							aria-label='System Settings'
							variants={scaleIn}
							initial='hidden'
							animate='visible'
							transition={{ delay: 0.6 }}
							whileHover={{ scale: 1.02 }}
						>
							<div className='glass-strong rounded-lg p-8'>
								<h2 className='text-2xl font-bold text-white mb-6'>System Settings</h2>
								<div className='space-y-6'>
									<div className='bg-slate-500/10 border border-slate-400/30 rounded-lg p-4'>
										<h3 className='text-lg font-semibold text-white mb-3'>Maintenance Mode</h3>
										<Button
											variant={ButtonVariant.SECONDARY}
											className='bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-400/30'
										>
											Enable Maintenance Mode
										</Button>
									</div>
									<Card variant={CardVariant.GLASS} padding={Spacing.LG} className='rounded-lg'>
										<h3 className='text-lg font-semibold text-white mb-3'>System Health</h3>
										<GridLayout variant='balanced' gap={Spacing.MD}>
											<div className='flex justify-between items-center'>
												<span className='text-slate-300'>Database</span>
												<span className='text-green-400 flex items-center gap-2'>
													<Icon name='check' size={ComponentSize.SM} className='text-green-400' />
													Healthy
												</span>
											</div>
											<div className='flex justify-between items-center'>
												<span className='text-slate-300'>Redis Cache</span>
												<span className='text-green-400 flex items-center gap-2'>
													<Icon name='check' size={ComponentSize.SM} className='text-green-400' />
													Healthy
												</span>
											</div>
											<div className='flex justify-between items-center'>
												<span className='text-slate-300'>API Services</span>
												<span className='text-green-400 flex items-center gap-2'>
													<Icon name='check' size={ComponentSize.SM} className='text-green-400' />
													Healthy
												</span>
											</div>
											<div className='flex justify-between items-center'>
												<span className='text-slate-300'>File Storage</span>
												<span className='text-green-400 flex items-center gap-2'>
													<Icon name='check' size={ComponentSize.SM} className='text-green-400' />
													Healthy
												</span>
											</div>
										</GridLayout>
									</Card>
								</div>
							</div>
						</motion.section>
					)}
				</Card>
			</Container>

			{/* Confirm Modal */}
			<ConfirmModal
				open={confirmModal.open}
				onClose={() => setConfirmModal(prev => ({ ...prev, open: false }))}
				onConfirm={confirmModal.onConfirm}
				title='Delete User'
				message={`Are you sure you want to delete user ${confirmModal.userId}? This action cannot be undone.`}
				confirmText='Delete'
				cancelText='Cancel'
				variant={AlertVariant.ERROR}
			/>
		</main>
	);
}
