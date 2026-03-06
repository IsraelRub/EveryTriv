import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart3, Play } from 'lucide-react';

import { ANIMATION_DELAYS, ButtonSize, ROUTES } from '@/constants';
import { Button, HomeHeader, HomeStats, LeaderboardPreview, PopularTopicsSection, RecentGames } from '@/components';
import { useCurrentUserData, useIsAuthenticated, useUserProfile } from '@/hooks';
import { cn } from '@/utils';

export function HomeView() {
	const navigate = useNavigate();
	const isAuthenticated = useIsAuthenticated();
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
								<div className='flex items-center gap-4 flex-shrink-0'>
									<motion.div
										initial={{ opacity: 0, scale: 0.9 }}
										animate={{ opacity: 1, scale: 1 }}
										transition={{ delay: ANIMATION_DELAYS.STAGGER_NORMAL }}
									>
										<Button
											size={ButtonSize.LG}
											onClick={() => navigate(ROUTES.GAME)}
											className='text-xl px-12 py-8 h-auto font-bold shadow-lg'
										>
											<Play className='w-6 h-6 mr-3' />
											Start Game
										</Button>
									</motion.div>
									{isAuthenticated && (
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
												<BarChart3 className='w-6 h-6' />
												View Statistics
											</Button>
										</motion.div>
									)}
								</div>
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
