import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Users } from 'lucide-react';

import { PlayerType } from '@shared/constants';
import type { GameConfig } from '@shared/types';

import { ANIMATION_DELAYS, ROUTES } from '@/constants';
import { Card, GameMode, HomeButton } from '@/components';
import { useAppDispatch } from '@/hooks';
import { setGameMode } from '@/redux/slices';

export function GameSetupView() {
	const navigate = useNavigate();
	const dispatch = useAppDispatch();
	const [playerType, setPlayerType] = useState<PlayerType | null>(null);

	return (
		<main className='h-screen overflow-hidden animate-fade-in-only'>
			<div className='container mx-auto px-4 pt-0 pb-4 md:pb-6 h-full flex flex-col'>
				<div className='max-w-6xl mx-auto space-y-4 md:space-y-6 flex-1 flex flex-col'>
					{!playerType ? (
						<>
							{/* Player Type Selection */}
							<section className='space-y-4 md:space-y-6'>
								<div className='text-center'>
									<div className='mb-2 md:mb-4'>
										<HomeButton />
									</div>
									<h1 className='text-3xl md:text-4xl lg:text-5xl font-bold mb-2 md:mb-4'>Choose Game Type</h1>
									<p className='text-muted-foreground text-base md:text-lg'>How would you like to play today?</p>
								</div>

								<div className='grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto'>
									<motion.div
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: ANIMATION_DELAYS.STAGGER_NORMAL }}
									>
										<Card
											className='p-8 hover:shadow-lg transition-all cursor-pointer group hover:border-primary/50 h-full'
											onClick={() => setPlayerType(PlayerType.SINGLE)}
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
						/* Game Mode Selection */
						<section className='space-y-4 md:space-y-6 max-w-4xl mx-auto'>
							<div className='text-center'>
								<div className='mb-2 md:mb-4'>
									<HomeButton onClick={() => setPlayerType(null)} />
								</div>
								<h2 className='text-2xl md:text-3xl font-bold'>Choose Your Game Mode</h2>
							</div>
							<GameMode
								onModeSelect={(settings: GameConfig) => {
									dispatch(setGameMode(settings));
									navigate(ROUTES.GAME_PLAY);
								}}
							/>
						</section>
					)}
				</div>
			</div>
		</main>
	);
}
