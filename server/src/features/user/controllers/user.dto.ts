import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsUrl,
} from "class-validator";

export class UserDto {
  @IsString()
  userId: string = '';

  @IsString()
  @MinLength(3)
  @MaxLength(30)
  username: string = '';

  @IsString()
  @IsUrl()
  @IsOptional()
  avatar?: string;
}
