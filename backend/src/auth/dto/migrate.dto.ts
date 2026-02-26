import {
  IsArray,
  IsString,
  IsNumber,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

class GuestRecordDto {
  @IsString()
  playerId: string;

  @IsNumber()
  amount: number;

  @IsString()
  type: string;

  @IsOptional()
  @IsString()
  createdAt?: string;
}

class GuestGameDto {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsArray()
  @IsString({ each: true })
  players: string[];

  @IsNumber()
  buyIn: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GuestRecordDto)
  records: GuestRecordDto[];

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  createdAt?: string;
}

export class MigrateDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GuestGameDto)
  games: GuestGameDto[];
}
