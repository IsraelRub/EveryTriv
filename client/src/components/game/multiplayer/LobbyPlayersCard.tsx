import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Crown, Grid2x2Check } from 'lucide-react';

import { PlayerStatus } from '@shared/constants';

import { AvatarSize, GameKey, SEMANTIC_ICON_TEXT, VariantBase } from '@/constants';
import type { LobbyPlayersCardProps } from '@/types';
import { cn } from '@/utils';
import { Badge, Card, CardContent, CardHeader, CardTitle, UserAvatar } from '@/components';

export const LobbyPlayersCard = memo(function LobbyPlayersCard({ players, maxPlayers }: LobbyPlayersCardProps) {
	const { t } = useTranslation('game');

	return (
		<Card>
			<CardHeader>
				<CardTitle className='flex items-center gap-2'>
					<Grid2x2Check className='h-5 w-5 text-primary' />
					{t(GameKey.PLAYERS)} ({players.length}/{maxPlayers})
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className='space-y-3'>
					{players.map(player => (
						<motion.div
							key={player.rowKey}
							initial={{ opacity: 0, x: -10 }}
							animate={{ opacity: 1, x: 0 }}
							className='flex items-center gap-3 rounded-lg bg-muted/50 p-3'
						>
							<UserAvatar source={player.avatarSource} name={player.displayName} size={AvatarSize.MD} />
							<div className='flex-1'>
								<div className='flex items-center gap-2'>
									<span className='font-medium'>{player.displayName}</span>
									{player.showCrown ? <Crown className={cn('h-4 w-4', SEMANTIC_ICON_TEXT.warning)} /> : null}
								</div>
							</div>
							<Badge
								variant={player.status === PlayerStatus.DISCONNECTED ? VariantBase.SECONDARY : VariantBase.DEFAULT}
							>
								{player.status === PlayerStatus.DISCONNECTED ? t(GameKey.NOT_READY) : t(GameKey.READY)}
							</Badge>
						</motion.div>
					))}
				</div>
			</CardContent>
		</Card>
	);
});
