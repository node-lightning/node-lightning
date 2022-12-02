## Subroutine `createTempChannelId`

Construct a 32-byte temporary channel identifier that is unique to the channel and peer. This is defined in [BOLT 2](https://github.com/lightning/bolts/blob/master/02-peer-protocol.md#definition-of-channel_id). Because the same `temporary_channel_id` is valid from different peers, prior to the `channel_id` being constructed the tuple (`source_node_id`, `destination_node_id`, `temporary_channel_id`) must be used to reference the channel.
