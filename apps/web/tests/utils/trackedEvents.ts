import { newRecordingCollector } from "@kk-forge/artel-collector/testing";

import { bindTrack } from "../../src/shared/analytics";

/**
 * Binds the ambient `track` to a recording collector, and returns the events it records, oldest
 * first.
 */
export function recordTrackedEvents() {
  const analytics = newRecordingCollector();

  bindTrack((event, params) => void analytics.track(event, params));

  return analytics.events;
}
