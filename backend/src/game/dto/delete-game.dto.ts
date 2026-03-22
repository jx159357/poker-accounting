import { IsString } from 'class-validator';

export class DeleteGameDto {
  @IsString()
  requesterId: string;
}
