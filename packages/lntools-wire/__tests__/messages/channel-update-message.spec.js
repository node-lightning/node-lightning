const { expect } = require('chai');
const ChannelUpdateMessage = require('../../lib/messages/channel-update-message');

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
      expect(result.chain_hash).to.deep.equal(
        Buffer.from('43497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea330900000000', 'hex')
      );
      expect(result.short_channel_id).to.deep.equal(Buffer.from('13a8b30001130000', 'hex'));
      expect(result.timestamp).to.equal(1554581498);
      expect(result.flags).to.equal(256);
      expect(result.cltv_expiry_delta).to.equal(144);
      expect(result.htlc_minimum_msat).to.deep.equal(Buffer.from('00000000000003e8', 'hex'));
      expect(result.fee_base_msat).to.equal(1000);
      expect(result.fee_proportional_millionths).to.equal(1);
    });
  });

  describe('serialize', () => {});
});
