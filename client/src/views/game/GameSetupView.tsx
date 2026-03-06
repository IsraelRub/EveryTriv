import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Users } from 'lucide-react';

import type { GameConfig } from '@shared/types';

import { ANIMATION_DELAYS, ROUTES } from '@/constants';
import { Card, GameMode, HomeButton } from '@/components';
import { useAppDispatch } from '@/hooks';
import { setGameMode } from '@/redux/slices';

export function GameSetupView() {
	const navigate = useNavigate();
	const location = useLocation();
	const dispatch = useAppDispatch();
	const isSingleOptions = location.pathname === ROUTES.GAME_SINGLE;

	return (
		<main className='view-main animate-fade-in-only'>
			<div className='container mx-auto h-full flex flex-col'>
				<div className='view-centered-6xl view-spacing flex-1 flex flex-col'>
					{!isSingleOptions ? (
						<>
							{/* Player Type Selection */}
							<section className='view-spacing'>
								<div className='text-center'>
									<div className='mb-2 md:mb-4'>
										<HomeButton />
									</div>
									<h1 className='text-3xl md:text-4xl lg:text-5xl font-bold mb-2 md:mb-4'>Choose Game Type</h1>
									<p className='text-muted-foreground text-base md:text-lg'>How would you like to play today?</p>
								</div>

								<div className='grid grid-cols-1 md:grid-cols-2 gap-6 view-centered-2xl'>
									<motion.div
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: ANIMATION_DELAYS.STAGGER_NORMAL }}
									>
										<Card
											className='p-8 hover:shadow-lg transition-all cursor-pointer group hover:border-primary/50 h-full'
											onClick={() => navigate(ROUTES.GAME_SINGLE)}
										>
											<div className='flex flex-col items-center text-center space-y-4'>
												<div className='p-4 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors'>
													<User className='w-12 h-12 text-primary' />
												</div>
												<div>
													<h3 className='text-2xl font-semibold mb-2'>Single Player</h3>
													<p className='text-muted-foreground'>Play solo and challenge yourself</p>
												</div>
											</div>
										</Card>
									</motion.div>

									<motion.div
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: ANIMATION_DELAYS.SEQUENCE_MEDIUM }}
									>
										<Card
											className='p-8 hover:shadow-lg transition-all cursor-pointer group hover:border-primary/50 h-full'
											onClick={() => navigate(ROUTES.MULTIPLAYER)}
										>
											<div className='flex flex-col items-center text-center space-y-4'>
												<div className='p-4 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors'>
													<Users className='w-12 h-12 text-primary' />
												</div>
												<div>
													<h3 className='text-2xl font-semibold mb-2'>Multiplayer</h3>
													<p className='text-muted-foreground'>Compete with friends</p>
												</div>
											</div>
										</Card>
									</motion.div>
								</div>
							</section>
						</>
					) : (
						/* Single-player options (topic, difficulty, mode) */
						<section className='view-spacing view-centered-4xl'>
							<div className='text-center'>
								<div className='mb-2 md:mb-4'>
									<HomeButton onClick={() => navigate(ROUTES.GAME)} />
								</div>
								<h2 className='text-2xl md:text-3xl font-bold'>Choose Your Game Mode</h2>
							</div>
							<GameMode
								onModeSelect={(settings: GameConfig) => {
									dispatch(setGameMode(settings));
									const gameId = crypto.randomUUID();
									navigate(`/game/single/play/${gameId}`);
								}}
							/>
						</section>
					)}
				</div>
			</div>
		</main>
	);
}
