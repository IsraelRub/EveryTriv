import { memo, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { DEFAULT_GAME_CONFIG, GAME_MODES_CONFIG, GameMode } from '@shared/constants';
import { formatTitle } from '@shared/utils';

import {
	AnimatedCopyFeedbackIconVariant,
	ButtonSize,
	GameKey,
	HomeKey,
	MULTIPLAYER_ROOM_STATUS_LABEL_KEYS,
	Routes,
	UiDensity,
	VariantBase,
} from '@/constants';
import type { PublicLobbyRoomCardProps } from '@/types';
import { getDifficultyDisplayLabel, toLobbyPlayerRowsFromPublicWaitingRoom } from '@/utils';
import {
	AnimatedCopyFeedbackIcon,
	Badge,
	Button,
	LobbyGameDetailsCard,
	LobbyPlayersCard,
	LobbyRoomCodeBlock,
} from '@/components';
import { useCopyRoomCode } from '@/hooks';

export const PublicLobbyRoomCard = memo(function PublicLobbyRoomCard({
	room,
	isAuthenticated,
	density = UiDensity.DEFAULT,
}: PublicLobbyRoomCardProps) {
	const { t } = useTranslation(['game', 'home']);
	const navigate = useNavigate();
	const { copied, copy } = useCopyRoomCode(room.roomId);

	const questionsCount =
		room.config.questionsPerRequest ?? GAME_MODES_CONFIG[GameMode.MULTIPLAYER].defaults.maxQuestionsPerGame ?? 10;

	const playerRows = useMemo(
		() => (density === UiDensity.DEFAULT ? toLobbyPlayerRowsFromPublicWaitingRoom(room) : []),
		[room, density]
	);

	const handleJoinClick = useCallback(() => {
		const joinTarget = `${Routes.MULTIPLAYER}?join=${encodeURIComponent(room.roomId)}`;
		if (isAuthenticated) {
			navigate(joinTarget);
			return;
		}
		navigate(Routes.LOGIN, {
			state: { modal: true, returnUrl: joinTarget },
		});
	}, [isAuthenticated, navigate, room.roomId]);

	if (density === UiDensity.COMPACT) {
		const topicDisplay = formatTitle(room.config.topic ?? DEFAULT_GAME_CONFIG.defaultTopic);
		const statusKey = MULTIPLAYER_ROOM_STATUS_LABEL_KEYS[room.status] ?? GameKey.ROOM_STATUS_WAITING;
		const playerCount = room.players?.length ?? 0;
		const maxPlayers = room.config.maxPlayers;

		return (
			<div className='rounded-lg border border-border/60 bg-card/30 p-3'>
				<div className='flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4'>
					<div className='min-w-0 flex-1 space-y-1.5'>
						<p className='truncate text-sm font-medium text-foreground md:text-base'>{topicDisplay}</p>
						<div className='flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground'>
							<Badge variant={VariantBase.OUTLINE} className='h-5 px-1.5 text-[0.7rem] font-normal leading-none'>
								{t(statusKey)}
							</Badge>
							<span className='text-foreground/85'>{getDifficultyDisplayLabel(room.config.difficulty, t)}</span>
							<span className='select-none text-border'>·</span>
							<span>{t(GameKey.TOPIC_MOST_PLAYED_QUESTION_COUNT, { count: questionsCount })}</span>
							<span className='select-none text-border'>·</span>
							<span className='tabular-nums'>
								{t(HomeKey.PUBLIC_LOBBY_PLAYER_SLOTS, { current: playerCount, max: maxPlayers })}
							</span>
						</div>
					</div>
					<div className='flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-end'>
						<div className='flex min-w-0 max-w-full items-stretch overflow-hidden rounded-md border border-border bg-muted/40'>
							<span className='flex min-h-8 min-w-0 flex-1 items-center truncate px-2 py-1.5 font-mono text-xs text-foreground sm:max-w-[11rem] md:max-w-[14rem]'>
								{room.roomId}
							</span>
							<Button
								type='button'
								variant={VariantBase.DEFAULT}
								size={ButtonSize.ICON_MD}
								onClick={copy}
								className='h-auto min-h-8 w-9 shrink-0 rounded-none rounded-e-lg border-s border-primary-foreground/15'
							>
								<AnimatedCopyFeedbackIcon success={copied} variant={AnimatedCopyFeedbackIconVariant.ON_PRIMARY} />
							</Button>
						</div>
						<Button size={ButtonSize.SM} onClick={handleJoinClick} className='w-full shrink-0 sm:w-auto'>
							{isAuthenticated ? t(HomeKey.PUBLIC_LOBBY_JOIN) : t(HomeKey.PUBLIC_LOBBY_LOGIN_TO_JOIN)}
						</Button>
					</div>
				</div>
			</div>
		);
	}

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
