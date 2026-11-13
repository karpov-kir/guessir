import { textSkeletonSchema } from "@guessir/game";

import { GameApi } from "./GameApi";
import { RemoteGame } from "./RemoteGame";

/**
 * Loads the skeleton of the stored text with `id` and returns the game that plays it through the
 * server.
 */
export async function loadRemoteGame(api: GameApi, id: string): Promise<RemoteGame> {
  // The function encodes the id so it stays one path segment. The id comes from the page URL, and a
  // slash or `?` in it would send the request to another endpoint.
  const textPath = `texts/${encodeURIComponent(id)}`;
  const skeleton = await api.get(textPath, textSkeletonSchema);

  return new RemoteGame({ api, textPath, skeleton });
}
