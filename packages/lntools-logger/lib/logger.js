// @ts-check

const { AreaWriter } = require('./area-writer');

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

  area(name) {
    this._log('INF', 'LOG', `instance ${this.id} creating area logger for ${name}`);
    return new AreaWriter(name, this._log.bind(this));
  }

  _log(level, area, msg) {
    if (!shouldLog(this.level, level)) return;
    let formattedMsg = this._format(level, area, msg);
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
