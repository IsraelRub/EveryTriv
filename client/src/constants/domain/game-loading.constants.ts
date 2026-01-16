export enum GameLoadingStep {
	// Single player game steps
	CONNECTING = 'Connecting to server...',
	FETCHING_QUESTIONS = 'Fetching questions from server...',
	VALIDATING_QUESTIONS = 'Validating questions...',
	INITIALIZING_SESSION = 'Initializing game session...',
	TRACKING_ANALYTICS = 'Sending analytics data...',
	LOADING_AUDIO = 'Loading audio...',
	READY = 'Ready to start...',

	// Multiplayer steps
	AUTHENTICATING = 'Authenticating...',
	CONNECTING_TO_SOCKET = 'Connecting to multiplayer server...',
	ESTABLISHING_CONNECTION = 'Establishing connection...',
	JOINING_ROOM = 'Joining room...',
	WAITING_FOR_ROOM = 'Waiting for room...',
	WAITING_FOR_GAME_STATE = 'Waiting for game state...',
	LOADING_MULTIPLAYER_QUESTIONS = 'Loading questions...',
}
