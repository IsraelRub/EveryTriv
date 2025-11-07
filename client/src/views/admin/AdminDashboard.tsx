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
	createStaggerContainer,
	fadeInUp,
	FeatureErrorBoundary,
	GridLayout,
	scaleIn,
} from '../../components';
import { AlertVariant, ButtonVariant, CardVariant, ContainerSize, Spacing } from '../../constants';
import { useDeleteUser, useGetUserById, useUpdateUserCredits, useUpdateUserStatus } from '../../hooks';

export default function AdminDashboard() {
	return (
		<FeatureErrorBoundary featureName='Admin Dashboard'>
			<AdminDashboardContent />
		</FeatureErrorBoundary>
	);
}

function AdminDashboardContent() {
	const [activeTab, setActiveTab] = useState<'users' | 'analytics' | 'settings'>('users');
	const [selectedUserId, setSelectedUserId] = useState('');
	const [creditsAmount, setCreditsAmount] = useState(0);
	const [creditsReason, setCreditsReason] = useState('');
	const [userStatus, setUserStatus] = useState<'active' | 'suspended' | 'banned'>('active');
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
						<h1 className='text-4xl md:text-5xl font-bold text-white mb-4 gradient-text'>Admin Dashboard</h1>
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
							{(['users', 'analytics', 'settings'] as const).map(tab => (
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
														onChange={e => setUserStatus(e.target.value as 'active' | 'suspended' | 'banned')}
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
								<h2 className='text-2xl font-bold text-white mb-6'>System Analytics</h2>
								<motion.div variants={createStaggerContainer(0.1)} initial='hidden' animate='visible'>
									<GridLayout variant='balanced' gap={Spacing.LG}>
										<motion.div variants={fadeInUp}>
											<Card
												variant={CardVariant.TRANSPARENT}
												padding={Spacing.LG}
												className='rounded-lg border border-green-400/30 bg-green-500/10 text-center'
											>
												<div className='text-3xl font-bold text-green-400 mb-2'>1,234</div>
												<div className='text-slate-300'>Total Users</div>
											</Card>
										</motion.div>
										<motion.div variants={fadeInUp}>
											<Card
												variant={CardVariant.TRANSPARENT}
												padding={Spacing.LG}
												className='rounded-lg border border-blue-400/30 bg-blue-500/10 text-center'
											>
												<div className='text-3xl font-bold text-blue-400 mb-2'>5,678</div>
												<div className='text-slate-300'>Games Played Today</div>
											</Card>
										</motion.div>
										<motion.div variants={fadeInUp}>
											<Card
												variant={CardVariant.TRANSPARENT}
												padding={Spacing.LG}
												className='rounded-lg border border-purple-400/30 bg-purple-500/10 text-center'
											>
												<div className='text-3xl font-bold text-purple-400 mb-2'>89%</div>
												<div className='text-slate-300'>System Uptime</div>
											</Card>
										</motion.div>
									</GridLayout>
								</motion.div>
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
												<span className='text-green-400'>✓ Healthy</span>
											</div>
											<div className='flex justify-between items-center'>
												<span className='text-slate-300'>Redis Cache</span>
												<span className='text-green-400'>✓ Healthy</span>
											</div>
											<div className='flex justify-between items-center'>
												<span className='text-slate-300'>API Services</span>
												<span className='text-green-400'>✓ Healthy</span>
											</div>
											<div className='flex justify-between items-center'>
												<span className='text-slate-300'>File Storage</span>
												<span className='text-green-400'>✓ Healthy</span>
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
