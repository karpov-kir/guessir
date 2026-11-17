type TrackParams = Record<string, string | number | boolean>;

let send: ((event: string, params?: TrackParams) => void) | undefined;

/**
 * Hands `sender` every event that `track` gets from then on. The page's composition root binds its
 * analytics collector. Until then, and in a test that binds nothing, `track` drops the event.
 */
export function bindTrack(sender: (event: string, params?: TrackParams) => void): void {
  send = sender;
}

/** Hands the event to the bound sender, or drops it when no sender is bound. */
export function track(event: string, params?: TrackParams): void {
  send?.(event, params);
}
