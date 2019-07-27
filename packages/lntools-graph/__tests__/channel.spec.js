const { expect } = require('chai');
const { Channel } = require('../lib/channel');
const { ChannelSettings } = require('../lib/channel-settings');
// const BN = require('bn.js');

describe('Channel class', () => {
  describe('.isRoutable', () => {
    it('should return false by default', () => {
      let channel = new Channel();
      expect(channel.isRoutable).to.be.false;
    });

    it('should return true when nodes and node1 settings', () => {
      let channel = new Channel();
      channel.nodeId1 = Buffer.alloc(32);
      channel.nodeId2 = Buffer.alloc(32);
      channel.node1Settings = new ChannelSettings();
      expect(channel.isRoutable).to.be.true;
    });

    it('should return true when nodes and node2 settings', () => {
      let channel = new Channel();
      channel.nodeId1 = Buffer.alloc(32);
      channel.nodeId2 = Buffer.alloc(32);
      channel.node2Settings = new ChannelSettings();
      expect(channel.isRoutable).to.be.true;
    });

    it('should return true when node and both settings are defined', () => {
      let channel = new Channel();
      channel.nodeId1 = Buffer.alloc(32);
      channel.nodeId2 = Buffer.alloc(32);
      channel.node1Settings = new ChannelSettings();
      channel.node2Settings = new ChannelSettings();
      expect(channel.isRoutable).to.be.true;
    });
  });

  describe('.updateSettings', () => {
    let testGroups = [['node1', 0, 'node1Settings'], ['node2', 1, 'node2Settings']];

    for (let [title, direction, channelProp] of testGroups) {
      describe(title, () => {
        let channel;

        beforeEach(() => {
          channel = new Channel();
        });

        it('should apply settings when none exist', () => {
          let s = new ChannelSettings();
          s.direction = direction;
          let result = channel.updateSettings(s);
          expect(result).to.be.true;
          expect(channel[channelProp]).to.equal(s);
        });

        it('should update settings when newer', () => {
          let s1 = new ChannelSettings();
          s1.direction = direction;
          s1.timestamp = 0;
          channel.updateSettings(s1);

          let s2 = new ChannelSettings();
          s2.direction = direction;
          s2.timestamp = 1;
          channel.updateSettings(s2);

          expect(channel[channelProp]).to.equal(s2);
        });

        it('should ignore settings when older', () => {
          let s1 = new ChannelSettings();
          s1.direction = direction;
          s1.timestamp = 2;
          channel.updateSettings(s1);

          let s2 = new ChannelSettings();
          s2.direction = direction;
          s2.timestamp = 1;
          channel.updateSettings(s2);

          expect(channel[channelProp]).to.equal(s1);
        });
      });
    }

    describe('node2', () => {});
  });

  // describe('.toJSON()', () => {
  //   let result;
  //   before(() => {
  //     let c = new Channel();
  //     c.shortChannelId = Buffer.from('13a9090000030000', 'hex');
  //     c.chainHash = Buffer.from(
  //       '43497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea330900000000',
  //       'hex'
  //     );
  //     c.channelPoint = {
  //       txId: 'dafb459ccece105609ed7fd63a515ce9df0d3c02fb05ebeffe28c2899b60a5fd',
  //       output: 0,
  //     };
  //     c.capacity = new BN(16777216);
  //     c.nodeId1 = Buffer.from(
  //       '036b96e4713c5f84dcb8030592e1bd42a2d9a43d91fa2e535b9bfd05f2c5def9b9',
  //       'hex'
  //     );
  //     c.nodeId2 = Buffer.from(
  //       '039cc950286a8fa99218283d1adc2456e0d5e81be558da77dd6e85ba9a1fff5ad3',
  //       'hex'
  //     );
  //     c.node1Settings = new ChannelSettings();
  //     c.node1Settings.direction = 0;
  //     c.node1Settings.timestamp = 1558027640;
  //     c.node1Settings.cltvExpiryDelta = 144;
  //     c.node1Settings.htlcMinimumMsat = new BN(1000);
  //     c.node1Settings.htlcMaximumMsat = undefined;
  //     c.node1Settings.feeBaseMsat = 1000;
  //     c.node1Settings.feeProportionalMillionths = 1;
  //     c.node1Settings.disabled = true;

  //     c.node2Settings = new ChannelSettings();
  //     c.node2Settings.direction = 1;
  //     c.node2Settings.timestamp = 1525140553;
  //     c.node2Settings.cltvExpiryDelta = 144;
  //     c.node2Settings.htlcMinimumMsat = new BN(1000);
  //     c.node2Settings.htlcMaximumMsat = undefined;
  //     c.node2Settings.feeBaseMsat = 1000;
  //     c.node2Settings.feeProportionalMillionths = 1;
  //     c.node2Settings.disabled = false;

  //     result = c.toJSON();
  //   });

  //   it('should have not have chainHash', () => {
  //     expect(result.chainHash).to.be.undefined;
  //   });

  //   it('should have channelPoint string', () => {
  //     expect(result.channelPoint).to.equal(
  //       'dafb459ccece105609ed7fd63a515ce9df0d3c02fb05ebeffe28c2899b60a5fd:0'
  //     );
  //   });

  //   it('should have capacity as string', () => {
  //     expect(result.capacity).to.equal('16777216');
  //   });

  //   it('should have nodeId1 string', () => {
  //     expect(result.nodeId1).to.equal(
  //       '036b96e4713c5f84dcb8030592e1bd42a2d9a43d91fa2e535b9bfd05f2c5def9b9'
  //     );
  //   });

  //   it('should have nodeId1 string', () => {
  //     expect(result.nodeId2).to.equal(
  //       '039cc950286a8fa99218283d1adc2456e0d5e81be558da77dd6e85ba9a1fff5ad3'
  //     );
  //   });

  //   it('should have node1Settings object', () => {
  //     expect(result.node1Settings).to.deep.equal({
  //       timestamp: 1558027640,
  //       cltvExpiryDelta: 144,
  //       htlcMinimumMsat: '1000',
  //       htlcMaximumMsat: undefined,
  //       feeBaseMsat: '1000',
  //       feeProportionalMillionths: '1',
  //       disabled: true,
  //     });
  //   });

  //   it('should have node2Settings object', () => {
  //     expect(result.node2Settings).to.deep.equal({
  //       timestamp: 1525140553,
  //       cltvExpiryDelta: 144,
  //       htlcMinimumMsat: '1000',
  //       htlcMaximumMsat: undefined,
  //       feeBaseMsat: '1000',
  //       feeProportionalMillionths: '1',
  //       disabled: false,
  //     });
  //   });
  // });
});
