import { IsString, IsArray, IsOptional } from 'class-validator';

export class CreateGameDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  gameType?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  players?: string[];

  @IsString()
  @IsOptional()
  guestId?: string;
}
