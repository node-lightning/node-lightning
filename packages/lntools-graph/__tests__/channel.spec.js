const { expect } = require('chai');
const { Channel } = require('../lib/channel');
const { ChannelSettings } = require('../lib/channel-settings');

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
});
