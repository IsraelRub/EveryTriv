import { RoomStatus, TIME_PERIODS_MS } from '@shared/constants';

import { GameKey } from '../core/ui/localeKeys.constants';

export const MULTIPLAYER_WEBSOCKET_RECONNECT = {
	MAX_ATTEMPTS: 25,
	BASE_DELAY_MS: TIME_PERIODS_MS.SECOND,
	MAX_DELAY_MS: TIME_PERIODS_MS.THIRTY_SECONDS,
} as const;

export enum MultiplayerSummaryPayloadKey {
	Leaderboard = 'leaderboard',
	QuestionCount = 'questionCount',
	PersonalAnswerHistory = 'personalAnswerHistory',
}

export const MULTIPLAYER_ROOM_STATUS_LABEL_KEYS: Record<RoomStatus, GameKey> = {
	[RoomStatus.WAITING]: GameKey.ROOM_STATUS_WAITING,
	[RoomStatus.STARTING]: GameKey.ROOM_STATUS_STARTING,
	[RoomStatus.PLAYING]: GameKey.ROOM_STATUS_PLAYING,
	[RoomStatus.FINISHED]: GameKey.ROOM_STATUS_FINISHED,
	[RoomStatus.CANCELLED]: GameKey.ROOM_STATUS_CANCELLED,
};
