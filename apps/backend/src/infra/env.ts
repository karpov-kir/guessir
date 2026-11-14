/** Returns the process environment, which the composition root parses into the config. */
export const readEnv = (): Readonly<Record<string, string | undefined>> => ({ ...process.env });
