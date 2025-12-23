/**
 * WebSocket type definitions for EveryTriv
 * Shared between client and server
 *
 * @module WebSocketTypes
 * @description WebSocket and Socket.IO related type definitions
 * @used_by client/src/services/domain/multiplayer.service.ts
 */
/**
 * WebSocket event listener interface
 * @interface WebSocketEventListener
 * @description Generic interface for WebSocket event listeners
 * @template T The type of the event data
 * @used_by client/src/services/domain/multiplayer.service.ts
 */
export interface WebSocketEventListener<T = unknown> {
	event: string;
	callback: (data: T) => void;
}
