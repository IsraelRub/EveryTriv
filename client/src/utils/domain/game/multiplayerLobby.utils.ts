import type { MultiplayerRoom, PublicWaitingRoomDto } from '@shared/types';
import { getDisplayNameFromUserFields } from '@shared/utils';

import type { LobbyPlayerCardRow } from '@/types';

export function toLobbyPlayerRowsFromMultiplayerRoom(room: MultiplayerRoom): LobbyPlayerCardRow[] {
	return room.players.map(player => ({
		rowKey: player.userId,
		avatarSource: {
			firstName: player.firstName ?? null,
			lastName: player.lastName ?? null,
			email: player.email ?? null,
			avatar: player.avatar ?? null,
			avatarUrl: player.avatarUrl ?? null,
		},
		displayName: getDisplayNameFromUserFields(player),
		showCrown: player.userId === room.hostId,
		status: player.status,
	}));
}

export function toLobbyPlayerRowsFromPublicWaitingRoom(room: PublicWaitingRoomDto): LobbyPlayerCardRow[] {
	return room.players.map((player, index) => ({
		rowKey: `${room.roomId}-${String(index)}`,
		avatarSource: {
			firstName: player.firstName ?? null,
			lastName: player.lastName ?? null,
			email: null,
			avatar: player.avatar ?? null,
			avatarUrl: player.avatarUrl ?? null,
		},
		displayName: player.displayName,
		showCrown: player.isHost,
		status: player.status,
	}));
}
