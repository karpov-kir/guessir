import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class GuessDtoRequest {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  word!: string;
}
