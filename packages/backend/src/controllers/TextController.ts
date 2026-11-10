import { CreateTextDtoResponse } from "@guessir/shared/dist/CreateTextDtoResponse.js";
import { TextGame } from "@guessir/shared/dist/game/TextGame.js";
import { RevealedWord, RevealedWords, TextSkeleton } from "@guessir/shared/dist/game/types.js";
import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { nanoid } from "nanoid";
import { Repository } from "typeorm";

import { CreateTextDtoRequest } from "../dto/CreateTextDtoRequest.js";
import { GuessDtoRequest } from "../dto/GuessDtoRequest.js";
import { RevealDtoRequest } from "../dto/RevealDtoRequest.js";
import { TextEntity } from "../entities/TextEntity.js";
import { LruCache } from "../LruCache.js";

type PlayedText = { text: TextEntity; textGame: TextGame };

const cachedTextCount = 200;

/**
 * Serves each text as a game. The browser gets the text skeleton and asks for each word that a move
 * opens. The text stays on the server, so a player cannot read the hidden words in the browser.
 */
@Controller("texts")
export class TextsController {
  /**
   * Keeps the analysed game of recently played texts, so a move does not reload and re-analyse its
   * text. A text never changes after it is created, so a cached game never goes stale.
   */
  private readonly playedTexts = new LruCache<string, PlayedText>(cachedTextCount);

  constructor(
    @InjectRepository(TextEntity)
    private readonly textsRepository: Repository<TextEntity>,
  ) {}

  @Get("/:id")
  async findById(@Param("id") id: string): Promise<TextSkeleton> {
    const { text, textGame } = await this.findPlayedText(id);

    return {
      title: text.title,
      description: text.description,
      allowShowingFirstLetters: text.allowShowingFirstLetters,
      allowShowingText: text.allowShowingText,
      wordCount: textGame.wordCount,
      lexemes: textGame.lexemes(),
    };
  }

  @Post("/:id/guesses")
  @HttpCode(HttpStatus.OK)
  async guess(@Param("id") id: string, @Body() { word }: GuessDtoRequest): Promise<RevealedWords> {
    const { textGame } = await this.findPlayedText(id);

    return { words: textGame.guess(word) };
  }

  @Post("/:id/reveals")
  @HttpCode(HttpStatus.OK)
  async reveal(
    @Param("id") id: string,
    @Body() { index }: RevealDtoRequest,
  ): Promise<RevealedWord> {
    const { textGame } = await this.findPlayedText(id);
    const revealedWord = textGame.reveal(index);

    if (!revealedWord) {
      throw new NotFoundException();
    }

    return revealedWord;
  }

  @Get("/:id/first-letters")
  async firstLetters(@Param("id") id: string): Promise<RevealedWords> {
    const { text, textGame } = await this.findPlayedText(id);

    if (!text.allowShowingFirstLetters) {
      throw new ForbiddenException();
    }

    return { words: textGame.firstLetters() };
  }

  @Get("/:id/words")
  async words(@Param("id") id: string): Promise<RevealedWords> {
    const { text, textGame } = await this.findPlayedText(id);

    if (!text.allowShowingText) {
      throw new ForbiddenException();
    }

    return { words: textGame.words() };
  }

  @Post()
  async create(@Body() newTextDto: CreateTextDtoRequest): Promise<CreateTextDtoResponse> {
    const newText = await this.textsRepository.save({
      ...newTextDto,
      id: nanoid(20),
    });

    return { id: newText.id };
  }

  /** Returns the text with `id` and its analysed game, or throws 404 when there is none. */
  private async findPlayedText(id: string): Promise<PlayedText> {
    const cachedPlayedText = this.playedTexts.get(id);

    if (cachedPlayedText) {
      return cachedPlayedText;
    }

    const text = await this.textsRepository.findOne({
      where: { id },
    });

    if (!text) {
      throw new NotFoundException();
    }

    const playedText = { text, textGame: new TextGame(text.text) };

    this.playedTexts.set(id, playedText);

    return playedText;
  }
}
