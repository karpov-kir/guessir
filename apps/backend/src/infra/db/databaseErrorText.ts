const sqlState = /^[0-9A-Z]{5}$/;

const field = (error: object, name: string) => {
  const value: unknown = Reflect.get(error, name);

  return typeof value === "string" ? value : undefined;
};

/**
 * Returns how a refusal of the database reads in a log: its SQLSTATE, and the table, column and
 * constraint it names. Returns undefined for an error that carries no SQLSTATE. The text leaves out
 * the database's message, since Postgres quotes a stored value there, as in `invalid input syntax
 * for type integer: "…"`, and the stored texts are the answers to the games.
 */
export function databaseErrorText(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null) {
    return undefined;
  }

  const code = field(error, "code");

  if (code === undefined || !sqlState.test(code)) {
    return undefined;
  }

  const names = (["table", "column", "constraint"] as const)
    .map((name) => [name, field(error, name)] as const)
    .filter(([, value]) => value !== undefined)
    .map(([name, value]) => `${name} ${value}`);

  return [`SQLSTATE ${code}`, ...names].join(", ");
}
