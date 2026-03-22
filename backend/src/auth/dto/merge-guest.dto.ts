import { IsString } from 'class-validator';

export class MergeGuestDto {
  @IsString()
  guestId: string;
}
