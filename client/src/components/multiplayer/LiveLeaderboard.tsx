/**
 * Live Leaderboard Component
 *
 * @module LiveLeaderboard
 * @description Displays real-time leaderboard during multiplayer game
 * @used_by client/src/views/multiplayer
 */
import { motion } from 'framer-motion';

import type { Player } from '@shared/types';

import { CardVariant, ComponentSize } from '../../constants';
import { fadeInUp } from '../animations';
import { Avatar } from '../ui';
import { Card, CardContent } from '../ui/Card';

interface LiveLeaderboardProps {
	leaderboard: Player[];
	currentUserId?: string;
	className?: string;
}

export default function LiveLeaderboard({ leaderboard, currentUserId, className = '' }: LiveLeaderboardProps) {
	return (
		<div className={className}>
			<h3 className='text-lg font-semibold text-white mb-4'>Leaderboard</h3>
			<div className='space-y-2'>
				{leaderboard.map((player, index) => {
					const isCurrentUser = player.userId === currentUserId;
					const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null;

					return (
						<motion.div
							key={player.userId}
							variants={fadeInUp}
							initial='hidden'
							animate='visible'
							transition={{ delay: index * 0.05 }}
						>
							<Card variant={isCurrentUser ? CardVariant.GLASS : CardVariant.TRANSPARENT}>
								<CardContent className='flex items-center gap-3 p-3'>
									<div className='flex items-center gap-2 min-w-[60px]'>
										{medal && <span className='text-2xl'>{medal}</span>}
										<span className='text-lg font-bold text-gray-400'>#{index + 1}</span>
									</div>
									<Avatar size={ComponentSize.SM} email={player.email} />
									<div className='flex-1'>
										<div className='flex items-center gap-2'>
											<span className='font-medium text-white'>{player.displayName || player.email}</span>
											{isCurrentUser && (
												<span className='text-xs bg-blue-500 text-blue-900 px-2 py-0.5 rounded'>You</span>
											)}
										</div>
										<div className='text-sm text-gray-400'>
											Score: {player.score} | Correct: {player.correctAnswers}/{player.answersSubmitted}
										</div>
									</div>
								</CardContent>
							</Card>
						</motion.div>
					);
				})}
			</div>
		</div>
	);
}
