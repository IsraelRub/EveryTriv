import { RoomStatus } from '@shared/constants';

import { GameKey } from '../core/ui/localeKeys.constants';

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
