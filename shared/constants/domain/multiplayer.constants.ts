export enum RoomStatus {
	WAITING = 'waiting',
	STARTING = 'starting',
	PLAYING = 'playing',
	FINISHED = 'finished',
	CANCELLED = 'cancelled',
}

export enum PlayerStatus {
	WAITING = 'waiting',
	READY = 'ready',
	PLAYING = 'playing',
	ANSWERED = 'answered',
	DISCONNECTED = 'disconnected',
	FINISHED = 'finished',
}

export enum MultiplayerEvent {
	// Socket connection events
	CONNECT = 'connect',
	DISCONNECT = 'disconnect',
	CONNECT_ERROR = 'connect_error',
	ERROR = 'error',

	// Room events
	ROOM_CREATED = 'room-created',
	ROOM_JOINED = 'room-joined',
	ROOM_LEFT = 'room-left',
	ROOM_UPDATED = 'room-updated',

	// Player events
	PLAYER_JOINED = 'player-joined',
	PLAYER_LEFT = 'player-left',
	PLAYER_READY = 'player-ready',

	// Game events
	GAME_STARTED = 'game-started',
	QUESTION_STARTED = 'question-started',
	ANSWER_RECEIVED = 'answer-received',
	QUESTION_ENDED = 'question-ended',
	GAME_ENDED = 'game-ended',

	// Leaderboard
	LEADERBOARD_UPDATE = 'leaderboard-update',

	// Emit events (client to server)
	CREATE_ROOM = 'create-room',
	JOIN_ROOM = 'join-room',
	LEAVE_ROOM = 'leave-room',
	START_GAME = 'start-game',
	SUBMIT_ANSWER = 'submit-answer',
}

export enum QuestionState {
	IDLE = 'idle',
	STARTING = 'starting',
	ACTIVE = 'active',
	ENDING = 'ending',
	ENDED = 'ended',
}
