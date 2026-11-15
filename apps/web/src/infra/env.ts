/** Returns the variables the build bakes in, which the composition root parses into the config. */
export const readEnv = (): Readonly<Record<string, unknown>> => ({ ...import.meta.env });
