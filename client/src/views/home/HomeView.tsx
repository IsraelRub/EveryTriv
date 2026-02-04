import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart3, Play } from 'lucide-react';

import { ANIMATION_DELAYS, ButtonSize, ROUTES } from '@/constants';
import { Button, HomeHeader, HomeStats, LeaderboardPreview, PopularTopicsSection, RecentGames } from '@/components';
import { useCurrentUserData, useIsAuthenticated, useUserProfile } from '@/hooks';

export function HomeView() {
	const navigate = useNavigate();
	const isAuthenticated = useIsAuthenticated();
	const currentUser = useCurrentUserData();
	const { data: userProfile } = useUserProfile();

	const firstName = userProfile?.profile?.firstName || currentUser?.email?.split('@')[0];

	return (
		<main className='min-h-0 h-full flex flex-col overflow-hidden animate-fade-in-only'>
			<div className='container mx-auto px-4 pt-0 pb-4 md:pb-6 min-h-0 flex-1 flex flex-col'>
				<div className='max-w-6xl mx-auto space-y-4 md:space-y-6 min-h-0 flex-1 flex flex-col overflow-y-auto'>
					<HomeHeader
						isAuthenticated={isAuthenticated}
						firstName={firstName}
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
										className='text-xl px-12 py-8 h-auto font-bold shadow-lg hover:shadow-xl transition-all'
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
											className='text-xl px-12 py-8 h-auto font-bold shadow-lg hover:shadow-xl transition-all gap-2'
										>
											<BarChart3 className='w-6 h-6' />
											View Statistics
										</Button>
									</motion.div>
								)}
							</div>
						}
					/>

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

					{/* Dashboard Content */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: ANIMATION_DELAYS.SEQUENCE_LARGE }}
						className='space-y-4 md:space-y-6 pt-4 md:pt-6 border-t border-border/50 flex-shrink-0'
					>
						<PopularTopicsSection />
						{isAuthenticated ? (
							<LeaderboardPreview />
						) : (
							<div className='max-w-4xl mx-auto'>
								<LeaderboardPreview />
							</div>
						)}
					</motion.div>
				</div>
			</div>
		</main>
	);
}
