import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';

import { motion } from 'framer-motion';
import { LogOut, User } from 'lucide-react';

import {
	Avatar,
	AvatarFallback,
	AvatarImage,
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	NavLink,
} from '@/components';
import { AudioControls } from '@/components/audio';
import { CreditBalance } from '@/components/layout';
import { ButtonSize } from '@/constants';
import { useAppDispatch } from '@/hooks';
import { setAuthenticated, setUser } from '@/redux/slices';
import { authService } from '@/services';
import type { RootState } from '@/types';

export function Navigation() {
	const navigate = useNavigate();
	const location = useLocation();
	const dispatch = useAppDispatch();

	const { isAuthenticated, currentUser } = useSelector((state: RootState) => state.user);

	const publicNavItems = [
		{ to: '/', label: 'Home' },
		{ to: '/leaderboard', label: 'Leaderboard' },
	];

	const handleSignIn = () => {
		navigate('/login', { state: { modal: true, returnUrl: location.pathname } });
	};

	const handleLogout = async () => {
		try {
			await authService.logout();
			dispatch(setAuthenticated(false));
			dispatch(setUser(null));
			navigate('/');
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
						<NavLink to='/' className='flex items-center gap-2 text-2xl font-bold text-foreground'>
							<img src='/assets/logo.svg' alt='EveryTriv Logo' className='w-8 h-8' loading='lazy' />
							EveryTriv
						</NavLink>

						{/* Navigation Links */}
						{publicNavItems.map(item => (
							<NavLink
								key={item.to}
								to={item.to}
								className='text-sm font-medium text-muted-foreground hover:text-foreground transition-colors'
								activeClassName='text-foreground'
							>
								{item.label}
							</NavLink>
						))}
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
									<Button variant='ghost' className='relative h-9 w-9 rounded-full'>
										<Avatar className='h-9 w-9'>
											<AvatarImage src='' alt='User' />
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
									<DropdownMenuItem onClick={() => navigate('/profile')}>
										<User className='mr-2 h-4 w-4' />
										Profile
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem onClick={handleLogout} className='text-destructive'>
										<LogOut className='mr-2 h-4 w-4' />
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
