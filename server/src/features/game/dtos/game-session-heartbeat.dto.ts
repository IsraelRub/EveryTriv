import { IsNotEmpty, IsUUID } from 'class-validator';

export class GameSessionHeartbeatDto {
	@IsNotEmpty()
	@IsUUID()
	gameId!: string;
}
