/** Holds the settings the build bakes in from the `GUESSIR_` environment variables. */
export const config: Readonly<{ apiBaseUrl: string }> = {
  apiBaseUrl: import.meta.env.GUESSIR_API_BASE_URL,
};
