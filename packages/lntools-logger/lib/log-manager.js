// @ts-check

const { Logger } = require('./logger');
const { shouldLog } = require('./util');

/**
 * @typedef {import('./transport').ITransport} ITransport
 */

class LogManager {
  /**
   * LogManager allows the createion of sub-loggers and includes transports
   * where logs are written to.
   */
  constructor() {
    /**
     * Current log level setting.
     * @type {string}
     */
    this.level = 'INF';

    /**
     * Unique identifier for the log manager
     */
    this.id = Math.random()
      .toString()
      .substr(2);

    /**
     * List of transports
     * @type {ITransport[]}
     */
    this.transports = [];
  }

  /**
   * Creates a logger for an area an instance
   * @param {string} name
   * @param {string} [instance]
   */
  create(name, instance) {
    this._log('DBG', 'LOG', this.id, `new sub logger for ${name} ${instance}`);
    return new Logger(name, instance, this._log.bind(this));
  }

  /**
   * Primary log function
   * @private
   * @param {string} level log
   * @param {string} area area
   * @param {string} [instance] instance name
   * @param {string} msg formattted message
   */
  _log(level, area, instance, msg) {
    if (!shouldLog(this.level, level)) return;
    let formattedArea = area.toUpperCase();
    let formattedMsg = this._format(level, formattedArea, instance, msg);
    this._write(formattedMsg);
  }

  /**
   * Format message
   * @private
   * @param {string} level
   * @param {string} area
   * @param {string} instance
   * @param {string} msg
   */
  _format(level, area, instance, msg) {
    let date = new Date().toISOString();
    let instanceFmt = instance ? ' ' + instance : '';
    return `${date} [${level}] ${area}${instanceFmt}: ${msg}`;
  }

  /**
   * Writes a formatted message to all transports
   * @param {string} msg
   */
  _write(msg) {
    for (let transport of this.transports) {
      transport.write(msg);
    }
  }
}

exports.LogManager = LogManager;
