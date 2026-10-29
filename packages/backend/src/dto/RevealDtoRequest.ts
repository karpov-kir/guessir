import { IsInt, Min } from 'class-validator';

export class RevealDtoRequest {
  @IsInt()
  @Min(0)
  index!: number;
}
