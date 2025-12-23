import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';

import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BarChart3, LogOut, Shield, User } from 'lucide-react';

import { UserRole } from '@shared/constants';

import { ButtonSize, ButtonVariant, NAVIGATION_LINKS, ROUTES } from '@/constants';

import {
	AudioControls,
	Avatar,
	AvatarFallback,
	AvatarImage,
	Button,
	CreditBalance,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	NavLink,
} from '@/components';

import { useAppDispatch, useAppSelector } from '@/hooks';

import { authService } from '@/services';

import type { NavigationLink, RootState } from '@/types';

import { getAvatarUrl } from '@/utils';

import { selectUserRole } from '@/redux/selectors';
import { setAuthenticated, setUser } from '@/redux/slices';

export function Navigation() {
	const navigate = useNavigate();
	const location = useLocation();
	const dispatch = useAppDispatch();
	const queryClient = useQueryClient();

	const { isAuthenticated, currentUser, avatar } = useSelector((state: RootState) => state.user);
	const userRole = useAppSelector(selectUserRole);
	const isAdmin = userRole === UserRole.ADMIN;

	const publicNavItems = [{ to: ROUTES.STATISTICS, label: 'Statistics' }];

	const adminNavItems = isAdmin ? NAVIGATION_LINKS.admin : [];

	const handleSignIn = () => {
		navigate(ROUTES.LOGIN, { state: { modal: true, returnUrl: location.pathname } });
	};

	const handleLogout = async () => {
		try {
			// authService.logout() clears all auth data, localStorage, and Redux Persist
			await authService.logout();
			// Clear React Query cache to remove all user-specific cached data
			queryClient.clear();
			// Clear Redux state
			dispatch(setAuthenticated(false));
			dispatch(setUser(null));
			navigate(ROUTES.HOME);
		} catch (error) {
			// Error already logged in auth.service.ts - no need to log again
			void error;
		}
	};

	const getUserInitials = () => {
		if (currentUser?.email) {
			return currentUser.email.charAt(0).toUpperCase();
		}
		return 'U';
	};

	return (
		<motion.nav
			initial={{ y: -20, opacity: 0 }}
			animate={{ y: 0, opacity: 1 }}
			className='sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'
		>
			<div className='container mx-auto px-4'>
				<div className='flex h-16 items-center justify-between'>
					<div className='flex items-center gap-6'>
						<NavLink to={ROUTES.HOME} className='flex items-center gap-2 text-2xl font-bold text-foreground'>
							<img
								src='/assets/logo.svg'
								alt='EveryTriv Logo'
								className='h-8 w-8 flex-shrink-0 object-contain'
								width={32}
								height={32}
							/>
							EveryTriv
						</NavLink>

						{/* Navigation Links */}
						{publicNavItems.map(item => (
							<NavLink
								key={item.to}
								to={item.to}
								className='text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1'
								activeClassName='text-foreground'
							>
								<BarChart3 className='h-4 w-4' />
								{item.label}
							</NavLink>
						))}
						{adminNavItems.length > 0 && (
							<>
								<div className='h-4 w-px bg-border' />
								{adminNavItems.map((item: NavigationLink) => (
									<NavLink
										key={item.path}
										to={item.path}
										className='text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1'
										activeClassName='text-foreground'
									>
										<Shield className='h-4 w-4' />
										{item.label}
									</NavLink>
								))}
							</>
						)}
					</div>

					{/* Right Side Actions */}
					<div className='flex items-center gap-5'>
						{/* Audio Controls */}
						<AudioControls />

						{/* Statistics Link */}
						<NavLink
							to={ROUTES.STATISTICS}
							className='text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 px-2 py-1.5 rounded-md hover:bg-accent'
							activeClassName='text-foreground bg-accent'
						>
							<BarChart3 className='h-4 w-4' />
							<span className='hidden sm:inline'>Statistics</span>
						</NavLink>

						{/* Credits Display */}
						{isAuthenticated && <CreditBalance />}

						{isAuthenticated ? (
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant={ButtonVariant.GHOST} className='relative h-9 w-9 rounded-full'>
										<Avatar className='h-9 w-9'>
											<AvatarImage src={getAvatarUrl(avatar)} alt='User' />
											<AvatarFallback>{getUserInitials()}</AvatarFallback>
										</Avatar>
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align='end' className='w-56'>
									<div className='flex items-center justify-start gap-2 p-2'>
										<div className='flex flex-col space-y-1 leading-none'>
											<p className='font-medium'>{currentUser?.email}</p>
										</div>
									</div>
									<DropdownMenuSeparator />
									<DropdownMenuItem onClick={() => navigate(ROUTES.PROFILE)} className='gap-1'>
										<User className='h-4 w-4' />
										Profile
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem onClick={handleLogout} className='text-destructive gap-1'>
										<LogOut className='h-4 w-4' />
										Sign Out
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						) : (
							<Button size={ButtonSize.SM} onClick={handleSignIn}>
								Sign In
							</Button>
						)}
					</div>
				</div>
			</div>
		</motion.nav>
	);
}
