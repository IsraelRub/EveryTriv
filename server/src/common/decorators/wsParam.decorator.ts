/**
 * WebSocket Parameter Decorators
 *
 * @module WsParamDecorators
 * @description Custom parameter decorators for extracting user information from WebSocket connections
 */
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import type { TypedSocket } from '@internal/types';

/**
 * Get the current authenticated user ID from WebSocket context
 * @returns The user ID (sub field from JWT payload) or null if not authenticated
 * @example
 * @SubscribeMessage('join-room')
 * async handleJoinRoom(@WsCurrentUserId() userId: string, @MessageBody() data: JoinRoomDto) { }
 */
export const WsCurrentUserId = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
	const client = ctx.switchToWs().getClient<TypedSocket>();
	const user = client.data.user;
	return user?.sub || null;
});

/**
 * Get the current authenticated user from WebSocket context
 * @returns The full user object (JWT payload) or null if not authenticated
 * @example
 * @SubscribeMessage('join-room')
 * async handleJoinRoom(@WsCurrentUser() user: UserPayload, @MessageBody() data: JoinRoomDto) { }
 */
export const WsCurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
	const client = ctx.switchToWs().getClient<TypedSocket>();
	return client.data.user || null;
});

/**
 * Get the connected Socket instance
 * @returns The Socket instance
 * @example
 * @SubscribeMessage('join-room')
 * async handleJoinRoom(@ConnectedSocket() client: TypedSocket, @MessageBody() data: JoinRoomDto) { }
 */
export const ConnectedSocket = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
	return ctx.switchToWs().getClient<TypedSocket>();
});
