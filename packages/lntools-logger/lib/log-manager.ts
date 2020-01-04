import { ITransport } from "./itransport";
import { Logger } from "./logger";
import { LogLevel } from "./loglevel";
import { shouldLog } from "./util";

export class LogManager {
  /**
   * Current log level setting
   */
  public level: LogLevel;

  /**
   * Unique identifier for the log manager
   */
  public id: string;

  /**
   * List of transports being used
   */
  public transports: ITransport[];

  /**
   * LogManager allows the createion of sub-loggers and includes transports
   * where logs are written to.
   */
  constructor() {
    this.level = LogLevel.Info;
    this.id = Math.random()
      .toString()
      .substr(2);
    this.transports = [];
  }

  /**
   * Creates a logger for an area an instance
   */
  public create(name: string, instance?: string) {
    this._log(
      LogLevel.Debug,
      "LOG",
      this.id,
      `new sub logger for ${name} ${instance || "<no instance>"}`,
    );
    return new Logger(name, instance, this._log.bind(this));
  }

  /**
   * Performs logging
   */
  private _log(level: LogLevel, area: string, instance: string, msg: string) {
    if (!shouldLog(this.level, level)) return;
    const formattedArea = area.toUpperCase();
    const formattedMsg = this._format(level, formattedArea, instance, msg);
    this._write(formattedMsg);
  }

  /**
   * Format message
   */
  private _format(level: LogLevel, area: string, instance: string, msg: string): string {
    const date = new Date().toISOString();
    const instanceFmt = instance ? " " + instance : "";
    return `${date} [${level}] ${area}${instanceFmt}: ${msg}`;
  }

  /**
   * Writes a formatted message to all transports
   */
  private _write(msg: string) {
    for (const transport of this.transports) {
      transport.write(msg);
    }
  }
}

exports.LogManager = LogManager;
