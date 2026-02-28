import { IsNumber, IsString, IsOptional } from 'class-validator';

export class CreateTransactionDto {
  @IsNumber()
  fromPlayerId: number;

  @IsNumber()
  toPlayerId: number;

  @IsNumber()
  amount: number;

  @IsString()
  @IsOptional()
  remark?: string;
}
