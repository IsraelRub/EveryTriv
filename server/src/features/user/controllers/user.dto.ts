import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsUrl,
} from "class-validator";

// Import shared validation limits
import { VALIDATION_LIMITS } from '../../../../../shared/constants/game.constants';

export class UserDto {
  @IsString()
  userId: string = '';

  @IsString()
  @MinLength(VALIDATION_LIMITS.USERNAME.MIN_LENGTH)
  @MaxLength(VALIDATION_LIMITS.USERNAME.MAX_LENGTH)
  username: string = '';

  @IsString()
  @IsUrl()
  @IsOptional()
  avatar?: string;
}
