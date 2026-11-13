import { Game } from "../../entities/game/exports";
import { RenderController } from "./RenderController";

/** Renders the game into `container` and answers the player's moves. */
export function mountPlay(container: HTMLElement, game: Game) {
  new RenderController({ game }).init(container);
}
