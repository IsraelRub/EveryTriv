import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart3, Play, Users } from 'lucide-react';

import {
	AnimationDelays,
	AuthKey,
	ButtonSize,
	ErrorsKey,
	HomeKey,
	NavKey,
	Routes,
	StorageKeys,
	VariantBase,
} from '@/constants';
import { cn, safeSessionStorageGet, safeSessionStorageRemove } from '@/utils';
import {
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	HomeHeader,
	HomePublicLobbiesPanel,
	HomeStats,
	LeaderboardPreview,
	OptionalAvatarWelcomeDialog,
	PopularTopicsSection,
	RecentGames,
} from '@/components';
import { toast, useCurrentUserData, useIsAuthenticated, useUserProfile } from '@/hooks';

export function HomeView() {
	const { t } = useTranslation();
	const location = useLocation();
	const navigate = useNavigate();
	const isAuthenticated = useIsAuthenticated();
	const [optionalAvatarWelcomeOpen, setOptionalAvatarWelcomeOpen] = useState(false);

	const dismissOptionalAvatarWelcome = useCallback(() => {
		setOptionalAvatarWelcomeOpen(false);
	}, []);

	useEffect(() => {
		const authError =
			location.state && typeof location.state === 'object' && 'authError' in location.state
				? (location.state as { authError?: string }).authError
				: undefined;
		if (authError) {
			toast.error({ title: t(ErrorsKey.SOMETHING_WENT_WRONG), description: t(AuthKey.SIGN_IN_TO_CONTINUE) });
			navigate(Routes.HOME, { replace: true });
		}
	}, [location.state, navigate, t]);

	useEffect(() => {
		if (!isAuthenticated) return;
		if (safeSessionStorageGet(StorageKeys.SHOW_OPTIONAL_AVATAR_ON_HOME) === '1') {
			safeSessionStorageRemove(StorageKeys.SHOW_OPTIONAL_AVATAR_ON_HOME);
			setOptionalAvatarWelcomeOpen(true);
		}
	}, [isAuthenticated]);

	const currentUser = useCurrentUserData();
	const { data: userProfile } = useUserProfile();

	const firstName = userProfile?.profile?.firstName ?? currentUser?.email?.split('@')[0];

	return (
		<main className='view-main-fill animate-fade-in-only'>
			<OptionalAvatarWelcomeDialog open={optionalAvatarWelcomeOpen} onDismiss={dismissOptionalAvatarWelcome} />
			<div className='view-container-inner'>
				<div className='flex min-h-0 w-full max-w-none flex-1 flex-col overflow-y-auto view-spacing'>
					<div className='mb-4 md:mb-5 lg:mb-6'>
						<HomeHeader
							isAuthenticated={isAuthenticated}
							firstName={firstName ?? null}
							showWelcome={true}
							showGuestContent={!isAuthenticated}
							action={
								isAuthenticated ? (
									<div className='flex items-center gap-4 flex-shrink-0'>
										<motion.div
											initial={{ opacity: 0, scale: 0.9 }}
											animate={{ opacity: 1, scale: 1 }}
											transition={{ delay: AnimationDelays.STAGGER_NORMAL }}
										>
											<Button
												size={ButtonSize.LG}
												onClick={() => navigate(Routes.GAME)}
												className='text-base md:text-lg lg:text-xl px-6 py-4 md:px-8 md:py-6 lg:px-12 lg:py-8 h-auto font-bold shadow-lg gap-2'
											>
												<Play className='w-6 h-6 shrink-0' />
												{t(NavKey.START_GAME)}
											</Button>
										</motion.div>
										<motion.div
											initial={{ opacity: 0, scale: 0.9 }}
											animate={{ opacity: 1, scale: 1 }}
											transition={{ delay: AnimationDelays.STAGGER_NORMAL }}
										>
											<Button
												size={ButtonSize.LG}
												onClick={() => navigate(Routes.STATISTICS)}
												className='text-base md:text-lg lg:text-xl px-6 py-4 md:px-8 md:py-6 lg:px-12 lg:py-8 h-auto font-bold shadow-lg gap-2'
											>
												<BarChart3 className='w-6 h-6 shrink-0' />
												{t(NavKey.STATISTICS)}
											</Button>
										</motion.div>
									</div>
								) : (
									<motion.div
										initial={{ opacity: 0, scale: 0.9 }}
										animate={{ opacity: 1, scale: 1 }}
										transition={{ delay: AnimationDelays.STAGGER_NORMAL }}
										className='flex flex-col items-center justify-center gap-4 text-center'
									>
										<p className='text-base md:text-lg text-muted-foreground view-centered-2xl'>
											{t(HomeKey.CREATE_ACCOUNT_CTA)}
										</p>
										<div className='flex flex-wrap items-center justify-center gap-4'>
											<Button
												size={ButtonSize.LG}
												onClick={() =>
													navigate(Routes.REGISTER, {
														state: { modal: true, returnUrl: location.pathname },
													})
												}
												className='text-base md:text-lg lg:text-xl px-6 py-4 md:px-8 md:py-5 lg:px-10 lg:py-7 h-auto font-bold shadow-lg'
											>
												{t(HomeKey.REGISTER_NOW)}
											</Button>
											<Button
												variant={VariantBase.OUTLINE}
												size={ButtonSize.LG}
												onClick={() =>
													navigate(Routes.LOGIN, {
														state: { modal: true, returnUrl: location.pathname },
													})
												}
												className='text-base md:text-lg lg:text-xl px-6 py-4 md:px-8 md:py-5 lg:px-10 lg:py-7 h-auto font-bold shadow-lg'
											>
												{t(HomeKey.LOGIN)}
											</Button>
										</div>
									</motion.div>
								)
							}
						/>
					</div>

					<motion.section
						initial={{ opacity: 0, y: 12 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: AnimationDelays.STAGGER_NORMAL }}
						className='flex-shrink-0'
					>
						<Card className='card-muted-tint'>
							<CardHeader className='pb-3'>
								<CardTitle className='flex items-center gap-2 text-xl'>
									<Users className='h-5 w-5 shrink-0 text-primary' />
									{t(HomeKey.TAB_PUBLIC_LOBBIES)}
								</CardTitle>
							</CardHeader>
							<CardContent className='pt-0'>
								<HomePublicLobbiesPanel />
							</CardContent>
						</Card>
					</motion.section>

					<div className='mt-5 w-full min-w-0 space-y-5 md:mt-7 md:space-y-6 lg:mt-8 lg:space-y-7'>
						{isAuthenticated && (
							<motion.section
								initial={{ opacity: 0, y: 16 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: AnimationDelays.SEQUENCE_LARGE }}
								className='grid grid-cols-1 items-stretch gap-5 md:grid-cols-2 md:gap-6 xl:grid-cols-3 xl:gap-6 2xl:gap-8'
							>
								<HomeStats />
								<RecentGames />
								<div className='min-w-0 md:col-span-2 xl:col-span-1'>
									<PopularTopicsSection />
								</div>
							</motion.section>
						)}

						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ delay: AnimationDelays.SEQUENCE_LARGE + 0.04 }}
							className={cn(
								'view-spacing flex-shrink-0 border-t border-border/40 pt-5 md:pt-6',
								!isAuthenticated && 'view-centered-4xl'
							)}
						>
							{isAuthenticated ? (
								<div className='min-w-0 w-full'>
									<LeaderboardPreview />
								</div>
							) : (
								<div className='grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-[minmax(0,18rem)_1fr] xl:grid-cols-[minmax(0,20rem)_1fr] 2xl:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]'>
									<PopularTopicsSection />
									<div className='min-w-0'>
										<LeaderboardPreview />
									</div>
								</div>
							)}
						</motion.div>
					</div>
				</div>
			</div>
		</main>
	);
}
