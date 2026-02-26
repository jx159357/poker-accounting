import { IsString, IsNumber, IsArray, IsOptional } from 'class-validator';

export class CreateGameDto {
  @IsString()
  name: string;

  @IsNumber()
  buyIn: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  players?: string[];
}
