import { Fragment, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BrickWallShield, IdCard, LogOut, Menu } from 'lucide-react';

import { APP_NAME } from '@shared/constants';
import { getDisplayNameFromUserFields, getErrorMessage } from '@shared/utils';

import {
	AvatarSize,
	ButtonSize,
	CommonKey,
	DISPLAY_NAME_FALLBACKS,
	NAVIGATION_LINKS,
	ROUTES,
	VariantBase,
} from '@/constants';
import type { NavigationLink } from '@/types';
import { authService, clientLogger as logger } from '@/services';
import {
	AudioControls,
	Button,
	CreditBalance,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	LanguageSwitcher,
	NavLink,
	ProfileEditDialog,
	UserAvatar,
} from '@/components';
import { useCurrentUserData, useIsAuthenticated, useUserRole } from '@/hooks';

export function Navigation() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const location = useLocation();
	const queryClient = useQueryClient();

	const isAuthenticated = useIsAuthenticated();
	const isLoginPage = location.pathname === ROUTES.LOGIN;
	const isRegisterPage = location.pathname === ROUTES.REGISTER;
	const currentUser = useCurrentUserData();
	const { isAdmin } = useUserRole();
	const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
	const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);

	const mainNavItems = NAVIGATION_LINKS.main;
	const authenticatedNavItems = isAuthenticated ? NAVIGATION_LINKS.authenticated : [];
	const adminNavItems = isAdmin ? NAVIGATION_LINKS.admin : [];

	const navSections: { items: typeof mainNavItems; showIcon?: boolean }[] = [
		{ items: mainNavItems },
		{ items: authenticatedNavItems },
		{ items: adminNavItems, showIcon: true },
	].filter(s => s.items.length > 0);

	const handleLogout = async () => {
		try {
			await authService.logout();
			queryClient.clear();
			navigate(ROUTES.HOME);
		} catch (error) {
			logger.authError('Logout failed', { errorInfo: { message: getErrorMessage(error) } });
		}
	};

	return (
		<motion.nav
			initial={{ y: -20, opacity: 0 }}
			animate={{ y: 0, opacity: 1 }}
			className='sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'
		>
			<div className='container mx-auto px-4'>
				<div className='flex h-16 items-center justify-between gap-2'>
					<div className='flex min-w-0 flex-1 items-center gap-4 lg:gap-6'>
						<NavLink to={ROUTES.HOME} className='flex shrink-0 items-center gap-2 text-2xl font-bold text-foreground'>
							<img
								src='/assets/logo.svg'
								alt=''
								className='h-8 w-8 flex-shrink-0 object-contain'
								width={32}
								height={32}
							/>
							<span className='truncate'>{APP_NAME}</span>
						</NavLink>

						{/* Desktop: inline links */}
						<div className='hidden lg:flex lg:items-center lg:gap-6'>
							{navSections.map((section, sectionIndex) => (
								<Fragment key={`desktop-${sectionIndex}`}>
									{sectionIndex > 0 && <div className='h-4 w-px bg-border' />}
									{section.items.map((item: NavigationLink) => (
										<NavLink
											key={item.path}
											to={item.path}
											className={
												section.showIcon
													? 'text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 whitespace-nowrap'
													: 'text-sm font-medium text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap'
											}
											activeClassName='text-foreground'
										>
											{section.showIcon && <BrickWallShield className='h-4 w-4 shrink-0' />}
											{t(item.labelKey)}
										</NavLink>
									))}
								</Fragment>
							))}
						</div>

						{/* Narrow viewport: dropdown menu */}
						{navSections.length > 0 && (
							<DropdownMenu open={isNavMenuOpen} onOpenChange={setIsNavMenuOpen}>
								<DropdownMenuTrigger asChild className='lg:hidden'>
									<Button
										variant={VariantBase.MINIMAL}
										size={ButtonSize.ICON_MD}
										className='relative border-2 border-white'
									>
										<Menu className='h-5 w-5' />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align='start' className='w-56'>
									{navSections.map((section, sectionIndex) => (
										<Fragment key={`dropdown-${sectionIndex}`}>
											{sectionIndex > 0 && <DropdownMenuSeparator />}
											{section.items.map((item: NavigationLink) => (
												<DropdownMenuItem key={item.path} asChild>
													<NavLink
														to={item.path}
														className={section.showIcon ? 'flex w-full items-center gap-1' : 'flex w-full'}
														onClick={() => setIsNavMenuOpen(false)}
													>
														{section.showIcon && <BrickWallShield className='h-4 w-4' />}
														{t(item.labelKey)}
													</NavLink>
												</DropdownMenuItem>
											))}
										</Fragment>
									))}
								</DropdownMenuContent>
							</DropdownMenu>
						)}
					</div>

					{/* Right Side Actions */}
					<div className='flex shrink-0 items-center gap-3 sm:gap-5'>
						<LanguageSwitcher />
						{/* Audio Controls */}
						<AudioControls />

						{/* Credits Display */}
						{isAuthenticated && <CreditBalance />}

						{isAuthenticated ? (
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant={VariantBase.MINIMAL}
										size={ButtonSize.ICON_MD}
										className='relative !rounded-full hover:ring-2 hover:ring-primary hover:ring-offset-0'
									>
										{currentUser && (
											<UserAvatar
												key={currentUser.avatarUrl ?? 'nav-avatar'}
												size={AvatarSize.NAV}
												source={currentUser}
												pointerEventsNone
												fallbackLetter={DISPLAY_NAME_FALLBACKS.USER_SHORT}
											/>
										)}
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align='end' className='w-56'>
									<div className='flex items-center justify-start gap-2 p-2 min-w-0'>
										<div className='flex flex-col space-y-1 leading-none min-w-0'>
											<p className='font-medium truncate'>
												{currentUser ? getDisplayNameFromUserFields(currentUser) : ''}
											</p>
										</div>
									</div>
									<DropdownMenuSeparator />
									<DropdownMenuItem onClick={() => setIsProfileDialogOpen(true)} className='gap-1'>
										<IdCard className='h-4 w-4' />
										{t(CommonKey.PROFILE)}
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem onClick={handleLogout} className='text-destructive gap-1'>
										<LogOut className='h-4 w-4' />
										{t(CommonKey.SIGN_OUT)}
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						) : (
							<div className='ms-8 flex shrink-0 items-center gap-1.5 sm:ms-12 sm:gap-2 md:ms-16'>
								{!isRegisterPage && (
									<Button
										size={ButtonSize.SM}
										onClick={() => navigate(ROUTES.REGISTER, { state: { modal: true, returnUrl: location.pathname } })}
									>
										{t(CommonKey.SIGN_UP)}
									</Button>
								)}
								{!isLoginPage && (
									<Button
										variant={VariantBase.OUTLINE}
										size={ButtonSize.SM}
										onClick={() => navigate(ROUTES.LOGIN, { state: { modal: true, returnUrl: location.pathname } })}
									>
										{t(CommonKey.SIGN_IN)}
									</Button>
								)}
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Profile Edit Dialog */}
			<ProfileEditDialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen} />
		</motion.nav>
	);
}
