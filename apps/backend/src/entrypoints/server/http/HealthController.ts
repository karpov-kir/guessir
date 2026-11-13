import { Controller, Get } from "@nestjs/common";

import { version } from "../version.js";

/**
 * Answers the backend's package version, the X.Y.Z its stable release is tagged with. A dev release
 * of that version answers the same X.Y.Z.
 */
@Controller("health")
export class HealthController {
  @Get()
  health() {
    return { version };
  }
}
