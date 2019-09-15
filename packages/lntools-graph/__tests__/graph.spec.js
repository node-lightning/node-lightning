const { expect } = require('chai');
const { Node } = require('../lib/node');
const { Channel } = require('../lib/channel');
const { Graph } = require('../lib/graph');
const { OutPoint } = require('../lib/outpoint');
const { ShortChannelId } = require('@lntools/wire');

describe('Graph', () => {
  /** @type {Graph} */
  let g;

  /** @type {Node} */
  let n1, n2;

  /** @type {Channel} */
  let c;

  beforeEach(() => {
    g = new Graph();

    n1 = new Node();
    n1.nodeId = Buffer.alloc(32);
    n1.nodeId.writeInt8(1, 0);

    n2 = new Node();
    n2.nodeId = Buffer.alloc(32);
    n2.nodeId.writeInt8(2, 0);

    c = new Channel();
    c.shortChannelId = new ShortChannelId(600000, 1, 0);
    c.nodeId1 = n1.nodeId;
    c.nodeId2 = n2.nodeId;
  });

  describe('.addNode', () => {
    it('should add the node', () => {
      g.addNode(n1);
      expect(g.nodes.size).to.equal(1);
      expect(g.nodes.get(n1.nodeId.toString('hex'))).to.equal(n1);
    });
  });

  describe('.addChannel', () => {
    it('should throw when node1 doesnt exist', () => {
      g.addNode(n2);
      expect(() => g.addChannel(c)).to.throw();
    });

    it('should throw when node2 doesnt exist', () => {
      g.addNode(n1);
      expect(() => g.addChannel(c)).to.throw();
    });

    it('should add the channel', () => {
      g.addNode(n1);
      g.addNode(n2);
      g.addChannel(c);
      expect(g.channels.size).to.equal(1);
      expect(g.channels.get(c.shortChannelId.toString())).to.equal(c);
    });

    it('should add link for node1', () => {
      g.addNode(n1);
      g.addNode(n2);
      g.addChannel(c);
      expect(n1.channels.size).to.equal(1);
      expect(n1.channels.get(c.shortChannelId.toString())).to.equal(c);
    });

    it('should add link for node2', () => {
      g.addNode(n1);
      g.addNode(n2);
      g.addChannel(c);
      expect(n2.channels.size).to.equal(1);
      expect(n2.channels.get(c.shortChannelId.toString())).to.equal(c);
    });
  });

  describe('.getNode', () => {
    it('should return node when it exists', () => {
      g.addNode(n1);
      let r = g.getNode(n1.nodeId.toString('hex'));
      expect(r).to.equal(n1);
    });

    it('should return undefined when node doesnt exist', () => {
      let r = g.getNode(n1.nodeId.toString('hex'));
      expect(r).to.be.undefined;
    });
  });

  describe('.getChannel', () => {
    it('should return the channel', () => {
      g.addNode(n1);
      g.addNode(n2);
      g.addChannel(c);

      let r = g.getChannel(c.shortChannelId);
      expect(r).to.equal(c);
    });

    it('should return undefined when channel not found', () => {
      let r = g.getChannel(c.shortChannelId);
      expect(r).to.be.undefined;
    });
  });

  describe('.removeChannel', () => {
    describe('when channel exists', () => {
      beforeEach(() => {
        g.addNode(n1);
        g.addNode(n2);
        g.addChannel(c);
        g.removeChannel(c);
      });

      it('should remove the channel', () => {
        let r = g.getChannel(c.shortChannelId);
        expect(r).to.be.undefined;
      });

      it('should remove the channel for node1', () => {
        let r = n1.channels.get(c.shortChannelId.toString());
        expect(r).to.be.undefined;
      });

      it('should remove the channel for node2', () => {
        let r = n2.channels.get(c.shortChannelId.toString());
        expect(r).to.be.undefined;
      });
    });
  });

  describe('.findChannelByChanPoint', () => {
    it('should return the channel when outpoint exists', () => {
      let o = new OutPoint('1111111111111111111111111111111111111111111111111111111111111111', 0);
      c.channelPoint = o;
      g.addNode(n1);
      g.addNode(n2);
      g.addChannel(c);

      let r = g.findChanByChanPoint(o);
      expect(r).to.equal(c);
    });

    it('should return undefined when outpoint doest exist', () => {
      let o = new OutPoint('1111111111111111111111111111111111111111111111111111111111111111', 0);
      let r = g.findChanByChanPoint(o);
      expect(r).to.be.undefined;
    });
  });

  describe('.hasChannel', () => {
    it('should return true when node has a channel', () => {
      g.addNode(n1);
      g.addNode(n2);
      g.addChannel(c);
      expect(g.hasChannel(n1.nodeId)).to.be.true;
    });

    it('should return false when channel exists', () => {
      expect(g.hasChannel(n1.nodeId)).to.be.false;
    });
  });
});
