import { IsString, MaxLength } from 'class-validator';

export class ChatMessageDto {
  @IsString()
  @MaxLength(2000)
  message: string;
}
