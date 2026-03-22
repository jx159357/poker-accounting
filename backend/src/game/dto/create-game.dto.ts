import { IsString, IsOptional, IsIn } from 'class-validator';

export class CreateGameDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  gameType?: string;

  @IsString()
  creatorId: string;

  @IsString()
  @IsIn(['user', 'guest'])
  creatorType: string;

  @IsString()
  nickname: string;
}
