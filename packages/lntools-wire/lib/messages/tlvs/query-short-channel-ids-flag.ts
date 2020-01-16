/**
 * Flag container for use with query_short_channel_ids when using
 * gossip_query_ex. These flags dictate which information should
 * be sent by the remote peer. The absense of any value is equivalent
 * to all information.
 */
export class QueryShortChannelIdsFlag {
  private _flags: bigint;
  private _channelAnnoucementFlag = BigInt(1) << BigInt(0);
  private _node1ChannelUpdate = BigInt(1) << BigInt(1);
  private _node2ChannelUpdate = BigInt(1) << BigInt(2);
  private _node1Announcement = BigInt(1) << BigInt(3);
  private _node2Announcement = BigInt(1) << BigInt(4);

  constructor(flags: bigint = BigInt(0)) {
    this._flags = flags;
  }

  /**
   * Raw flags
   */
  public get flags() {
    return this._flags;
  }

  /**
   * Request channel_announcement message
   */
  public get channelAnnouncement() {
    return this._isSet(this._channelAnnoucementFlag);
  }

  /**
   * Request node1's channel_update message
   */
  public get node1ChannelUpdate() {
    return this._isSet(this._node1ChannelUpdate);
  }

  /**
   * Request node2's channel_update message
   */
  public get node2ChannelUpdate() {
    return this._isSet(this._node2ChannelUpdate);
  }

  /**
   * Request node1's node_announcement message
   */
  public get node1Announcement() {
    return this._isSet(this._node1Announcement);
  }

  /**
   * Request node2's node_announcement message
   */
  public get node2Announcement() {
    return this._isSet(this._node2Announcement);
  }

  /**
   * Set channel_annoucement message to enabled or disabled
   * @param on
   */
  public setChannelAnnouncement(on = true) {
    on
      ? this._enableOption(this._channelAnnoucementFlag)
      : this._disableOption(this._channelAnnoucementFlag);
    return this;
  }

  /**
   * Set node1's channel_update message to enabled or disabled
   * @param on
   */
  public setNode1ChannelUpdate(on = true) {
    on
      ? this._enableOption(this._node1ChannelUpdate)
      : this._disableOption(this._node1ChannelUpdate);
    return this;
  }

  /**
   * Set node2's channel_update message to enabled or disabled
   * @param on
   */
  public setNode2ChannelUpdate(on = true) {
    on
      ? this._enableOption(this._node2ChannelUpdate)
      : this._disableOption(this._node2ChannelUpdate);
    return this;
  }

  /**
   * Set node1 node_announcement message to enabled or disabled
   * @param on
   */
  public setNode1Announcement(on = true) {
    on ? this._enableOption(this._node1Announcement) : this._disableOption(this._node1Announcement);
    return this;
  }

  /**
   * Set node2 node_announcement message to enabled or disabled
   * @param on
   */
  public setNode2Announcement(on = true) {
    on ? this._enableOption(this._node2Announcement) : this._disableOption(this._node2Announcement);
    return this;
  }

  public toJSON() {
    return {
      channelAnnouncement: this.channelAnnouncement,
      node1ChannelUpdate: this.node1ChannelUpdate,
      node2ChannelUpdate: this.node2ChannelUpdate,
      node1Announcement: this.node1Announcement,
      node2Announcement: this.node2Announcement,
    };
  }

  private _enableOption(mask: bigint) {
    this._flags |= mask;
  }

  private _disableOption(mask: bigint) {
    this._flags &= ~mask;
  }

  private _isSet(mask: bigint) {
    return (this._flags & mask) === mask;
  }
}
