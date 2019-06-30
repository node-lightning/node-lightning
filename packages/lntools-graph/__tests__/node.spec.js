const { expect } = require('chai');
const { Node } = require('../lib/node');

describe('Node class', () => {
  describe('.toJSON()', () => {
    let result;
    before(() => {
      let node = new Node();
      node.nodeId = Buffer.from(
        '039cc950286a8fa99218283d1adc2456e0d5e81be558da77dd6e85ba9a1fff5ad3',
        'hex'
      );
      node.lastUpdate = 1525181882;
      node.alias = Buffer.alloc(32);
      node.alias.write('yalls.org');
      node.rgbColor = Buffer.from('f8e71c', 'hex');
      node.addresses = [{ host: '34.200.252.146', port: 9735 }];
      result = node.toJSON();
    });

    it('should have string NodeId', () => {
      expect(result.nodeId).to.equal(
        '039cc950286a8fa99218283d1adc2456e0d5e81be558da77dd6e85ba9a1fff5ad3'
      );
    });

    it('should have alias string', () => {
      expect(result.alias).to.equal('yalls.org');
    });

    it('should have lastUpdate', () => {
      expect(result.lastUpdate).to.equal(1525181882);
    });

    it('should have rgbColor', () => {
      expect(result.rgbColor).to.equal('#f8e71c');
    });

    it('should have addresses', () => {
      expect(result.addresses).to.deep.equal([{ host: '34.200.252.146', port: 9735 }]);
    });
  });
});
