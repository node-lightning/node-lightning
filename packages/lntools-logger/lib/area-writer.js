// @ts-check
const util = require('util');

class AreaWriter {
  constructor(areaName, writer) {
    this.writer = writer;
    this.areaName = areaName;
  }

  /**
   *
   * @param {string} format format
   * @param {...any} args variadic arguments
   */
  debug() {
    let msg = util.format.apply(null, arguments);
    this.writer('DBG', this.areaName, msg);
  }

  /**
   *
   * @param {string} format format
   * @param {...any} args variadic arguments
   */
  info() {
    let msg = util.format.apply(null, arguments);
    this.writer('INF', this.areaName, msg);
  }

  /**
   *
   * @param {string} format format
   * @param {...any} args variadic arguments
   */
  warn() {
    let msg = util.format.apply(null, arguments);
    this.writer('WRN', this.areaName, msg);
  }

  /**
   *
   * @param {string} format format
   * @param {...any} args variadic arguments
   */
  error() {
    let msg = util.format.apply(null, arguments);
    this.writer('ERR', this.areaName, msg);
  }
}

exports.AreaWriter = AreaWriter;
