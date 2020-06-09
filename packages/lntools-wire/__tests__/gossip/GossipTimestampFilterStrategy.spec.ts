// tslint:disable: no-unused-expression

import { ILogger } from "@lntools/logger";
import { expect } from "chai";
import { PeerGossipReceiveState } from "../../lib/gossip/GossipReceiveState";
import { GossipTimestampFilterStrategy } from "../../lib/gossip/GossipTimestampFilterStrategy";
import { GossipTimestampFilterMessage } from "../../lib/messages/GossipTimestampFilterMessage";
import { createFakeLogger, createFakePeer } from "../_test-utils";

describe("GossipTimestampFilterStrategry", () => {
  let chainHash: Buffer;
  let sut: GossipTimestampFilterStrategy;
  let peer: any;
  let logger: ILogger;

  beforeEach(() => {
    chainHash = Buffer.alloc(32, 1);
    peer = createFakePeer();
    logger = createFakeLogger();
    sut = new GossipTimestampFilterStrategy(chainHash, peer, logger);
  });

  describe("initial state", () => {
    it("in 'inactive' state", () => {
      expect(sut.receiveState).to.equal(PeerGossipReceiveState.Inactive);
    });

    it("has uint32_max start", () => {
      expect(sut.firstTimestamp).to.equal(4294967295);
    });

    it("has zero range", () => {
      expect(sut.timestampRange).to.equal(0);
    });
  });

  describe(".activate()", () => {
    it("should send gossip_timestamp_filter", () => {
      sut.activate(1590174550, 4294967294);
      expect(peer.sendMessage.callCount).to.equal(1);

      const msg: GossipTimestampFilterMessage = peer.sendMessage.args[0][0];
      expect(msg.firstTimestamp).to.equal(1590174550);
      expect(msg.timestampRange).to.equal(4294967294);
    });

    it("should transition state to 'receiving'", () => {
      sut.activate(1590174550, 4294967294);
      expect(sut.receiveState).to.equal(PeerGossipReceiveState.Receiving);
    });

    it("sets timestamp", () => {
      sut.activate(1590174550, 4294967294);
      expect(sut.firstTimestamp).to.equal(1590174550);
    });

    it("sets range", () => {
      sut.activate(1590174550, 4294967294);
      expect(sut.timestampRange).to.equal(4294967294);
    });
  });

  describe(".deactivate()", () => {
    it("should send gossip_timestamp_filter", () => {
      sut.deactivate();
      expect(peer.sendMessage.callCount).to.equal(1);

      const msg: GossipTimestampFilterMessage = peer.sendMessage.args[0][0];
      expect(msg.firstTimestamp).to.equal(4294967295);
      expect(msg.timestampRange).to.equal(0);
    });

    it("should transition state to 'inactive'", () => {
      sut.deactivate();
      expect(sut.receiveState).to.equal(PeerGossipReceiveState.Inactive);
    });

    it("sets timestamp", () => {
      sut.deactivate();
      expect(sut.firstTimestamp).to.equal(4294967295);
    });

    it("sets range", () => {
      sut.deactivate();
      expect(sut.timestampRange).to.equal(0);
    });
  });
});
