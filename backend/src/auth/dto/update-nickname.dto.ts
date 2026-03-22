import { IsString, MinLength } from 'class-validator';

export class UpdateNicknameDto {
  @IsString()
  @MinLength(1, { message: '昵称不能为空' })
  nickname: string;
}
