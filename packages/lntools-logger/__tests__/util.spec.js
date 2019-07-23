const { expect } = require('chai');
const { shouldLog } = require('../lib/util');

describe('.shouldLog', () => {
  it('should return false when invalid log level', () => {
    expect(shouldLog('INF', 'DBG')).to.be.false;
  });
  it('should return false when log level below current log level setting', () => {
    expect(shouldLog('INF', 'DER')).to.be.false;
  });
  it('should return true when at current log level setting', () => {
    expect(shouldLog('INF', 'INF')).to.be.true;
  });
  it('should return true when above current log level setting', () => {
    expect(shouldLog('INF', 'ERR')).to.be.true;
  });
});
