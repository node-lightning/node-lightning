const { expect } = require('chai');
const { ChannelUpdateMessage } = require('../../lib/messages/channel-update-message');

describe('ChannelUpdateMessage', () => {
  let input;

  beforeEach(() => {
    input = Buffer.from(
      '010260957fec5b79b49303c1abe01b188842512c91ff465bdde51e255416e63bb293124a8dfea82644ee554ef8bd13d6ffbd20b6e297a1eae3c46ba1b188fd1d86c543497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea33090000000013a8b300011300005ca907fa0100009000000000000003e8000003e8000000010000000005f5e100',
      'hex'
    );
  });

  describe('deserialize', () => {
    it('should deserialize without error', () => {
      let result = ChannelUpdateMessage.deserialize(input);
      expect(result.type).to.equal(258);
      expect(result.chainHash).to.deep.equal(
        Buffer.from('43497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea330900000000', 'hex')
      );
      expect(result.shortChannelId).to.deep.equal(Buffer.from('13a8b30001130000', 'hex'));
      expect(result.timestamp).to.equal(1554581498);
      expect(result.messageFlags).to.equal(1);
      expect(result.channelFlags).to.equal(0);
      expect(result.cltvExpiryDelta).to.equal(144);
      expect(result.htlcMinimumMsat.toNumber()).to.equal(1000);
      expect(result.htlcMaximumMsat.toNumber()).to.equal(100000000);
      expect(result.feeBaseMsat).to.equal(1000);
      expect(result.feeProportionalMillionths).to.equal(1);
      expect(result.direction).to.equal(0);
      expect(result.disabled).to.be.false;
    });
  });

  describe('serialize', () => {});
});
