const { expect } = require('chai');
const sinon = require('sinon');
const { Graph } = require('../lib/graph');
const { GraphManager } = require('../lib/graph-manager');
const { ErrorMessage } = require('@lntools/wire');
const { ChannelAnnouncementMessage } = require('@lntools/wire');
const { ChannelUpdateMessage } = require('@lntools/wire');
const { NodeAnnouncementMessage } = require('@lntools/wire');

describe('GraphManager', () => {
  /** @type {Graph} */
  let graph;

  beforeEach(() => {
    graph = sinon.createStubInstance(Graph);
  });

  it('should ignore non-p2p messages', () => {
    let sut = new GraphManager(graph);
    sut.enqueue(new ErrorMessage());
    expect(sut.unprocessed).to.equal(0);
  });

  describe('ChannelAnnouncementMessage', () => {
    it('should enqueue message', () => {
      let sut = new GraphManager(graph);
      sut.enqueue(new ChannelAnnouncementMessage());
      expect(sut.unprocessed).to.equal(1);
    });

    it('should process message', done => {
      let sut = new GraphManager(graph);
      sut.enqueue(new ChannelAnnouncementMessage());
      setTimeout(() => {
        expect(graph.processChannelAnnouncement.called).to.be.true;
        done();
      }, 0);
    });
  });

  describe('ChannelUpdateMessage', () => {
    it('should enqueue message', () => {
      let sut = new GraphManager(graph);
      sut.enqueue(new ChannelUpdateMessage());
      expect(sut.unprocessed).to.equal(1);
    });

    it('should process message', done => {
      let sut = new GraphManager(graph);
      sut.enqueue(new ChannelUpdateMessage());
      setTimeout(() => {
        expect(graph.processChannelUpdate.called).to.be.true;
        done();
      }, 0);
    });
  });

  describe('NodeAnnouncementMessage', () => {
    it('should enqueue message', () => {
      let sut = new GraphManager(graph);
      sut.enqueue(new NodeAnnouncementMessage());
      expect(sut.unprocessed).to.equal(1);
    });

    it('should process message', done => {
      let sut = new GraphManager(graph);
      sut.enqueue(new NodeAnnouncementMessage());
      setTimeout(() => {
        expect(graph.processNodeAnnouncement.called).to.be.true;
        done();
      }, 0);
    });
  });
});
