/**
  Channel Announcment:

64 : node_signature_1 ]
64 : node_signature_2 ]
64 : bitcoin_signature_1 ]
64 : bitcoin_signature_2 ]
2 : len ]
len : features ]
32 : chain_hash ]
8 : short_channel_id ]
33 : node_id_1 ]
33 : node_id_2 ]
33 : bitcoin_key_1 ]
33 : bitcoin_key_2 ]

*/

/**
  Channel Update

64 : signature ]
32 : chain_hash ]
8 : short_channel_id ]
4 : timestamp ]
1 : message_flags ]
1 : channel_flags ]
2 : cltv_expiry_delta ]
8 : htlc_minimum_msat ]
4 : fee_base_msat ]
4 : fee_proportional_millionths ]
8 : htlc_maximum_msat ]
 */

class Channel {
  constructor() {
    // this.nodeSignature1;
    // this.nodeSignature2;
    // this.bitcoinSignature1;
    // this.bitcoinSignature2;
    // this.features;
    // this.chainHash;

    /** @type {string} */
    this.shortChannelId;

    /** @type {string} */
    this.channelPoint; // obtained after verifying the tx

    /** @type {string} */
    this.capacity; // obtained after verifying the tx

    /** @type {string} */
    this.nodeId1;

    /** @type {string} */
    this.nodeId2;
    /** @type {number} */
    this.lastUpdate;
    // this.bitcoinKey1;
    // this.bitcoinKey2;

    this.node1Settings;
    this.node2Settings;

    this.updates = [];
  }
}

module.exports = Channel;
