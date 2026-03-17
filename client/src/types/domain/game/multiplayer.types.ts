export interface MultiplayerErrorMessage {
	message: string;
}

export interface MultiplayerEventListener {
	event: string;
	callback: (data: unknown) => void;
}
