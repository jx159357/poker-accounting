import { IsString, IsOptional } from 'class-validator';

export class UpdateGameDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  gameType?: string;
}
