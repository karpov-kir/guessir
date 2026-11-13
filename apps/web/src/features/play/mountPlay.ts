import "./play.css";
import "./ScoreRenderer.css";
import "./ControlsRenderer.css";
import "./text/TextRenderer.css";
import "./text/WordRenderer.css";
import { Game } from "../../entities/game/exports";
import { PlayController } from "./PlayController";

/** Returns the `#game` element, which renders the game and answers the player's moves. */
export function mountPlay(game: Game): HTMLElement {
  return new PlayController({ game }).getElement();
}
