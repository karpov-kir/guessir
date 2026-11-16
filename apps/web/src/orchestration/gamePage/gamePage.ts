import "./gamePage.css";
import { newPlayUseCases } from "../../features/play/exports";
import { CreateTextApi, newCreateTextUseCases } from "../../features/createText/exports";
import { GameApi, newGameLoadingUseCases } from "../../features/gameLoading/exports";
import type { Clock } from "../../shared/Clock";

export type GamePageDependencies = {
  api: GameApi & CreateTextApi;
  location: Pick<Location, "origin" | "search">;
  clipboard: Pick<Clipboard, "writeText">;
  clock: Pick<Clock, "schedule">;
};

/**
 * Loads the game for the text in the page URL and renders it into the page's main column, with the
 * form that creates a new text below it.
 */
export async function mountGamePage(
  container: HTMLElement,
  { api, location, clipboard, clock }: GamePageDependencies,
) {
  const game = await newGameLoadingUseCases({ api }).load(location.search);
  const mainElement = document.createElement("main");

  mainElement.id = "guessir";
  container.appendChild(mainElement);
  mainElement.appendChild(newPlayUseCases({ game }).getElement());
  mainElement.appendChild(
    newCreateTextUseCases({ api, origin: location.origin, clipboard, clock }).getElement(),
  );
}
