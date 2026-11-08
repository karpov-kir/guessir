import { IsInt, Min } from "class-validator";

/** Holds the body of a reveal request: the position of the word in the text that a move opens. */
export class RevealDtoRequest {
  @IsInt()
  @Min(0)
  index!: number;
}
