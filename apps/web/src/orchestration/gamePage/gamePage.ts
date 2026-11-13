import { mountCreateText } from "../../features/createText/exports";
import { GameApi, loadGame } from "../../features/gameLoading/exports";
import { mountPlay } from "../../features/play/exports";

export type GamePageDependencies = {
  api: GameApi;
  location: Pick<Location, "origin" | "search">;
  clipboard: Pick<Clipboard, "writeText">;
};

/**
 * Loads the game for the text in the page URL and renders it into the page's main column, with the
 * form that creates a new text below it.
 */
export async function mountGamePage(
  container: HTMLElement,
  { api, location, clipboard }: GamePageDependencies,
) {
  const game = await loadGame({ api, search: location.search });
  const mainElement = document.createElement("main");

  mainElement.id = "guessir";
  container.appendChild(mainElement);
  mountPlay(mainElement, game);
  mainElement.appendChild(mountCreateText({ api, origin: location.origin, clipboard }));
}
