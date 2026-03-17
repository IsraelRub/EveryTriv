import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, User, Users } from 'lucide-react';

import { DEFAULT_GAME_CONFIG } from '@shared/constants';
import type { GameConfig } from '@shared/types';
import { toDifficultyLevel } from '@shared/validation';

import { ANIMATION_DELAYS, ButtonSize, GameKey, ROUTES, VariantBase } from '@/constants';
import { Button, Card, GameMode, HomeButton } from '@/components';
import { useAppDispatch, useIsAuthenticated, useUpdateUserPreferences } from '@/hooks';
import { resetGameSession, setGameMode } from '@/redux/slices';

export function GameSetupView() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const location = useLocation();
	const dispatch = useAppDispatch();
	const isAuthenticated = useIsAuthenticated();
	const updatePreferences = useUpdateUserPreferences();
	const isSingleOptions = location.pathname === ROUTES.GAME_SINGLE;

	// Reset game session when entering setup so Start Game and navigation work after returning from play/summary
	useEffect(() => {
		dispatch(resetGameSession());
	}, [dispatch]);

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
									<h1 className='text-3xl md:text-4xl lg:text-5xl font-bold mb-2 md:mb-4'>
										{t(GameKey.CHOOSE_GAME_TYPE)}
									</h1>
									<p className='text-muted-foreground text-base md:text-lg'>{t(GameKey.HOW_WOULD_YOU_LIKE_TO_PLAY)}</p>
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
													<h3 className='text-2xl font-semibold mb-2'>{t(GameKey.SINGLE_PLAYER)}</h3>
													<p className='text-muted-foreground'>{t(GameKey.PLAY_SOLO_AND_CHALLENGE_YOURSELF)}</p>
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
													<h3 className='text-2xl font-semibold mb-2'>{t(GameKey.MULTIPLAYER)}</h3>
													<p className='text-muted-foreground'>{t(GameKey.COMPETE_WITH_FRIENDS)}</p>
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
									<Button variant={VariantBase.OUTLINE} size={ButtonSize.LG} onClick={() => navigate(ROUTES.GAME)}>
										<ArrowLeft className='h-4 w-4 me-2 rtl:scale-x-[-1]' />
										{t(GameKey.BACK_TO_GAME_TYPE)}
									</Button>
								</div>
								<h2 className='text-2xl md:text-3xl font-bold'>{t(GameKey.CHOOSE_YOUR_GAME_MODE)}</h2>
							</div>
							<GameMode
								onModeSelect={(settings: GameConfig) => {
									dispatch(setGameMode(settings));
									if (isAuthenticated) {
										updatePreferences.mutate({
											game: {
												defaultGameMode: settings.mode,
												defaultTopic: settings.topic,
												defaultDifficulty: toDifficultyLevel(
													settings.difficulty ?? DEFAULT_GAME_CONFIG.defaultDifficulty
												),
												timeLimit: settings.timeLimit,
												maxQuestionsPerGame: settings.maxQuestionsPerGame,
											},
										});
									}
									const gameId = crypto.randomUUID();
									navigate(ROUTES.GAME_SINGLE_PLAY.replace(':gameId', gameId));
								}}
							/>
						</section>
					)}
				</div>
			</div>
		</main>
	);
}
