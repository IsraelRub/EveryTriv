import { memo, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { DEFAULT_GAME_CONFIG, GAME_MODES_CONFIG, GameMode } from '@shared/constants';

import { ButtonSize, HomeKey, ROUTES } from '@/constants';
import type { PublicLobbyRoomCardProps } from '@/types';
import { toLobbyPlayerRowsFromPublicWaitingRoom } from '@/utils';
import { Button, LobbyGameDetailsCard, LobbyPlayersCard, LobbyRoomCodeBlock } from '@/components';
import { useCopyRoomCode } from '@/hooks';

export const PublicLobbyRoomCard = memo(function PublicLobbyRoomCard({
	room,
	isAuthenticated,
}: PublicLobbyRoomCardProps) {
	const { t } = useTranslation(['game', 'home']);
	const navigate = useNavigate();
	const { copied, copy } = useCopyRoomCode(room.roomId);

	const questionsCount =
		room.config.questionsPerRequest ?? GAME_MODES_CONFIG[GameMode.MULTIPLAYER].defaults.maxQuestionsPerGame ?? 10;

	const playerRows = useMemo(() => toLobbyPlayerRowsFromPublicWaitingRoom(room), [room]);

	const handleJoinClick = useCallback(() => {
		const joinTarget = `${ROUTES.MULTIPLAYER}?join=${encodeURIComponent(room.roomId)}`;
		if (isAuthenticated) {
			navigate(joinTarget);
			return;
		}
		navigate(ROUTES.LOGIN, {
			state: { modal: true, returnUrl: joinTarget },
		});
	}, [isAuthenticated, navigate, room.roomId]);

	return (
		<div className='space-y-4 rounded-lg border border-border/60 bg-card/30 p-4 md:p-5'>
			<div className='flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-x-6 sm:gap-y-3'>
				<LobbyRoomCodeBlock roomCode={room.roomId} copied={copied} onCopy={copy} />
				<Button size={ButtonSize.LG} onClick={handleJoinClick} className='w-full shrink-0 sm:w-auto'>
					{isAuthenticated ? t(HomeKey.PUBLIC_LOBBY_JOIN) : t(HomeKey.PUBLIC_LOBBY_LOGIN_TO_JOIN)}
				</Button>
			</div>

			<LobbyPlayersCard players={playerRows} maxPlayers={room.config.maxPlayers} />

			<LobbyGameDetailsCard
				topic={room.config.topic ?? DEFAULT_GAME_CONFIG.defaultTopic}
				difficulty={room.config.difficulty}
				questionsCount={questionsCount}
				status={room.status}
			/>
		</div>
	);
});
