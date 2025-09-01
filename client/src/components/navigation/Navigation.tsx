import { formatScore, formatUsername } from 'everytriv-shared/utils';
import { AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { APP_NAME, NAVIGATION_LINKS } from '../../constants';
import { usePointsBusiness } from '../../hooks';
import { logout } from '../../redux/features';
import { authService } from '../../services';
import type { RootState } from '../../types/redux.types';
import { combineClassNames } from '../../utils/combineClassNames';
import { FadeInDown, FadeInLeft, HoverScale } from '../animations';
import { AudioControls } from '../audio';
import { Icon } from '../icons';
import { Button } from '../ui';

export default function Navigation() {
	const location = useLocation();
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const { user, isAuthenticated } = useSelector((state: RootState) => state.user);
	const { pointBalance } = usePointsBusiness();
	const [isMenuOpen, setIsMenuOpen] = useState(false);

	const handleLogout = () => {
		authService.logout();
		dispatch(logout());
		navigate('/');
		setIsMenuOpen(false);
	};

	const handleGoogleLogin = () => {
		authService.initiateGoogleLogin();
	};

	const isHomePage = location.pathname === '/';

	const menuItems = [...NAVIGATION_LINKS.main, ...(isAuthenticated ? NAVIGATION_LINKS.authenticated : [])];

	return (
		<nav className='fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-xl border-b border-white/10 shadow-2xl'>
			<div className='w-full px-4 sm:px-6 lg:px-8 xl:px-12'>
				<div className='flex justify-between items-center h-20'>
					{/* Logo Section */}
					<div className='flex items-center flex-shrink-0'>
						{!isHomePage ? (
							<Link to='/' className='flex items-center space-x-4 hover:opacity-80 transition-all duration-300 group'>
								<div className='w-12 h-12 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-2xl group-hover:scale-110 transition-all duration-300'>
									<Icon name='brain' size='lg' className='text-white' />
								</div>
								<span className='text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent'>
									{APP_NAME}
								</span>
							</Link>
						) : (
							<div className='flex items-center space-x-4'>
								<div className='w-12 h-12 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg'>
									<Icon name='brain' size='lg' className='text-white' />
								</div>
								<span className='text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent opacity-90'>
									{APP_NAME}
								</span>
							</div>
						)}
					</div>

					{/* Desktop Navigation */}
					<div className='hidden lg:flex items-center space-x-8'>
						{/* Navigation Items */}
						<div className='flex items-center space-x-6'>
							{menuItems.map((item, index) => (
								<FadeInLeft key={item.path} delay={index * 0.1}>
									<HoverScale>
										<Link
											to={item.path}
											className={combineClassNames(
												'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 backdrop-blur-sm',
												location.pathname === item.path
													? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border border-blue-500/30 shadow-lg shadow-blue-500/20'
													: 'text-slate-300 hover:text-white hover:bg-white/10 hover:backdrop-blur-md border border-transparent hover:border-white/20'
											)}
										>
											{item.label}
										</Link>
									</HoverScale>
								</FadeInLeft>
							))}
						</div>

						{/* Audio Controls */}
						<div className='flex items-center space-x-4'>
							<div className='bg-gradient-to-r from-slate-800/60 to-slate-700/60 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10 shadow-lg'>
								<AudioControls className='text-white' />
							</div>
						</div>

						{/* Credits Display */}
						{isAuthenticated && (
							<div className='flex items-center space-x-4'>
								{/* Total Points */}
								<div className='flex items-center space-x-3 bg-gradient-to-r from-slate-800/60 to-slate-700/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 shadow-lg'>
									<Icon name='zap' size='sm' className='text-yellow-400' />
									<span className='text-white font-semibold text-sm'>{pointBalance?.total_points || 0}</span>
									<span className='text-slate-300 text-xs'>Points</span>
								</div>

								{/* Free Questions (if available) */}
								{pointBalance && pointBalance.free_questions > 0 && (
									<div className='flex items-center space-x-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-md border border-green-500/30 px-4 py-2 rounded-xl shadow-lg shadow-green-500/20'>
										<span className='text-green-400 text-sm font-medium'>Free:</span>
										<span className='text-green-300 font-semibold'>{pointBalance.free_questions}</span>
										
										<Icon name='clock' size='sm' className='text-green-400' />
										{pointBalance.next_reset_time && (
											<div className='text-xs text-green-200/80'>
												{new Date(pointBalance.next_reset_time).toLocaleTimeString()}
											</div>
										)}
									</div>
								)}
							</div>
						)}

						{/* Auth Buttons */}
						{isAuthenticated ? (
							<div className='flex items-center space-x-4'>
								<div className='flex items-center space-x-3 bg-gradient-to-r from-slate-800/60 to-slate-700/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 shadow-lg'>
									{user?.avatar && (
										<img
											src={user.avatar}
											alt={user.username}
											className='h-8 w-8 rounded-full border border-white/20'
										/>
									)}
									<span className='text-white font-medium text-sm'>{formatUsername(user?.username || '')}</span>
								</div>
								<Button
									variant='ghost'
									size='sm'
									onClick={handleLogout}
									className='text-slate-300 hover:text-white hover:bg-white/10 backdrop-blur-md border border-white/10 hover:border-white/30 rounded-xl px-4 py-2 transition-all duration-300'
								>
									Logout
								</Button>
							</div>
						) : (
							<div className='flex items-center space-x-4'>
								<Button
									variant='ghost'
									size='sm'
									onClick={() => navigate('/register')}
									className='text-slate-300 hover:text-white border border-white/20 hover:border-white/40 hover:bg-white/10 backdrop-blur-md rounded-xl px-4 py-2 transition-all duration-300'
								>
									Sign Up
								</Button>
								<Button
									variant='primary'
									size='sm'
									onClick={handleGoogleLogin}
									className='bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0 rounded-xl px-6 py-2 font-medium shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300'
								>
									Sign In
								</Button>
							</div>
						)}
					</div>

					{/* Mobile menu button */}
					<div className='lg:hidden'>
						<button
							onClick={() => setIsMenuOpen(!isMenuOpen)}
							className='text-slate-300 hover:text-white focus:outline-none focus:text-white bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3 transition-all duration-300 hover:bg-white/20'
						>
							<svg className='h-6 w-6' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
								{isMenuOpen ? (
									<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
								) : (
									<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 6h16M4 12h16M4 18h16' />
								)}
							</svg>
						</button>
					</div>
				</div>

				{/* Mobile Navigation */}
				<AnimatePresence>
					{isMenuOpen && (
						<FadeInDown className='lg:hidden border-t border-white/10 bg-black/20 backdrop-blur-xl'>
							<div className='px-4 pt-4 pb-6 space-y-4'>
								{/* Credits Display */}
								{isAuthenticated && (
									<div className='space-y-3 mb-6'>
										{/* Total Points */}
										<div className='flex items-center justify-center space-x-3 bg-gradient-to-r from-slate-800/60 to-slate-700/60 backdrop-blur-md px-4 py-3 rounded-xl border border-white/10 shadow-lg'>
											<Icon name='zap' size='sm' className='text-yellow-400' />
											<span className='text-white font-semibold'>{formatScore(pointBalance?.total_points || 0)}</span>
											<span className='text-slate-300 text-sm'>Points</span>
										</div>

										{/* Free Questions Status */}
										{pointBalance && pointBalance.free_questions > 0 ? (
											<div className='flex items-center justify-center space-x-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-md border border-green-500/30 px-4 py-3 rounded-xl shadow-lg shadow-green-500/20'>
												<span className='text-green-400 text-sm font-medium'>Free: {pointBalance.free_questions}</span>
												<Icon name='clock' size='sm' className='text-green-400' />
												{pointBalance.next_reset_time && (
													<div className='text-xs text-green-200/80'>
														{new Date(pointBalance.next_reset_time).toLocaleTimeString()}
													</div>
												)}
											</div>
										) : (
											<div className='text-center px-4 py-3 bg-slate-800/40 backdrop-blur-md rounded-xl border border-white/10'>
												<span className='text-slate-300 text-sm'>No free questions left</span>
												<br />
												<button
													onClick={() => {
														navigate('/payment');
														setIsMenuOpen(false);
													}}
													className='text-blue-400 text-sm hover:text-blue-300 mt-2 underline transition-colors'
												>
													Get more points
												</button>
											</div>
										)}
									</div>
								)}

								{/* Navigation Items */}
								<div className='space-y-2'>
									{menuItems.map((item) => (
										<Link
											key={item.path}
											to={item.path}
											onClick={() => setIsMenuOpen(false)}
											className={combineClassNames(
												'block px-4 py-3 rounded-xl text-base font-medium transition-all duration-300 backdrop-blur-sm',
												location.pathname === item.path
													? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border border-blue-500/30 shadow-lg shadow-blue-500/20'
													: 'text-slate-300 hover:text-white hover:bg-white/10 hover:backdrop-blur-md border border-transparent hover:border-white/20'
											)}
										>
											{item.label}
										</Link>
									))}
								</div>

								{/* Auth Section */}
								{isAuthenticated ? (
									<div className='pt-6 border-t border-white/10 space-y-4'>
										<div className='flex items-center space-x-3 px-4 py-3 bg-gradient-to-r from-slate-800/60 to-slate-700/60 backdrop-blur-md rounded-xl border border-white/10 shadow-lg'>
											{user?.avatar && (
												<img
													src={user.avatar}
													alt={user.username}
													className='h-8 w-8 rounded-full border border-white/20'
												/>
											)}
											<span className='text-white font-medium'>{user?.username}</span>
										</div>
										<Button
											variant='ghost'
											onClick={handleLogout}
											className='w-full text-slate-300 hover:text-white hover:bg-white/10 backdrop-blur-md border border-white/10 hover:border-white/30 rounded-xl py-3 transition-all duration-300'
										>
											Logout
										</Button>
									</div>
								) : (
									<div className='pt-6 border-t border-white/10 space-y-3'>
										<Button
											variant='ghost'
											onClick={() => {
												navigate('/register');
												setIsMenuOpen(false);
											}}
											className='w-full text-slate-300 hover:text-white border border-white/20 hover:border-white/40 hover:bg-white/10 backdrop-blur-md rounded-xl py-3 transition-all duration-300'
										>
											Sign Up
										</Button>
										<Button
											variant='primary'
											onClick={handleGoogleLogin}
											className='w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0 rounded-xl py-3 font-medium shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300'
										>
											Sign In with Google
										</Button>
									</div>
								)}
							</div>
						</FadeInDown>
					)}
				</AnimatePresence>
			</div>
		</nav>
	);
}
