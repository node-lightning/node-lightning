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
   * @param {string} format format
   * @param {...any} args variadic arguments
   */
  public debug() {
    const msg = util.format.apply(null, arguments);
    this.writer(LogLevel.Debug, this.name, this.instance, msg);
  }

  /**
   * Write an info message
   */
  public info() {
    const msg = util.format.apply(null, arguments);
    this.writer(LogLevel.Info, this.name, this.instance, msg);
  }

  /**
   * Write a warning message
   */
  public warn() {
    const msg = util.format.apply(null, arguments);
    this.writer(LogLevel.Warn, this.name, this.instance, msg);
  }

  /**
   * Write an error message
   */
  public error() {
    const msg = util.format.apply(null, arguments);
    this.writer(LogLevel.Error, this.name, this.instance, msg);
  }
}
