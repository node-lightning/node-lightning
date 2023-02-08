/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import util from "util";
import { LogLevel } from "./log-level";
import { ITransport } from "./transport";
import { shouldLog } from "./util";

export interface ILogger {
    area: string;
    instance: string;
    trace(...args: any[]): void;
    debug(...args: any[]): void;
    info(...args: any[]): void;
    warn(...args: any[]): void;
    error(...args: any[]): void;
    sub(area: string, instance?: string): ILogger;
}

export class Logger implements ILogger {
    public readonly area: string;
    public readonly instance: string;

    private _transports: ITransport[];
    private _level: LogLevel;
    private _root: Logger;

    constructor(area: string = "", instance?: string) {
        this._root = this;
        this.area = area;
        this.instance = instance;
        this._level = LogLevel.Info;
        this._transports = [];

        // create bound methods so consumer doesn't lose context
        this.trace = this.trace.bind(this);
        this.debug = this.debug.bind(this);
        this.info = this.info.bind(this);
        this.warn = this.warn.bind(this);
        this.error = this.error.bind(this);
    }

    /**
     * Configured log-level
     */
    public get level() {
        return this._root._level;
    }

    public set level(value: LogLevel) {
        this._root._level = value;
    }

    /**
     * Gets the available transports
     */
    public get transports() {
        return this._root._transports;
    }

    /**
     * Constructs a sub-logger under the current parent
     * @param area optional area, if not provided it inherits from the parent
     * @param instance optional instance, if not provied it inherits from the parent
     */
    public sub(area?: string, instance?: string): ILogger {
        const logger = new Logger(area || this.area, instance || this.instance);
        logger._root = this._root;
        return logger;
    }

    /**
     * Write a trace message
     */
    public trace(...args: any[]) {
        this._log(LogLevel.Trace, this.area, this.instance, args);
    }

    /**
     * Write a debug message
     * @param args variadic arguments
     */
    public debug(...args: any[]) {
        this._log(LogLevel.Debug, this.area, this.instance, args);
    }

    /**
     * Write an info message
     * @param args variadic arguments
     */
    public info(...args: any[]) {
        this._log(LogLevel.Info, this.area, this.instance, args);
    }

    /**
     * Write a warning message
     * @param args variadic arguments
     */
    public warn(...args: any[]) {
        this._log(LogLevel.Warn, this.area, this.instance, args);
    }

    /**
     * Write an error message
     * @param args variadic arguments
     */
    public error(...args: any[]) {
        this._log(LogLevel.Error, this.area, this.instance, args);
    }

    /////////////////////////////

    private _log(level: LogLevel, area: string, instance: string, args: any[]) {
        if (!shouldLog(this.level, level)) return;
        const formattedMsg = this._format(level, area, instance, args);
        this._write(formattedMsg);
    }

    private _format(level: LogLevel, area: string, instance: string, args: any[]): string {
        const date = new Date().toISOString();
        const formattedArea = area ? " " + area : "";
        const instanceFmt = instance ? " " + instance : "";

        // convert buffers to hex encodings
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        args = args.map(arg => (Buffer.isBuffer(arg) ? arg.toString("hex") : arg));

        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        const msg = util.formatWithOptions({ colors: false, depth: 10 }, args[0], ...args.slice(1));
        return `${date} [${level}]${formattedArea}${instanceFmt}: ${msg}`;
    }

    private _write(msg: string) {
        for (const transport of this._root.transports) {
            transport.write(msg);
        }
    }
}
