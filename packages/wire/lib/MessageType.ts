/**
 * Defined in BOLT01
 */
export enum MessageType {
    // Setup and Control (0 - 31)
    Init = 16,
    Error = 17,
    Ping = 18,
    Pong = 19,

    // Channel (32-127)
    OpenChannel = 32,
    AcceptChannel = 33,
    FundingCreated = 34,
    FundingSigned = 35,
    FundingLocked = 36,
    Shutdown = 38,
    ClosingSigned = 39,

    // Commitment (128-255)
    //

    // Routing (256-511)
    ChannelAnnouncement = 256,
    NodeAnnouncement = 257,
    ChannelUpdate = 258,
    AnnouncementSignatures = 259,

    QueryShortChannelIds = 261,
    ReplyShortChannelIdsEnd = 262,

    QueryChannelRange = 263,
    ReplyChannelRange = 264,

    GossipTimestampFilter = 265,
}
