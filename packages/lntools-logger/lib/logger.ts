import util from "util";
import { LogLevel } from "./loglevel";
import { WriteAction } from "./write-action";

export class Logger {
  public writer: WriteAction;
  public name: string;
  public instance: string;

  constructor(name: string, instance: string, writer: WriteAction) {
    this.writer = writer;
    this.name = name;
    this.instance = instance;

    // create bound methods so consumer doesnt lose context
    this.debug = this.debug.bind(this);
    this.info = this.info.bind(this);
    this.warn = this.warn.bind(this);
    this.error = this.error.bind(this);
  }

  /**
   * Write a debug message
   * @param format format
   * @param args variadic arguments
   */
  public debug(format: string, ...args: any[]) {
    const msg = util.format(format, ...args);
    this.writer(LogLevel.Debug, this.name, this.instance, msg);
  }

  /**
   * Write an info message
   * @param format format
   * @param args variadic arguments
   */
  public info(format: string, ...args: any[]) {
    const msg = util.format(format, ...args);
    this.writer(LogLevel.Info, this.name, this.instance, msg);
  }

  /**
   * Write a warning message
   * @param format format
   * @param args variadic arguments
   */
  public warn(format: string, ...args: any[]) {
    const msg = util.format(format, ...args);
    this.writer(LogLevel.Warn, this.name, this.instance, msg);
  }

  /**
   * Write an error message
   * @param format format
   * @param args variadic arguments
   */
  public error(format: string, ...args: any[]) {
    const msg = util.format(format, ...args);
    this.writer(LogLevel.Error, this.name, this.instance, msg);
  }
}
