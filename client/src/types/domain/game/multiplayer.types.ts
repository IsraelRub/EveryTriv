import type { ReactNode } from 'react';

import type { PlayerStatus, RoomStatus } from '@shared/constants';
import type { Player, PublicWaitingRoomDto } from '@shared/types';

import type { UiDensity } from '@/constants';
import type { UserAvatarSource } from '../user/components.types';

export interface LobbyGameDetailsCardProps {
	topic: string;
	difficulty: string;
	questionsCount: number;
	status: RoomStatus;
	statusTrailing?: ReactNode;
}

export interface LobbyRoomCodeBlockProps {
	roomCode: string;
	copied: boolean;
	onCopy: () => void;
}

export interface LobbyPlayersCardProps {
	players: LobbyPlayerCardRow[];
	maxPlayers: number;
}

export interface PublicLobbyRoomCardProps {
	room: PublicWaitingRoomDto;
	isAuthenticated: boolean;

	density?: UiDensity;
}

export interface LobbyPlayerCardRow {
	rowKey: string;
	avatarSource: UserAvatarSource;
	displayName: string;
	showCrown: boolean;
	status: PlayerStatus;
}

export interface MultiplayerErrorMessage {
	message: string;
}

export type MultiplayerEventCallback = (data: unknown) => void;

export type MultiplayerUnsubscribe = () => void;

export interface MultiplayerEventStream {
	subscribe(callback: MultiplayerEventCallback): MultiplayerUnsubscribe;
}

export interface PendingMultiplayerAnswerMerge {
	playersAnswers: Record<string, number>;
	playersScores: Record<string, number>;
	leaderboard: Player[] | undefined;
	answerCounts: Record<string, number>;
}
