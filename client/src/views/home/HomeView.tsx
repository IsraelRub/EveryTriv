import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Users } from 'lucide-react';

import { PlayerType } from '@shared/constants';

import { ButtonVariant } from '@/constants';
import { Button, Card, GameMode, HomeTitle } from '@/components';
import { useAppDispatch } from '@/hooks';
import { setGameMode } from '@/redux/slices';

export function HomeView() {
	const navigate = useNavigate();
	const dispatch = useAppDispatch();
	const [playerType, setPlayerType] = useState<PlayerType | null>(null);

	return (
		<motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} className='min-h-screen'>
			<div className='container mx-auto px-4 py-12'>
				<div className='max-w-6xl mx-auto space-y-12'>
					<HomeTitle />

					{!playerType ? (
						<section className='space-y-6'>
							<h2 className='text-3xl font-bold text-center'>Choose Player Type</h2>
							<div className='grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto'>
								<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
									<Card
										className='p-8 hover:shadow-lg transition-all cursor-pointer group hover:border-primary/50'
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

								<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
									<Card
										className='p-8 hover:shadow-lg transition-all cursor-pointer group hover:border-primary/50'
										onClick={() => navigate('/multiplayer')}
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
					) : (
						<section className='space-y-6'>
							<div className='text-center'>
								<Button variant={ButtonVariant.GHOST} onClick={() => setPlayerType(null)}>
									Back to player selection
								</Button>
							</div>
							<h2 className='text-3xl font-bold text-center'>Choose Your Game Mode</h2>
							<GameMode
								onModeSelect={settings => {
									dispatch(setGameMode(settings));
									navigate('/game/play');
								}}
							/>
						</section>
					)}
				</div>
			</div>
		</motion.main>
	);
}
