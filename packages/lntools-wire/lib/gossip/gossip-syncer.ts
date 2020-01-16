import { MESSAGE_TYPE } from "../message-type";
import { ChannelAnnouncementMessage } from "../messages/channel-announcement-message";
import { QueryChannelRangeMessage } from "../messages/query-channel-range-message";
import { QueryShortChannelIdsMessage } from "../messages/query-short-channel-ids-message";
import { ReplyChannelRangeMessage } from "../messages/reply-channel-range-message";
import { ReplyShortChannelIdsEndMessage } from "../messages/reply-short-channel-ids-end-message";
import { IWireMessage } from "../messages/wire-message";
import { Peer } from "../peer";
import { ShortChannelId } from "../shortchanid";

export type GossipContextOptions = {
  peer: Peer;
  chainHash: Buffer;
  fullSync?: boolean;
};

export class GossipSyncer {
  public peer: Peer;
  private _fullSync: boolean;
  private _chainHash: Buffer;
  private _state: IGossipState;

  constructor(options: GossipContextOptions) {
    this.peer = options.peer;
    this._chainHash = options.chainHash;
    this._fullSync = options.fullSync || true;
    this._state = new PendingState(this);

    this.peer.on("ready", this.start.bind(this));
    this.peer.on("message", this._handleMessage.bind(this));
  }

  get state() {
    return this._state;
  }

  public start() {
    const firstBlocknum = 0;
    const numberOfBlocks = 4294967295;
    if (!this._fullSync) {
      // query the messageStore to see what message we need
    }
    const queryRangeMessage = new QueryChannelRangeMessage();
    queryRangeMessage.chainHash = this._chainHash;
    queryRangeMessage.firstBlocknum = firstBlocknum;
    queryRangeMessage.numberOfBlocks = numberOfBlocks;
    this.peer.sendMessage(queryRangeMessage);
    this._state = new AwaitingChannelRangeReply(this);
  }

  private _handleMessage(msg: IWireMessage) {
    switch (msg.type) {
      case MESSAGE_TYPE.QUERY_CHANNEL_RANGE:
        this._state = this._state.onQueryChannelRange(msg as QueryChannelRangeMessage);
        break;
      case MESSAGE_TYPE.REPLY_CHANNEL_RANGE:
        this._state = this._state.onReplyChannelRange(msg as ReplyChannelRangeMessage);
        break;
      case MESSAGE_TYPE.QUERY_SHORT_CHANNEL_IDS:
        this._state = this._state.onQueryShortIds(msg as QueryShortChannelIdsMessage);
        break;
      case MESSAGE_TYPE.REPLY_SHORT_CHANNEL_IDS_END:
        this._state = this._state.onReplyShortIdsEnd(msg as ReplyShortChannelIdsEndMessage);
        break;
      case MESSAGE_TYPE.CHANNEL_ANNOUNCEMENT:
        this._state = this._state.onChannelAnnouncement(msg as ChannelAnnouncementMessage);
    }
  }
}

export interface IGossipState {
  onQueryChannelRange(msg: QueryChannelRangeMessage);
  onReplyChannelRange(msg: ReplyChannelRangeMessage);
  onQueryShortIds(msg: QueryShortChannelIdsMessage);
  onReplyShortIdsEnd(msg: ReplyShortChannelIdsEndMessage);
  onChannelAnnouncement(msg: ChannelAnnouncementMessage);
}

// tslint:disable-next-line: max-classes-per-file
export class GossipStateBase implements IGossipState {
  protected _context: GossipSyncer;

  constructor(context: GossipSyncer) {
    this._context = context;
  }

  public onQueryChannelRange(msg: QueryChannelRangeMessage): IGossipState {
    return this;
  }

  public onReplyChannelRange(msg: ReplyChannelRangeMessage): IGossipState {
    return this;
  }
  public onQueryShortIds(msg: QueryShortChannelIdsMessage): IGossipState {
    return this;
  }

  public onReplyShortIdsEnd(msg: ReplyShortChannelIdsEndMessage): IGossipState {
    return this;
  }
  public onChannelAnnouncement(msg: ChannelAnnouncementMessage): IGossipState {
    return this;
  }

  protected _sendMessage(msg: IWireMessage) {
    this._context.peer.sendMessage(msg);
  }
}

// tslint:disable-next-line: max-classes-per-file
export class PendingState extends GossipStateBase {
  constructor(context) {
    super(context);
    console.log(">>>>>>>>>>>>>>>>>>>>> pending state");
  }
}

// tslint:disable-next-line: max-classes-per-file
export class AwaitingChannelRangeReply extends GossipStateBase {
  private _shortChannelIds: ShortChannelId[] = [];

  constructor(context) {
    super(context);
    console.log(">>>>>>>>>>>>>>>>>>>>> awaiting channel range reply");
  }

  public onReplyChannelRange(msg: ReplyChannelRangeMessage): IGossipState {
    // enqueue short_channel_ids until we get a complete signal
    this._shortChannelIds.push(...msg.shortChannelIds);

    // when not complete
    // this could be because there is no data or we still have more messages
    if (!msg.complete && msg.shortChannelIds.length === 0) {
      throw new Error("Need to handle this");
    } else if (!msg.complete) return this;
    else if (msg.complete && this._shortChannelIds.length === 0) {
      throw new Error("need to handle this");
    } else {
      // construct and send request for short_channel_ids
      const queryShortIds = new QueryShortChannelIdsMessage();
      queryShortIds.chainHash = msg.chainHash;
      queryShortIds.shortChannelIds = this._shortChannelIds;
      this._sendMessage(queryShortIds);

      // reset the short_channel_id queue
      this._shortChannelIds.length = 0;

      // transition to awaiting for complete values
      return new AwaitingShortIdsComplete(this._context);
    }
  }
}

// tslint:disable-next-line: max-classes-per-file
export class AwaitingShortIdsComplete extends GossipStateBase {
  constructor(context) {
    super(context);
    console.log(">>>>>>>>>>>>>>>>>>>>> awaiting short_ids_complete");
  }

  public onReplyShortIdsEnd(msg: ReplyShortChannelIdsEndMessage) {
    if (!msg.complete) {
      throw new Error("Need to handle this");
    } else {
      // create GossipTimeoutMessage
      return new GossipSynced(this._context);
    }
  }
}

// tslint:disable-next-line: max-classes-per-file
export class GossipSynced extends GossipStateBase {
  constructor(context: GossipSyncer) {
    super(context);
    console.log(">>>>>>>>>>>>>>>>>>>>>  Gossip has synced");
  }
}
