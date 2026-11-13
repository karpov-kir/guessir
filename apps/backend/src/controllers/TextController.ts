import { CreateTextDtoResponse, RevealedWord, RevealedWords, TextSkeleton } from "@guessir/game";
import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from "@nestjs/common";

import { CreateTextDtoRequest } from "../dto/CreateTextDtoRequest.js";
import { GuessDtoRequest } from "../dto/GuessDtoRequest.js";
import { RevealDtoRequest } from "../dto/RevealDtoRequest.js";
import { Texts } from "../features/texts/exports.js";

/**
 * Serves the texts over HTTP. The game rules live in the texts feature; this controller maps routes
 * and bodies onto it.
 */
@Controller("texts")
export class TextsController {
  constructor(private readonly texts: Texts) {}

  @Get("/:id")
  findById(@Param("id") id: string): Promise<TextSkeleton> {
    return this.texts.findSkeleton(id);
  }

  @Post("/:id/guesses")
  @HttpCode(HttpStatus.OK)
  guess(@Param("id") id: string, @Body() { word }: GuessDtoRequest): Promise<RevealedWords> {
    return this.texts.guess(id, word);
  }

  @Post("/:id/reveals")
  @HttpCode(HttpStatus.OK)
  reveal(@Param("id") id: string, @Body() { index }: RevealDtoRequest): Promise<RevealedWord> {
    return this.texts.reveal(id, index);
  }

  @Get("/:id/first-letters")
  firstLetters(@Param("id") id: string): Promise<RevealedWords> {
    return this.texts.firstLetters(id);
  }

  @Get("/:id/words")
  words(@Param("id") id: string): Promise<RevealedWords> {
    return this.texts.words(id);
  }

  @Post()
  create(@Body() newTextDto: CreateTextDtoRequest): Promise<CreateTextDtoResponse> {
    return this.texts.create(newTextDto);
  }
}
