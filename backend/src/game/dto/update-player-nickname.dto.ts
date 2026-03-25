import { IsOptional, IsString } from 'class-validator';

export class UpdatePlayerNicknameDto {
  @IsString()
  nickname: string;

  @IsString()
  @IsOptional()
  requesterId?: string;
}
