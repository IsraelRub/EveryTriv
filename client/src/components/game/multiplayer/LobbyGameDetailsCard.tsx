import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Info } from 'lucide-react';

import { DEFAULT_GAME_CONFIG } from '@shared/constants';
import { formatTitle } from '@shared/utils';

import { GameKey, MULTIPLAYER_ROOM_STATUS_LABEL_KEYS, VariantBase } from '@/constants';
import type { LobbyGameDetailsCardProps } from '@/types';
import { getDifficultyDisplayLabel } from '@/utils';
import { Badge, Card, CardContent, CardHeader, CardTitle } from '@/components';

export const LobbyGameDetailsCard = memo(function LobbyGameDetailsCard({
	topic,
	difficulty,
	questionsCount,
	status,
	statusTrailing,
}: LobbyGameDetailsCardProps) {
	const { t } = useTranslation('game');
	const statusKey = MULTIPLAYER_ROOM_STATUS_LABEL_KEYS[status] ?? GameKey.ROOM_STATUS_WAITING;

	return (
		<Card>
			<CardHeader>
				<CardTitle className='flex items-center gap-2'>
					<Info className='h-5 w-5 text-primary' />
					{t(GameKey.GAME_DETAILS)}
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className='grid grid-cols-2 gap-4 text-sm'>
					<div className='flex justify-between gap-2'>
						<span className='text-muted-foreground'>{t(GameKey.TOPIC_LABEL)}:</span>
						<span className='min-w-0 truncate text-end font-medium'>
							{formatTitle(topic || DEFAULT_GAME_CONFIG.defaultTopic)}
						</span>
					</div>
					<div className='flex justify-between gap-2'>
						<span className='text-muted-foreground'>{t(GameKey.DIFFICULTY_LABEL)}:</span>
						<span className='font-medium'>{getDifficultyDisplayLabel(difficulty, t)}</span>
					</div>
					<div className='flex justify-between gap-2'>
						<span className='text-muted-foreground'>{t(GameKey.QUESTIONS_LABEL)}:</span>
						<span className='font-medium'>{questionsCount}</span>
					</div>
					<div className='flex items-center justify-between gap-2'>
						<span className='text-muted-foreground'>{t(GameKey.STATUS_LABEL)}:</span>
						<Badge variant={VariantBase.OUTLINE} className='inline-flex items-center gap-1.5'>
							{statusTrailing}
							{t(statusKey)}
						</Badge>
					</div>
				</div>
			</CardContent>
		</Card>
	);
});
