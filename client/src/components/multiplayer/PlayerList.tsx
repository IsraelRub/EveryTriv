/**
 * Player List Component
 *
 * @module PlayerList
 * @description Displays list of players in a multiplayer room
 * @used_by client/src/views/multiplayer
 */
import { motion } from 'framer-motion';

import type { Player } from '@shared/types';

import { CardVariant, ComponentSize } from '../../constants';
import { fadeInUp } from '../animations';
import { Avatar } from '../ui';
import { Card, CardContent } from '../ui/Card';

interface PlayerListProps {
	players: Player[];
	currentUserId?: string;
	className?: string;
}

export default function PlayerList({ players, currentUserId, className = '' }: PlayerListProps) {
	return (
		<div className={className}>
			<h3 className='text-lg font-semibold text-white mb-4'>Players ({players.length})</h3>
			<div className='space-y-2'>
				{players.map((player, index) => {
					const isCurrentUser = player.userId === currentUserId;
					return (
						<motion.div
							key={player.userId}
							variants={fadeInUp}
							initial='hidden'
							animate='visible'
							transition={{ delay: index * 0.1 }}
						>
							<Card variant={isCurrentUser ? CardVariant.GLASS : CardVariant.TRANSPARENT}>
								<CardContent className='flex items-center gap-3 p-3'>
									<Avatar size={ComponentSize.SM} email={player.email} />
									<div className='flex-1'>
										<div className='flex items-center gap-2'>
											<span className='font-medium text-white'>{player.displayName || player.email}</span>
											{player.isHost && (
												<span className='text-xs bg-yellow-500 text-yellow-900 px-2 py-0.5 rounded'>Host</span>
											)}
											{isCurrentUser && (
												<span className='text-xs bg-blue-500 text-blue-900 px-2 py-0.5 rounded'>You</span>
											)}
										</div>
										<div className='text-sm text-gray-400'>
											Status: {player.status} | Score: {player.score}
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
