/* v8 ignore start */

import './styles.css';

import { CreateTextDto } from '@guessir/shared/dist/CreateTextDto';

import { Game } from './game/Game';
import { LocalGame } from './game/LocalGame';
import { RenderController } from './RenderController';
import { ApiClient } from './utils/ApiClient';
import { hasTextParametersInUrl, parseTextIdFromUrl } from './utils/text';

const defaultText: CreateTextDto = {
  title: 'Hello!',
  description: `I am a simple tool to turn any English text into a word guessing game.`,
  text: `In order to create your own text find the form below.`,
  allowShowingFirstLetters: true,
  allowShowingText: true,
};

const couldNotLoadRemoteTextText = `
  I could not load the remote text. Please, verify your URL or create a new text.
`;

/** Loads the game for the text in the current URL and renders it into the container element. */
export async function boot(containerElement: HTMLElement, apiClient = new ApiClient()) {
  const game = await loadGame(apiClient);
  const renderController = new RenderController({ game });

  renderController.init(containerElement);
}

/**
 * Returns the remote game of the text in the URL, or a local game with the default text when the URL has no text,
 * or a local game with an error text when the load fails.
 */
async function loadGame(apiClient: ApiClient): Promise<Game> {
  if (!hasTextParametersInUrl()) {
    return new LocalGame(defaultText);
  }

  try {
    console.log('Trying to load text...');

    const remoteGame = await apiClient.loadGame(parseTextIdFromUrl());

    console.log('Text has been loaded', remoteGame.skeleton);

    return remoteGame;
  } catch (error) {
    console.error('Failed to load the text', error);

    return new LocalGame({ ...defaultText, text: couldNotLoadRemoteTextText });
  }
}

/* v8 ignore stop */
