import { CreateTextDto, createTextLimits } from '@guessir/shared/dist/CreateTextDto';
import { IsBoolean, IsNotEmpty, IsOptional } from 'class-validator';

import { HasNoNullCharacter, MaxCodePoints } from './dbTextValidators';

export class CreateTextDtoRequest implements CreateTextDto {
  @IsNotEmpty()
  @MaxCodePoints(createTextLimits.title)
  @HasNoNullCharacter()
  title!: string;

  @MaxCodePoints(createTextLimits.description)
  @HasNoNullCharacter()
  @IsOptional()
  description!: string;

  @IsNotEmpty()
  @MaxCodePoints(createTextLimits.text)
  @HasNoNullCharacter()
  text!: string;

  @IsBoolean()
  allowShowingFirstLetters = false;

  @IsBoolean()
  allowShowingText = false;
}
