# `@node-lightning/wire`

This repository contains the wire protocol code for the Lightning Network and
includes the following functionality:

-   Peer which manages a connection to a peer. This class allows sending and
    emitting message traffic. It also manages internal state for Ping/Pong message
    traffic. [/lib/peer.ts](lib/peer.ts)

-   Messages defined in BOLT #1 - Base Protocol, BOLT #2 - Peer Protocol for
    Channel Management, and BOLT #7 P2P Node and Channel Discovery can be
    found in [/lib/messages](/lib/messages). This code includes the message
    types and serialization and deserialization methods for each message.

-   P2P Node and Channel gossip management that can be found in
    [/lib/gossip](/lib/gossip). This code contains the
    [GossipManger](/lib/gossip/gossip-manager) which controls gossip for many
    peers. Gossip synchronization for a single peer is managed through
    [PeerGossipSynchronizer](/lib/gossip/peer-gossip-synchronizer).
