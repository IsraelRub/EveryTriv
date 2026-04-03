export interface MultiplayerErrorMessage {
	message: string;
}

export type MultiplayerEventCallback = (data: unknown) => void;

export type MultiplayerUnsubscribe = () => void;

export interface MultiplayerEventStream {
	subscribe(callback: MultiplayerEventCallback): MultiplayerUnsubscribe;
}
