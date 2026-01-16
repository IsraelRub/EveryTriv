import { VALIDATION_LENGTH, VALIDATORS } from '@shared/constants';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ROOM_ID_REGEX = /^[A-Z0-9]{8}$/;

export function isUuid(value: unknown): value is string {
	return VALIDATORS.string(value) && UUID_REGEX.test(value);
}

export function isRoomId(value: unknown): value is string {
	return VALIDATORS.string(value) && value.length === VALIDATION_LENGTH.ROOM_CODE.LENGTH && ROOM_ID_REGEX.test(value);
}
