import { IsString } from 'class-validator';

export class UpdatePlayerNicknameDto {
  @IsString()
  nickname: string;
}
