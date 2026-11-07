import { CreateTextDto } from '@guessir/shared/dist/CreateTextDto';
import { IsBoolean, IsNotEmpty, IsOptional } from 'class-validator';

import { HasNoNullCharacter, MaxCodePoints } from './dbTextValidators';

export class CreateTextDtoRequest implements CreateTextDto {
  @IsNotEmpty()
  @MaxCodePoints(500)
  @HasNoNullCharacter()
  title!: string;

  @MaxCodePoints(4000)
  @HasNoNullCharacter()
  @IsOptional()
  description!: string;

  @IsNotEmpty()
  @MaxCodePoints(4000)
  @HasNoNullCharacter()
  text!: string;

  @IsBoolean()
  allowShowingFirstLetters = false;

  @IsBoolean()
  allowShowingText = false;
}
