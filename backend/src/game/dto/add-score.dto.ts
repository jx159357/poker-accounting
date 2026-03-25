import { IsNumber, IsString, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class AddScoreDto {
  @Type(() => Number)
  @IsNumber()
  fromPlayerId: number;

  @Type(() => Number)
  @IsNumber()
  toPlayerId: number;

  @Type(() => Number)
  @IsNumber()
  score: number;

  @IsString()
  @IsOptional()
  note?: string;

  @IsString()
  @IsOptional()
  requesterId?: string;
}
