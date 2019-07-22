// @ts-check

/**
 * Log level
 * @enum {number}
 */
const LevelValueMap = {
  DBG: 0,
  INF: 1,
  WRN: 2,
  ERR: 3,
};

/**
 * Helper function to determine if a log message is at the appropraite
 * level to be included in the logs
 * @param {string} myLevel
 * @param {string} msgLevel
 */
function shouldLog(myLevel, msgLevel) {
  return LevelValueMap[msgLevel] !== undefined && LevelValueMap[myLevel] <= LevelValueMap[msgLevel];
}

exports.shouldLog = shouldLog;
