// @ts-check

const { SubWriter } = require('./sub-writer');

/**
 * @typedef {import('./transport').ITransport} ITransport
 */

const levelMap = new Map([['DBG', 0], ['INF', 1], ['WRN', 2], ['ERR', 3]]);

/**
 *
 * @param {string} myLevel
 * @param {string} msgLevel
 */
function shouldLog(myLevel, msgLevel) {
  return levelMap.get(myLevel) <= levelMap.get(msgLevel);
}

class Logger {
  constructor() {
    this.level = 'INF';

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
   * Creates a sub logger for an area an instance
   * @param {string} name
   * @param {any} [instance]
   */
  create(name, instance) {
    this._log('DBG', 'LOG', `instance ${this.id} creating sub logger ${name}`);
    return new SubWriter(name, instance, this._log.bind(this));
  }

  _log(level, area, msg) {
    if (!shouldLog(this.level, level)) return;
    let formattedArea = area.toUpperCase();
    let formattedMsg = this._format(level, formattedArea, msg);
    this._write(formattedMsg);
  }

  _format(level, area, msg) {
    let date = new Date().toISOString();
    return `${date} [${level}] ${area}: ${msg}`;
  }

  _write(msg) {
    for (let transport of this.transports) {
      transport.write(msg);
    }
  }
}

exports.Logger = Logger;
