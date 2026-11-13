import "./styles/index.css";
import { CreateTextDto } from "@guessir/game";

import { Game } from "./game/Game";
import { loadRemoteGame } from "./game/loadRemoteGame";
import { LocalGame } from "./game/LocalGame";
import { RenderController } from "./RenderController";
import { CreateTextRenderer } from "./renderers/CreateTextRenderer";
import { HttpClient } from "./utils/HttpClient";
import { Logger } from "./utils/Logger";
import { parseTextId } from "./utils/text";

const logger = Logger.root.scope("boot");

const defaultText: CreateTextDto = {
  title: "Hello!",
  description: `I am a simple tool to turn any English text into a word guessing game.`,
  text: `In order to create your own text find the form below.`,
  allowShowingFirstLetters: true,
  allowShowingText: true,
};

const couldNotLoadRemoteTextText = `
  I could not load the remote text. Please, verify your URL or create a new text.
`;

export type BootDependencies = {
  httpClient: HttpClient;
  location: Pick<Location, "origin" | "search">;
  clipboard: Pick<Clipboard, "writeText">;
};

/**
 * Loads the game for the text in the page URL and renders it into the container element, with the
 * form that creates a new text below it.
 */
export async function boot(
  containerElement: HTMLElement,
  { httpClient, location, clipboard }: BootDependencies,
) {
  const game = await loadGame(httpClient, location.search);
  const mainElement = document.createElement("main");

  mainElement.id = "guessir";
  containerElement.appendChild(mainElement);
  new RenderController({ game }).init(mainElement);
  mainElement.appendChild(
    new CreateTextRenderer({ httpClient, origin: location.origin, clipboard }).getElement(),
  );
}

/**
 * Returns the remote game of the text that the query string `search` names. Returns a local game
 * with the default text when it names none, or with an error text when the load fails.
 */
async function loadGame(httpClient: HttpClient, search: string): Promise<Game> {
  const textId = parseTextId(search);

  if (!textId) {
    return new LocalGame(defaultText);
  }

  try {
    logger.debug("Trying to load text...");

    const remoteGame = await loadRemoteGame(httpClient, textId);

    logger.debug("Text has been loaded", remoteGame.skeleton);

    return remoteGame;
  } catch (error) {
    logger.error("Failed to load the text", error);

    return new LocalGame({ ...defaultText, text: couldNotLoadRemoteTextText });
  }
}
