import { CreateTextDto } from "@guessir/game";

import { Game, LocalGame } from "../../entities/game/exports";
import { parseTextId } from "../../entities/textLink/exports";
import { Logger } from "../../shared/Logger";
import { GameApi } from "./GameApi";
import { loadRemoteGame } from "./loadRemoteGame";

const logger = Logger.root.scope("gameLoading");

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

/**
 * Returns the remote game of the text that the query string `search` names. Returns a local game
 * with the default text when it names none, or with an error text when the load fails.
 */
export async function loadGame({ api, search }: { api: GameApi; search: string }): Promise<Game> {
  const textId = parseTextId(search);

  if (!textId) {
    return new LocalGame(defaultText);
  }

  try {
    logger.debug("Trying to load text...");

    const remoteGame = await loadRemoteGame(api, textId);

    logger.debug("Text has been loaded", remoteGame.skeleton);

    return remoteGame;
  } catch (error) {
    logger.error("Failed to load the text", error);

    return new LocalGame({ ...defaultText, text: couldNotLoadRemoteTextText });
  }
}
