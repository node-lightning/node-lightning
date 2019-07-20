// @ts-check

const util = require('util');

class SubWriter {
  /**
   *
   * @param {string} name
   * @param {string} [instance]
   * @param {(level: string, area: string, instance: string, msg: string) => void} writer
   */
  constructor(name, instance, writer) {
    /**
     * @type {(level: string, area: string, instance:string, msg: string) => void}
     */
    this.writer = writer;

    /**
     * @type {string}
     */
    this.name = name;

    /**
     * @type {string}
     */
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
  debug() {
    let msg = util.format.apply(null, arguments);
    this.writer('DBG', this.name, this.instance, msg);
  }

  /**
   * Write an info message
   * @param {string} format format
   * @param {...any} args variadic arguments
   */
  info() {
    let msg = util.format.apply(null, arguments);
    this.writer('INF', this.name, this.instance, msg);
  }

  /**
   * Write a warning message
   * @param {string} format format
   * @param {...any} args variadic arguments
   */
  warn() {
    let msg = util.format.apply(null, arguments);
    this.writer('WRN', this.name, this.instance, msg);
  }

  /**
   * Write an error message
   * @param {string} format format
   * @param {...any} args variadic arguments
   */
  error() {
    let msg = util.format.apply(null, arguments);
    this.writer('ERR', this.name, this.instance, msg);
  }
}

exports.SubWriter = SubWriter;
