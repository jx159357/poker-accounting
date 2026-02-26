import { IsNumber, IsString } from 'class-validator';

export class CreateRecordDto {
  @IsNumber()
  playerId: number;

  @IsNumber()
  amount: number;

  @IsString()
  type: string;
}
