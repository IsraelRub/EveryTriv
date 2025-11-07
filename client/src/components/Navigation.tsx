import { createContext, memo, useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { AnimatePresence, motion } from 'framer-motion';

import { APP_NAME, NAVIGATION_LINKS, type NavigationLink } from '@shared/constants';

import { useAudio } from '../App';
import { AudioKey, ButtonVariant, ComponentSize } from '../constants';
import { usePointBalance } from '../hooks';
import type { RootState } from '../types';
import { combineClassNames, formatScore, formatUsername } from '../utils';
import { fadeInDown, fadeInLeft, hoverScale } from './animations';
import AudioControls from './AudioControls';
import { Icon } from './IconLibrary';
import { Avatar, Button } from './ui';

// Navigation Context for sharing navigation state
const NavigationContext = createContext<{
	isMenuOpen: boolean;
	setIsMenuOpen: (open: boolean) => void;
	handleMenuToggle: () => void;
	handleLogout: () => void;
	handleGoogleLogin: () => void;
	handleSignUp: () => void;
	handleGetMorePoints: () => void;
} | null>(null);

// Custom hook to use navigation context

const Navigation = memo(function Navigation() {
	const audioService = useAudio();
	const location = useLocation();
	const navigate = useNavigate();
	const {
		currentUser,
		isAuthenticated,
		username: stateUsername,
		avatar: stateAvatar,
	} = useSelector((state: RootState) => state.user);
	const { data: pointsData } = usePointBalance();

	const [isMenuOpen, setIsMenuOpen] = useState(false);

	// Memoize navigation items to avoid recalculation
	const navigationItems = useMemo(() => {
		return NAVIGATION_LINKS.main.map(link => ({
			...link,
			isActive: location.pathname === link.path,
		}));
	}, [location.pathname]);

	// Memoize user display data
	const userDisplayData = useMemo(() => {
		if (!currentUser) return null;
		const displayUsername = stateUsername || currentUser.username || '';
		return {
			username: formatUsername(displayUsername),
			fullName: displayUsername,
			avatar: stateAvatar || undefined,
			firstName: '',
			lastName: '',
		};
	}, [currentUser, stateUsername, stateAvatar]);

	// Memoize points display
	const pointsDisplay = useMemo(() => {
		return pointsData?.balance ? formatScore(pointsData.balance) : '0';
	}, [pointsData]);

	const handleLogout = useCallback(() => {
		// TODO: Implement logout functionality
		// logoutMutation.mutate();
		audioService.play(AudioKey.PAGE_CHANGE);
		navigate('/');
		setIsMenuOpen(false);
	}, [navigate]);

	const handleGoogleLogin = useCallback(() => {
		audioService.play(AudioKey.PAGE_CHANGE);
		// Google login not implemented
	}, []);

	const handleSignUp = useCallback(() => {
		audioService.play(AudioKey.PAGE_CHANGE);
		navigate('/register');
		setIsMenuOpen(false);
	}, [navigate]);

	const handleGetMorePoints = useCallback(() => {
		navigate('/payment');
		setIsMenuOpen(false);
	}, [navigate]);

	const handleMenuToggle = useCallback(() => {
		setIsMenuOpen(prev => !prev);
	}, []);

	const isHomePage = location.pathname === '/';

	// Memoize menu items
	const menuItems = useMemo(() => {
		const items: NavigationLink[] = [
			...NAVIGATION_LINKS.main,
			...(isAuthenticated ? NAVIGATION_LINKS.authenticated : []),
		];

		// Add admin links if user is admin
		if (isAuthenticated && currentUser?.role === 'admin') {
			items.push(...NAVIGATION_LINKS.admin);
		}

		return items;
	}, [isAuthenticated, currentUser?.role]);

	const navigationContextValue = {
		isMenuOpen,
		setIsMenuOpen,
		handleMenuToggle,
		handleLogout,
		handleGoogleLogin,
		handleSignUp,
		handleGetMorePoints,
	};

	return (
		<NavigationContext.Provider value={navigationContextValue}>
			<nav
				role='navigation'
				aria-label='Main navigation'
				className='fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-xl border-b border-white/10 shadow-2xl'
			>
				<div className='w-full px-4 sm:px-6 lg:px-8 xl:px-12'>
					<div className='flex justify-between items-center h-14'>
						{/* Logo Section */}
						<section aria-label='Logo and Brand' className='flex items-center flex-shrink-0'>
							{!isHomePage ? (
								<Link to='/' className='flex items-center space-x-4 hover:opacity-80 transition-all duration-300 group'>
									<div className='w-12 h-12 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-2xl group-hover:scale-110 transition-all duration-300'>
										<Icon name='brain' size={ComponentSize.LG} className='text-white' />
									</div>
									<span className='text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent'>
										{APP_NAME}
									</span>
								</Link>
							) : (
								<div className='flex items-center space-x-4'>
									<div className='w-12 h-12 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg'>
										<Icon name='brain' size={ComponentSize.LG} className='text-white' />
									</div>
									<span className='text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent opacity-90'>
										{APP_NAME}
									</span>
								</div>
							)}
						</section>

						{/* Desktop Navigation */}
						<section aria-label='Desktop Navigation' className='hidden lg:flex items-center space-x-8'>
							{/* Navigation Items */}
							<div className='flex items-center space-x-6'>
								{navigationItems.map((item, index) => (
									<motion.div
										key={item.path}
										variants={fadeInLeft}
										initial='hidden'
										animate='visible'
										transition={{ delay: index * 0.1 }}
									>
										<motion.div variants={hoverScale} initial='normal' whileHover='hover'>
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
										</motion.div>
									</motion.div>
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
										<Icon name='zap' size={ComponentSize.SM} className='text-yellow-400' />
										<span className='text-white font-semibold text-sm'>{pointsData?.totalPoints ?? 0}</span>
										<span className='text-slate-300 text-xs'>Points</span>
									</div>

									{/* Free Questions (if available) */}
									{pointsData && pointsData.freeQuestions > 0 && (
										<div className='flex items-center space-x-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-md border border-green-500/30 px-4 py-2 rounded-xl shadow-lg shadow-green-500/20'>
											<span className='text-green-400 text-sm font-medium'>Free:</span>
											<span className='text-green-300 font-semibold'>{pointsData.freeQuestions}</span>

											<Icon name='clock' size={ComponentSize.SM} className='text-green-400' />
											{pointsData.nextResetTime && (
												<div className='text-xs text-green-200/80'>
													{new Date(pointsData.nextResetTime).toLocaleTimeString()}
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
										<Avatar
											src={userDisplayData?.avatar}
											username={userDisplayData?.username}
											fullName={userDisplayData?.fullName}
											firstName={userDisplayData?.firstName}
											lastName={userDisplayData?.lastName}
											size={ComponentSize.SM}
											alt={userDisplayData?.username}
										/>
										<span className='text-white font-medium text-sm'>{userDisplayData?.username}</span>
									</div>
									<Button
										variant={ButtonVariant.GHOST}
										size={ComponentSize.SM}
										onClick={handleLogout}
										className='text-slate-300 hover:text-white hover:bg-white/10 backdrop-blur-md border border-white/10 hover:border-white/30 rounded-xl px-4 py-2 transition-all duration-300'
									>
										Logout
									</Button>
								</div>
							) : (
								<div className='flex items-center space-x-4'>
									<Button
										variant={ButtonVariant.GHOST}
										size={ComponentSize.SM}
										onClick={handleSignUp}
										className='text-slate-300 hover:text-white border border-white/20 hover:border-white/40 hover:bg-white/10 backdrop-blur-md rounded-xl px-4 py-2 transition-all duration-300'
									>
										Sign Up
									</Button>
									<Button
										variant={ButtonVariant.PRIMARY}
										size={ComponentSize.SM}
										onClick={handleGoogleLogin}
										className='bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0 rounded-xl px-6 py-2 font-medium shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300'
									>
										Sign In
									</Button>
								</div>
							)}
						</section>

						{/* Mobile menu button */}
						<section aria-label='Mobile Menu Toggle' className='lg:hidden'>
							<button
								onClick={handleMenuToggle}
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
						</section>
					</div>

					{/* Mobile Navigation */}
					<AnimatePresence>
						{isMenuOpen && (
							<aside role='complementary' aria-label='Mobile Navigation Menu'>
								<motion.div
									variants={fadeInDown}
									initial='hidden'
									animate='visible'
									className='lg:hidden border-t border-white/10 bg-black/20 backdrop-blur-xl'
								>
									<div className='px-4 pt-3 pb-4 space-y-3'>
										{/* Credits Display */}
										{isAuthenticated && (
											<div className='space-y-2 mb-4'>
												{/* Total Points */}
												<div className='flex items-center justify-center space-x-2 bg-gradient-to-r from-slate-800/60 to-slate-700/60 backdrop-blur-md px-3 py-2 rounded-lg border border-white/10 shadow-lg'>
													<Icon name='zap' size={ComponentSize.SM} className='text-yellow-400' />
													<span className='text-white font-semibold text-sm'>{pointsDisplay}</span>
													<span className='text-slate-300 text-xs'>Points</span>
												</div>

												{/* Free Questions Status */}
												{pointsData && pointsData.freeQuestions > 0 ? (
													<div className='flex items-center justify-center space-x-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-md border border-green-500/30 px-4 py-3 rounded-xl shadow-lg shadow-green-500/20'>
														<span className='text-green-400 text-sm font-medium'>Free: {pointsData.freeQuestions}</span>
														<Icon name='clock' size={ComponentSize.SM} className='text-green-400' />
														{pointsData.nextResetTime && (
															<div className='text-xs text-green-200/80'>
																{new Date(pointsData.nextResetTime).toLocaleTimeString()}
															</div>
														)}
													</div>
												) : (
													<div className='text-center px-4 py-3 bg-slate-800/40 backdrop-blur-md rounded-xl border border-white/10'>
														<span className='text-slate-300 text-sm'>No free questions left</span>
														<br />
														<button
															onClick={handleGetMorePoints}
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
											{menuItems.map(item => (
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
													<Avatar
														src={stateAvatar}
														username={stateUsername || currentUser?.username || ''}
														fullName={stateUsername || currentUser?.username || ''}
														firstName={''}
														lastName={''}
														size={ComponentSize.SM}
														alt={stateUsername || currentUser?.username || ''}
													/>
													<span className='text-white font-medium'>{stateUsername || currentUser?.username}</span>
												</div>
												<Button
													variant={ButtonVariant.GHOST}
													onClick={handleLogout}
													className='w-full text-slate-300 hover:text-white hover:bg-white/10 backdrop-blur-md border border-white/10 hover:border-white/30 rounded-xl py-3 transition-all duration-300'
												>
													Logout
												</Button>
											</div>
										) : (
											<div className='pt-6 border-t border-white/10 space-y-3'>
												<Button
													variant={ButtonVariant.GHOST}
													onClick={handleSignUp}
													className='w-full text-slate-300 hover:text-white border border-white/20 hover:border-white/40 hover:bg-white/10 backdrop-blur-md rounded-xl py-3 transition-all duration-300'
												>
													Sign Up
												</Button>
												<Button
													variant={ButtonVariant.PRIMARY}
													onClick={handleGoogleLogin}
													className='w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0 rounded-xl py-3 font-medium shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300'
												>
													Sign In with Google
												</Button>
											</div>
										)}
									</div>
								</motion.div>
							</aside>
						)}
					</AnimatePresence>
				</div>
			</nav>
		</NavigationContext.Provider>
	);
});

export default Navigation;
