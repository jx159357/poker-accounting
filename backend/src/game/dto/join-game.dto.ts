import { IsString, IsIn } from 'class-validator';

export class JoinGameDto {
  @IsString()
  nickname: string;

  @IsString()
  playerId: string;

  @IsString()
  @IsIn(['user', 'guest'])
  playerType: string;
}
