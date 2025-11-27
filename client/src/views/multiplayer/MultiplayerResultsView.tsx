/**
 * Multiplayer Results View
 *
 * @module MultiplayerResultsView
 * @description Final results view after multiplayer game ends
 * @used_by client/src/AppRoutes.tsx
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { motion } from 'framer-motion';

import {
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Container,
	fadeInUp,
	LiveLeaderboard,
} from '../../components';
import { AudioKey, ButtonVariant, CardVariant, ComponentSize, ContainerSize } from '../../constants';
import { useMultiplayer, useUserProfile } from '../../hooks';
import { audioService } from '../../services';

export default function MultiplayerResultsView() {
	const navigate = useNavigate();
	const { room, leaderboard } = useMultiplayer();
	const { data: userProfile } = useUserProfile();

	useEffect(() => {
		audioService.play(AudioKey.GAME_START);
	}, []);

	if (!room || room.status !== 'finished') {
		return (
			<Container size={ContainerSize.LG} className='py-8'>
				<div className='text-center text-white'>Loading results...</div>
			</Container>
		);
	}

	const winner = leaderboard[0];
	const currentPlayerRank = leaderboard.findIndex(p => p.userId === userProfile?.profile?.id) + 1;
	const currentPlayer = leaderboard.find(p => p.userId === userProfile?.profile?.id);

	return (
		<Container size={ContainerSize.LG} className='py-8'>
			<motion.div variants={fadeInUp} initial='hidden' animate='visible' className='space-y-6'>
				<Card>
					<CardHeader>
						<CardTitle className='text-center'>
							{winner && winner.userId === userProfile?.profile?.id ? '🎉 You Won! 🎉' : 'Game Over'}
						</CardTitle>
					</CardHeader>
					<CardContent className='space-y-6'>
						{winner && (
							<div className='text-center'>
								<div className='text-4xl mb-2'>🏆</div>
								<h3 className='text-2xl font-bold text-yellow-400 mb-2'>{winner.displayName || winner.email}</h3>
								<div className='text-lg text-gray-300'>
									Final Score: {winner.score} | Correct: {winner.correctAnswers}/{winner.answersSubmitted}
								</div>
							</div>
						)}

						{currentPlayer && (
							<Card variant={CardVariant.GLASS}>
								<CardContent className='p-4'>
									<div className='text-center'>
										<h4 className='text-xl font-semibold text-white mb-2'>Your Results</h4>
										<div className='text-3xl font-bold text-white mb-2'>#{currentPlayerRank}</div>
										<div className='space-y-1 text-gray-300'>
											<div>Score: {currentPlayer.score}</div>
											<div>
												Correct: {currentPlayer.correctAnswers}/{currentPlayer.answersSubmitted}
											</div>
											<div>
												Success Rate:{' '}
												{currentPlayer.answersSubmitted > 0
													? Math.round((currentPlayer.correctAnswers / currentPlayer.answersSubmitted) * 100)
													: 0}
												%
											</div>
										</div>
									</div>
								</CardContent>
							</Card>
						)}

						<LiveLeaderboard leaderboard={leaderboard} currentUserId={userProfile?.profile?.id} />

						<div className='flex gap-4 justify-center'>
							<Button variant={ButtonVariant.PRIMARY} size={ComponentSize.LG} onClick={() => navigate('/multiplayer')}>
								Play Again
							</Button>
							<Button variant={ButtonVariant.SECONDARY} size={ComponentSize.LG} onClick={() => navigate('/')}>
								Back to Home
							</Button>
						</div>
					</CardContent>
				</Card>
			</motion.div>
		</Container>
	);
}
