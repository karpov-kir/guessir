import { type Collector, Mode } from "@kk-forge/artel-collector";
import { newWebCollector } from "@kk-forge/artel-collector/infra";
import { Logger } from "@guessir/logger";

const logger = Logger.root.scope("analytics");

/**
 * Returns the anonymous analytics collector of the page. It keeps its queue in `localStorage`, so
 * events a closing page left unsent go with the next visit.
 */
export function newAnalytics(channel: {
  key: string;
  endpoint: string;
  version: string;
}): Collector<"anonymous"> {
  return newWebCollector({
    ...channel,
    mode: Mode.Anonymous,
    onError: (error) => logger.warn("Analytics failed", error),
  });
}
