import { IsBoolean, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateTextDto {
  @IsNotEmpty()
  @MaxLength(500)
  title!: string;

  @MaxLength(4000)
  @IsOptional()
  description!: string;

  @IsNotEmpty()
  @MaxLength(4000)
  text!: string;

  @IsBoolean()
  allowShowingFirstLetters = false;

  @IsBoolean()
  allowShowingText = false;
}
