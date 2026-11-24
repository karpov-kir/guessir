import {
  CreateTextDto,
  createTextDtoSchema,
  guessDtoSchema,
  revealDtoSchema,
  TextGame,
  TextSkeleton,
} from "@guessir/game";
import type { ZodType } from "zod";

import type { CreateTextApi } from "#/features/createText/exports.js";
import type { GameApi } from "#/features/gameLoading/exports.js";

/** Names a request the fake API received. */
type ApiRequest = { method: "GET" | "POST"; path: string };

type StoredText = { text: CreateTextDto; textGame: TextGame };

/**
 * Answers the API's routes in memory, the way the backend does: it stores the texts it is sent and
 * plays each with the real `TextGame`. Like `FetchHttpClient`, it rejects a request the backend
 * would refuse with "Request failed", and reads each answer through the caller's schema after a JSON
 * round trip. The rejection's `cause` holds the status, for a test to read.
 */
export class FakeApi implements GameApi, CreateTextApi {
  /** Lists the requests received, oldest first, failed ones included. */
  public readonly requests: ApiRequest[] = [];
  private readonly storedTexts = new Map<string, StoredText>();
  private readonly failures: unknown[] = [];

  /** Returns the stored texts by id, as they were created. */
  get texts(): ReadonlyMap<string, CreateTextDto> {
    return new Map(Array.from(this.storedTexts, ([id, { text }]) => [id, text]));
  }

  /** Stores `text` under `id`, or under the next free id, and returns the id. */
  storeText(text: CreateTextDto, id = `text-${this.storedTexts.size + 1}`): string {
    this.storedTexts.set(id, { text, textGame: new TextGame({ text: text.text }) });

    return id;
  }

  /** Makes the next request reject with `reason` without being answered. */
  failNextRequest(reason: unknown) {
    this.failures.push(reason);
  }

  async get<T>(path: string, schema: ZodType<T>): Promise<T> {
    return this.request({ method: "GET", path }, undefined, schema);
  }

  async post<T>(path: string, payload: unknown, schema: ZodType<T>): Promise<T> {
    return this.request({ method: "POST", path }, payload, schema);
  }

  private async request<T>(request: ApiRequest, payload: unknown, schema: ZodType<T>): Promise<T> {
    this.requests.push(request);

    if (this.failures.length > 0) {
      // The port's callers also handle a rejection that is not an Error, so a test can send one.
      // oxlint-disable-next-line typescript/prefer-promise-reject-errors
      return Promise.reject(this.failures.shift());
    }

    // The round trip drops what JSON cannot carry, such as an `undefined` field, as the wire does.
    const body: unknown = JSON.parse(JSON.stringify(payload ?? null));
    const answer: unknown = JSON.parse(JSON.stringify(this.answer(request, body)));
    const result = schema.safeParse(answer);

    if (!result.success) {
      throw new Error("Unexpected response from the server", { cause: result.error });
    }

    return result.data;
  }

  private answer({ method, path }: ApiRequest, body: unknown): unknown {
    const [collection, encodedId, route, ...rest] = path.split("/");

    if (collection !== "texts" || rest.length > 0) {
      return notFound(path);
    }

    if (encodedId === undefined) {
      return method === "POST" ? this.create(body) : notFound(path);
    }

    const storedText = this.storedTexts.get(decodeURIComponent(encodedId));

    if (!storedText) {
      return notFound(path);
    }

    return answerMove({ method, route, body, storedText, path });
  }

  private create(body: unknown) {
    return { id: this.storeText(parseBody(createTextDtoSchema, body)) };
  }
}

/** Answers a move on a stored text the way the backend's `TextsUseCases` does. */
function answerMove({
  method,
  route,
  body,
  storedText: { text, textGame },
  path,
}: {
  method: ApiRequest["method"];
  route: string | undefined;
  body: unknown;
  storedText: StoredText;
  path: string;
}): unknown {
  switch (`${method} ${route ?? ""}`) {
    case "GET ":
      return newSkeleton(text, textGame);
    case "POST guesses":
      return { words: textGame.guess(parseBody(guessDtoSchema, body).word) };
    case "POST reveals":
      return textGame.reveal(parseBody(revealDtoSchema, body).index) ?? notFound(path);
    case "GET first-letters":
      return text.allowShowingFirstLetters ? { words: textGame.firstLetters() } : forbidden(path);
    case "GET words":
      return text.allowShowingText ? { words: textGame.words() } : forbidden(path);
    default:
      return notFound(path);
  }
}

function newSkeleton(text: CreateTextDto, textGame: TextGame): TextSkeleton {
  return {
    title: text.title,
    description: text.description,
    allowShowingFirstLetters: text.allowShowingFirstLetters,
    allowShowingText: text.allowShowingText,
    wordCount: textGame.wordCount,
    lexemes: textGame.lexemes(),
  };
}

/** Returns the request body as `schema` reads it, or throws the 400 the backend answers. */
function parseBody<T>(schema: ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body);

  if (!result.success) {
    throw new Error("Request failed", { cause: { status: 400, problem: result.error } });
  }

  return result.data;
}

function notFound(path: string): never {
  throw new Error("Request failed", { cause: { status: 404, path } });
}

function forbidden(path: string): never {
  throw new Error("Request failed", { cause: { status: 403, path } });
}
