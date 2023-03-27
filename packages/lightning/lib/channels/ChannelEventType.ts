export enum ChannelEventType {
    BlockConnected = "block_connected",
    PeerDisconnected = "peer_disconnected",
    PeerConnected = "peer_connected",
    OpenChannelMessage = "open_channel_message",
    AcceptChannelMessage = "accept_channel_message",
    FundingCreatedMessage = "funding_created_message",
    FundingSignedMessage = "funding_signed_message",
    ChannelReadyMessage = "channel_ready_message",
}
