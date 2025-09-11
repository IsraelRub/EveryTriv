/**
 * Admin Dashboard
 *
 * @module AdminDashboard
 * @description Admin dashboard for managing users, content, and system settings
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { fadeInUp, scaleIn } from '../../components/animations';
import { Container, Section } from '../../components/layout';
import { Button } from '../../components/ui';
import { useUpdateUserCredits, useUpdateUserStatus, useDeleteUser, useGetUserById } from '../../hooks/api/useAccountManagement';


export default function AdminDashboard() {
	
	
	const [activeTab, setActiveTab] = useState<'users' | 'analytics' | 'settings'>('users');
	const [selectedUserId, setSelectedUserId] = useState('');
	const [creditsAmount, setCreditsAmount] = useState(0);
	const [creditsReason, setCreditsReason] = useState('');
	const [userStatus, setUserStatus] = useState<'active' | 'suspended' | 'banned'>('active');
	
	// Admin hooks
	const updateUserCredits = useUpdateUserCredits();
	const updateUserStatus = useUpdateUserStatus();
	const deleteUser = useDeleteUser();
	const getUserById = useGetUserById();

	const handleUpdateCredits = () => {
		if (!selectedUserId || creditsAmount <= 0) return;
		
		updateUserCredits.mutate({
			userId: selectedUserId,
			amount: creditsAmount,
			reason: creditsReason
		});
	};

	const handleUpdateStatus = () => {
		if (!selectedUserId) return;
		
		updateUserStatus.mutate({
			userId: selectedUserId,
			status: userStatus
		});
	};

	const handleDeleteUser = () => {
		if (!selectedUserId) return;
		
		if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
			deleteUser.mutate(selectedUserId);
		}
	};

	return (
		<Container size='xl' className='min-h-screen flex flex-col items-center justify-start p-4 pt-20'>
			<Section padding='xl' className='w-full space-y-8'>
				{/* Header */}
				<motion.div 
					variants={fadeInUp} 
					initial="hidden" 
					animate="visible" 
					transition={{ delay: 0.2 }}
					className='text-center mb-12'
				>
					<h1 className='text-4xl md:text-5xl font-bold text-white mb-4 gradient-text'>Admin Dashboard</h1>
					<p className='text-xl text-slate-300'>Manage users, content, and system settings</p>
				</motion.div>

				{/* Tabs */}
				<motion.div 
					variants={fadeInUp} 
					initial="hidden" 
					animate="visible" 
					transition={{ delay: 0.4 }}
					className='flex justify-center mb-8'
				>
					<div className='bg-slate-800/60 rounded-lg p-1 border border-white/10'>
						{(['users', 'analytics', 'settings'] as const).map(tab => (
							<button
								key={tab}
								onClick={() => setActiveTab(tab)}
								className={`px-6 py-3 rounded-md text-sm font-medium transition-colors capitalize ${
									activeTab === tab
										? 'bg-blue-500 text-white'
										: 'text-slate-300 hover:text-white'
								}`}
							>
								{tab}
							</button>
						))}
					</div>
				</motion.div>

				{/* Users Management */}
				{activeTab === 'users' && (
					<motion.div 
						variants={scaleIn} 
						initial="hidden" 
						animate="visible" 
						transition={{ delay: 0.6 }}
						whileHover={{ scale: 1.02 }}
					>
						<Section background='glass' padding='lg' className='rounded-lg'>
							<h2 className='text-2xl font-bold text-white mb-6'>User Management</h2>
							
							<div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
								{/* User Search */}
								<div>
									<h3 className='text-lg font-semibold text-white mb-4'>Find User</h3>
									<div className='space-y-4'>
										<div>
											<label className='block text-white font-medium mb-2'>User ID</label>
											<input
												type='text'
												value={selectedUserId}
												onChange={(e) => setSelectedUserId(e.target.value)}
												className='w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500'
												placeholder='Enter user ID'
											/>
										</div>
										<Button
											variant='secondary'
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
										<div className='bg-blue-500/10 border border-blue-400/30 rounded-lg p-4'>
											<h4 className='text-white font-medium mb-3'>Update Credits</h4>
											<div className='space-y-3'>
												<input
													type='number'
													value={creditsAmount}
													onChange={(e) => setCreditsAmount(Number(e.target.value))}
													className='w-full p-2 bg-white/10 border border-white/20 rounded text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500'
													placeholder='Credits amount'
												/>
												<input
													type='text'
													value={creditsReason}
													onChange={(e) => setCreditsReason(e.target.value)}
													className='w-full p-2 bg-white/10 border border-white/20 rounded text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500'
													placeholder='Reason for update'
												/>
												<Button
													variant='secondary'
													onClick={handleUpdateCredits}
													disabled={!selectedUserId || creditsAmount <= 0 || updateUserCredits.isPending}
													className='w-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-400/30'
												>
													{updateUserCredits.isPending ? 'Updating...' : 'Update Credits'}
												</Button>
											</div>
										</div>

										{/* Update Status */}
										<div className='bg-yellow-500/10 border border-yellow-400/30 rounded-lg p-4'>
											<h4 className='text-white font-medium mb-3'>Update Status</h4>
											<div className='space-y-3'>
												<select
													value={userStatus}
													onChange={(e) => setUserStatus(e.target.value as 'active' | 'suspended' | 'banned')}
													className='w-full p-2 bg-white/10 border border-white/20 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
												>
													<option value='active'>Active</option>
													<option value='suspended'>Suspended</option>
													<option value='banned'>Banned</option>
												</select>
												<Button
													variant='secondary'
													onClick={handleUpdateStatus}
													disabled={!selectedUserId || updateUserStatus.isPending}
													className='w-full bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border border-yellow-400/30'
												>
													{updateUserStatus.isPending ? 'Updating...' : 'Update Status'}
												</Button>
											</div>
										</div>

										{/* Delete User */}
										<div className='bg-red-500/10 border border-red-400/30 rounded-lg p-4'>
											<h4 className='text-white font-medium mb-3'>Delete User</h4>
											<Button
												variant='secondary'
												onClick={handleDeleteUser}
												disabled={!selectedUserId || deleteUser.isPending}
												className='w-full bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-400/30'
											>
												{deleteUser.isPending ? 'Deleting...' : 'Delete User'}
											</Button>
										</div>
									</div>
								</div>
							</div>
						</Section>
					</motion.div>
				)}

				{/* Analytics */}
				{activeTab === 'analytics' && (
					<motion.div 
						variants={scaleIn} 
						initial="hidden" 
						animate="visible" 
						transition={{ delay: 0.6 }}
						whileHover={{ scale: 1.02 }}
					>
						<Section background='glass' padding='lg' className='rounded-lg'>
							<h2 className='text-2xl font-bold text-white mb-6'>System Analytics</h2>
							<div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
								<div className='bg-green-500/10 border border-green-400/30 rounded-lg p-4 text-center'>
									<div className='text-3xl font-bold text-green-400 mb-2'>1,234</div>
									<div className='text-slate-300'>Total Users</div>
								</div>
								<div className='bg-blue-500/10 border border-blue-400/30 rounded-lg p-4 text-center'>
									<div className='text-3xl font-bold text-blue-400 mb-2'>5,678</div>
									<div className='text-slate-300'>Games Played Today</div>
								</div>
								<div className='bg-purple-500/10 border border-purple-400/30 rounded-lg p-4 text-center'>
									<div className='text-3xl font-bold text-purple-400 mb-2'>89%</div>
									<div className='text-slate-300'>System Uptime</div>
								</div>
							</div>
						</Section>
					</motion.div>
				)}

				{/* Settings */}
				{activeTab === 'settings' && (
					<motion.div 
						variants={scaleIn} 
						initial="hidden" 
						animate="visible" 
						transition={{ delay: 0.6 }}
						whileHover={{ scale: 1.02 }}
					>
						<Section background='glass' padding='lg' className='rounded-lg'>
							<h2 className='text-2xl font-bold text-white mb-6'>System Settings</h2>
							<div className='space-y-6'>
								<div className='bg-slate-500/10 border border-slate-400/30 rounded-lg p-4'>
									<h3 className='text-lg font-semibold text-white mb-3'>Maintenance Mode</h3>
									<Button
										variant='secondary'
										className='bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-400/30'
									>
										Enable Maintenance Mode
									</Button>
								</div>
								<div className='bg-slate-500/10 border border-slate-400/30 rounded-lg p-4'>
									<h3 className='text-lg font-semibold text-white mb-3'>System Health</h3>
									<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
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
									</div>
								</div>
							</div>
						</Section>
					</motion.div>
				)}
			</Section>
		</Container>
	);
}

