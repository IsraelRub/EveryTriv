import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart3, Play } from 'lucide-react';

import {
	ANIMATION_DELAYS,
	AuthKey,
	ButtonSize,
	ErrorsKey,
	HomeKey,
	NavKey,
	ROUTES,
	VariantBase,
} from '@/constants';
import { cn } from '@/utils';
import { Button, HomeHeader, HomeStats, LeaderboardPreview, PopularTopicsSection, RecentGames } from '@/components';
import { useCurrentUserData, useIsAuthenticated, useUserProfile } from '@/hooks';
import { toast } from '@/hooks/ui/useToast';

export function HomeView() {
	const { t } = useTranslation();
	const location = useLocation();
	const navigate = useNavigate();
	const isAuthenticated = useIsAuthenticated();

	useEffect(() => {
		const authError =
			location.state && typeof location.state === 'object' && 'authError' in location.state
				? (location.state as { authError?: string }).authError
				: undefined;
		if (authError) {
			toast.error({ title: t(ErrorsKey.SOMETHING_WENT_WRONG), description: t(AuthKey.SIGN_IN_TO_CONTINUE) });
			navigate(ROUTES.HOME, { replace: true });
		}
	}, [location.state, navigate, t]);
	const currentUser = useCurrentUserData();
	const { data: userProfile } = useUserProfile();

	const firstName = userProfile?.profile?.firstName ?? currentUser?.email?.split('@')[0];

	return (
		<main className='view-main-fill animate-fade-in-only'>
			<div className='view-container-inner'>
				<div className='view-content-6xl-fill'>
					<div className='mb-4 md:mb-6 lg:mb-8'>
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
											transition={{ delay: ANIMATION_DELAYS.STAGGER_NORMAL }}
										>
											<Button
												size={ButtonSize.LG}
												onClick={() => navigate(ROUTES.GAME)}
												className='text-xl px-12 py-8 h-auto font-bold shadow-lg gap-2'
											>
												<Play className='w-6 h-6 shrink-0' />
												{t(NavKey.START_GAME)}
											</Button>
										</motion.div>
										<motion.div
											initial={{ opacity: 0, scale: 0.9 }}
											animate={{ opacity: 1, scale: 1 }}
											transition={{ delay: ANIMATION_DELAYS.STAGGER_NORMAL }}
										>
											<Button
												size={ButtonSize.LG}
												onClick={() => navigate(ROUTES.STATISTICS)}
												className='text-xl px-12 py-8 h-auto font-bold shadow-lg gap-2'
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
										transition={{ delay: ANIMATION_DELAYS.STAGGER_NORMAL }}
										className='flex flex-col items-center justify-center gap-4 text-center'
									>
										<p className='text-base md:text-lg text-muted-foreground view-centered-2xl'>
											{t(HomeKey.CREATE_ACCOUNT_CTA)}
										</p>
										<div className='flex flex-wrap items-center justify-center gap-4'>
											<Button
												size={ButtonSize.LG}
												onClick={() =>
													navigate(ROUTES.REGISTER, {
														state: { modal: true, returnUrl: location.pathname },
													})
												}
												className='text-xl px-10 py-7 h-auto font-bold shadow-lg'
											>
												{t(HomeKey.REGISTER_NOW)}
											</Button>
											<Button
												variant={VariantBase.OUTLINE}
												size={ButtonSize.LG}
												onClick={() =>
													navigate(ROUTES.LOGIN, {
														state: { modal: true, returnUrl: location.pathname },
													})
												}
												className='text-xl px-10 py-7 h-auto font-bold shadow-lg'
											>
												{t(HomeKey.LOGIN)}
											</Button>
										</div>
									</motion.div>
								)
							}
						/>
					</div>

					{/* Second Row - HomeStats + RecentGames (authenticated only) */}
					{isAuthenticated && (
						<motion.section
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: ANIMATION_DELAYS.STAGGER_NORMAL }}
							className='grid grid-cols-1 lg:grid-cols-2 gap-6'
						>
							<HomeStats />
							<RecentGames />
						</motion.section>
					)}

					{/* Dashboard Content: Popular Topics (narrow) + Top Players (wide) in one row */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: ANIMATION_DELAYS.SEQUENCE_LARGE }}
						className={cn(
							'view-spacing pt-4 md:pt-6 border-t border-border/50 flex-shrink-0',
							!isAuthenticated && 'view-centered-4xl'
						)}
					>
						<div className='grid grid-cols-1 lg:grid-cols-[minmax(0,15rem)_1fr] gap-4 md:gap-6'>
							<PopularTopicsSection />
							<div className='min-w-0'>
								<LeaderboardPreview />
							</div>
						</div>
					</motion.div>
				</div>
			</div>
		</main>
	);
}
