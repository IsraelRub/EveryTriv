import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { LogOut, Shield, User } from 'lucide-react';

import { APP_NAME, UserRole } from '@shared/constants';
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
	ProfileEditDialog,
} from '@/components';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { authService } from '@/services';
import type { NavigationLink, RootState } from '@/types';
import { getAvatarUrl, getUserInitials } from '@/utils';
import { selectUserRole } from '@/redux/selectors';
import { setUser } from '@/redux/slices';

export function Navigation() {
	const navigate = useNavigate();
	const location = useLocation();
	const dispatch = useAppDispatch();
	const queryClient = useQueryClient();

	const { isAuthenticated, currentUser, avatar } = useSelector((state: RootState) => state.user);
	const userRole = useAppSelector(selectUserRole);
	const isAdmin = userRole === UserRole.ADMIN;
	const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);

	const mainNavItems = NAVIGATION_LINKS.main;
	const authenticatedNavItems = isAuthenticated ? NAVIGATION_LINKS.authenticated : [];
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
			// setUser(null) already sets isAuthenticated = false
			dispatch(setUser(null));
			navigate(ROUTES.HOME);
		} catch (error) {
			// Error already logged in auth.service.ts - no need to log again
			void error;
		}
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
								alt={`${APP_NAME} Logo`}
								className='h-8 w-8 flex-shrink-0 object-contain'
								width={32}
								height={32}
							/>
							{APP_NAME}
						</NavLink>

						{/* Main Navigation Links */}
						{mainNavItems.length > 0 && (
							<>
								<div className='h-4 w-px bg-border' />
								{mainNavItems.map((item: NavigationLink) => (
									<NavLink
										key={item.path}
										to={item.path}
										className='text-sm font-medium text-muted-foreground hover:text-foreground transition-colors'
										activeClassName='text-foreground'
									>
										{item.label}
									</NavLink>
								))}
							</>
						)}

						{/* Authenticated Navigation Links */}
						{authenticatedNavItems.length > 0 && (
							<>
								<div className='h-4 w-px bg-border' />
								{authenticatedNavItems.map((item: NavigationLink) => (
									<NavLink
										key={item.path}
										to={item.path}
										className='text-sm font-medium text-muted-foreground hover:text-foreground transition-colors'
										activeClassName='text-foreground'
									>
										{item.label}
									</NavLink>
								))}
							</>
						)}

						{/* Admin Navigation Links */}
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

						{/* Credits Display */}
						{isAuthenticated && <CreditBalance />}

						{isAuthenticated ? (
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant={ButtonVariant.GHOST} className='relative h-9 w-9 rounded-full'>
										<Avatar className='h-9 w-9'>
											<AvatarImage src={getAvatarUrl(avatar)} alt='User' />
											<AvatarFallback>
												{getUserInitials(currentUser?.firstName, currentUser?.lastName, currentUser?.email)}
											</AvatarFallback>
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
									<DropdownMenuItem onClick={() => setIsProfileDialogOpen(true)} className='gap-1'>
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

			{/* Profile Edit Dialog */}
			<ProfileEditDialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen} />
		</motion.nav>
	);
}
