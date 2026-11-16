// Vendored from karpov-kir/configs, ai/kk-flavor/standards/architecture/Logger.ts at c1e1e43c.

/**
 * Log levels (lower number = more verbose). `Silent` is highest, so it drops every record.
 */
export enum LogLevel {
  Debug = 10,
  Info = 20,
  Warn = 30,
  Error = 40,
  Silent = 100,
}

/** One thing a logger hands its sink: a line at a level, or the start or end of a group of lines. */
export type LogRecord =
  | {
      kind: "line";
      level: Exclude<LogLevel, LogLevel.Silent>;
      scope: readonly string[];
      args: readonly unknown[];
    }
  | { kind: "group"; collapsed: boolean; scope: readonly string[]; label: string }
  | { kind: "groupEnd" };

/** Writes records out. Its implementations live in `infra`, the one layer that writes log output. */
export type LogSink = (record: LogRecord) => void;

/**
 * Level-based logging with scope labels, which writes nothing itself: it hands each record to the sink the composition
 * root installs. Modules reach it directly:
 *
 *   const logger = Logger.root.scope('Editor').scope('LOD');
 *   logger.debug('foo'); // the sink gets { kind: 'line', level: Debug, scope: ['Editor', 'LOD'], args: ['foo'] }
 *
 * The level and the sink are app-global: `Logger.install(sink, level)` sets both for every logger. A record written
 * before that is dropped, so no module writes when it is imported.
 */
export class Logger {
  private static sink: LogSink | undefined;
  private static level: LogLevel = LogLevel.Silent;
  // The groups the sink has opened, so a groupEnd reaches it only for a group it saw open.
  private static openGroups = 0;

  /** The single app-wide logger. The constructor is private, so every logger derives from this one through `scope`. */
  static readonly root = new Logger([]);

  /**
   * Sets the sink and the level for every logger. The composition root calls it before anything logs. An app with one
   * sink calls it first, before it reads the environment. An app with a sink per `LOG_FORMAT` calls it
   * after that read, with the sink `LOG_FORMAT` names. Both call it again once the config parses.
   */
  static install(sink: LogSink, level: LogLevel): void {
    Logger.sink = sink;
    Logger.level = level;
  }

  private constructor(private readonly labels: readonly string[]) {}

  scope(label: string): Logger {
    return new Logger([...this.labels, label]);
  }

  debug(...args: unknown[]): void {
    this.line(LogLevel.Debug, args);
  }

  info(...args: unknown[]): void {
    this.line(LogLevel.Info, args);
  }

  warn(...args: unknown[]): void {
    this.line(LogLevel.Warn, args);
  }

  error(...args: unknown[]): void {
    this.line(LogLevel.Error, args);
  }

  group(label: string): void {
    this.openGroup(false, label);
  }

  groupCollapsed(label: string): void {
    this.openGroup(true, label);
  }

  groupEnd(): void {
    if (Logger.sink !== undefined && Logger.openGroups > 0) {
      Logger.openGroups--;
      Logger.sink({ kind: "groupEnd" });
    }
  }

  private openGroup(collapsed: boolean, label: string): void {
    if (this.emit(LogLevel.Info, { kind: "group", collapsed, scope: this.labels, label })) {
      Logger.openGroups++;
    }
  }

  private line(level: Exclude<LogLevel, LogLevel.Silent>, args: unknown[]): void {
    this.emit(level, { kind: "line", level, scope: this.labels, args });
  }

  /** Hands a record at a level to the sink, and returns whether the sink got it. */
  private emit(level: LogLevel, record: LogRecord): boolean {
    if (Logger.sink === undefined || level < Logger.level) {
      return false;
    }
    Logger.sink(record);
    return true;
  }
}
