import { HashValue, OutPoint } from "@node-lightning/core";
import { ChannelAnnouncementMessage } from "../messages/ChannelAnnouncementMessage";
import { ChannelUpdateMessage } from "../messages/ChannelUpdateMessage";
import { ExtendedChannelAnnouncementMessage } from "../messages/ExtendedChannelAnnouncementMessage";
import { IWireMessage } from "../messages/IWireMessage";
import { NodeAnnouncementMessage } from "../messages/NodeAnnouncementMessage";
import { MessageType } from "../MessageType";
import { Result } from "../Result";
import { fundingScript } from "../ScriptUtils";
import { WireError, WireErrorCode } from "../WireError";
import { GossipFilterResult } from "./GossipFilterResult";
import { IGossipStore } from "./GossipStore";
import { IGossipFilterChainClient } from "./IGossipFilterChainClient";

/**
 * GossipFilter recieves messages from peers and performs validation
 * on the messages to ensure that they are valid messages. These validation
 * follow messaging rules defined in Bolt #7 and include things like
 * signature checks, on-chain validation, and message sequencing requirements.
 * Successful message validation results in messages being written to an
 * instance of IGossipStore and returned as results
 *
 * The GossipFilter will also store pending messages, such as channel_update
 * message arriving before the channel_announcement.
 */
export class GossipFilter {
    constructor(
        readonly gossipStore: IGossipStore,
        readonly pendingStore: IGossipStore,
        readonly chainClient?: IGossipFilterChainClient,
    ) {}

    /**
     * Validates a message and writes it to the appropriate store.
     * A fully processed messages (or releated messages) will be
     * returned when a message is successfully processed.
     *
     */
    public async validateMessage(msg: IWireMessage): Promise<GossipFilterResult> {
        switch (msg.type) {
            case MessageType.ChannelAnnouncement:
                return await this._validateChannelAnnouncement(msg as ChannelAnnouncementMessage);
            case MessageType.NodeAnnouncement:
                return await this._validateNodeAnnouncement(msg as NodeAnnouncementMessage);
            case MessageType.ChannelUpdate:
                return await this._validateChannelUpdate(msg as ChannelUpdateMessage);
        }
        return Result.ok([] as IWireMessage[]);
    }

    /**
     * Validate a node announcement message by checking to see if the
     * message is newer than the prior timestamp and if the message
     * has a valid signature from the corresponding node
     */
    private async _validateNodeAnnouncement(
        msg: NodeAnnouncementMessage,
    ): Promise<GossipFilterResult> {
        // get or construct a node
        const existing = await this.gossipStore.findNodeAnnouncement(msg.nodeId);

        // check if the message is newer than the last update
        if (existing && existing.timestamp >= msg.timestamp) return Result.ok([] as IWireMessage[]);

        // queue node if we don't have any channels
        const scids = await this.gossipStore.findChannelsForNode(msg.nodeId);
        if (!scids.length) {
            await this.pendingStore.saveNodeAnnouncement(msg);
            return Result.ok([] as IWireMessage[]);
        }

        // validate message signature
        if (!NodeAnnouncementMessage.verifySignatures(msg)) {
            return Result.err(new WireError(WireErrorCode.nodeAnnSigFailed, [msg]));
        }

        // save the announcement
        await this.gossipStore.saveNodeAnnouncement(msg);

        // broadcast valid message
        return Result.ok([msg]);
    }

    /**
     * Validates a ChannelAnnouncementMessage by verifying the signatures
     * and validating the transaction on chain work. This message will
     */
    private async _validateChannelAnnouncement(
        msg: ChannelAnnouncementMessage,
    ): Promise<GossipFilterResult> {
        // attempt to find the existing chan_ann message
        const existing = await this.gossipStore.findChannelAnnouncement(msg.shortChannelId);

        // If the message is an extended message and it has populated the outpoint and capacity we
        // can skip message processing becuase there is nothing left to do.
        if (existing && existing instanceof ExtendedChannelAnnouncementMessage) {
            return Result.ok([] as IWireMessage[]);
        }

        // If there is an existing message and we don't have a chain_client then we want
        // to abort processing to prevent from populating the gossip store with chan_ann
        // messages that do not have a extended information. Alterntaively, if we DO have an
        // an existing message that is just a chan_ann and not ext_chan_ann and there is a
        // chain_client, we want to update the chan_ann with onchain information
        if (existing && !this.chainClient) {
            return Result.ok([] as IWireMessage[]);
        }

        // validate signatures for message
        if (!ChannelAnnouncementMessage.verifySignatures(msg)) {
            return Result.err(new WireError(WireErrorCode.chanAnnSigFailed, [msg]));
        }

        if (this.chainClient) {
            // load the block hash for the block height
            const blockHash = await this.chainClient.getBlockHash(msg.shortChannelId.block);
            if (!blockHash) {
                return Result.err(new WireError(WireErrorCode.chanBadBlockHash, [msg]));
            }

            // load the block details so we can find the tx
            const block = await this.chainClient.getBlock(blockHash);
            if (!block) {
                return Result.err(new WireError(WireErrorCode.chanBadBlock, [msg, blockHash]));
            }

            // load the txid from the block details
            const txId = block.tx[msg.shortChannelId.txIdx];
            if (!txId) {
                return Result.err(new WireError(WireErrorCode.chanAnnBadTx, [msg]));
            }

            // obtain a UTXO to verify the tx hasn't been spent yet
            const utxo = await this.chainClient.getUtxo(txId, msg.shortChannelId.voutIdx);
            if (!utxo) {
                return Result.err(new WireError(WireErrorCode.chanUtxoSpent, [msg]));
            }

            // verify the tx script is a p2ms
            const expectedScript = fundingScript([msg.bitcoinKey1, msg.bitcoinKey2]);
            const actualScript = Buffer.from(utxo.scriptPubKey.hex, "hex");
            if (!expectedScript.equals(actualScript)) {
                return Result.err(
                    new WireError(WireErrorCode.chanBadScript, [msg, expectedScript, actualScript]),
                );
            }

            // construct outpoint
            const outpoint = new OutPoint(HashValue.fromRpc(txId), msg.shortChannelId.voutIdx);

            // calculate capacity in satoshi
            // Not sure about this code. MAX_SAFE_INTEGER is still safe
            // for Bitcoin satoshi.
            const capacity = BigInt(Math.round(utxo.value * 10 ** 8));

            // overright msg with extended channel_announcement
            const extended = ExtendedChannelAnnouncementMessage.fromMessage(msg);
            extended.outpoint = outpoint;
            extended.capacity = capacity;
            msg = extended;
        }

        // save channel_ann
        await this.gossipStore.saveChannelAnnouncement(msg);

        // broadcast valid message
        const results: IWireMessage[] = [msg];

        // process outstanding node messages
        const pendingUpdates = [
            await this.pendingStore.findChannelUpdate(msg.shortChannelId, 0),
            await this.pendingStore.findChannelUpdate(msg.shortChannelId, 1),
        ];
        for (const pendingUpdate of pendingUpdates) {
            if (pendingUpdate) {
                await this.pendingStore.deleteChannelUpdate(
                    pendingUpdate.shortChannelId,
                    pendingUpdate.direction,
                );
                const result = await this._validateChannelUpdate(pendingUpdate);
                if (result.isErr) return result;
                else results.push(...result.value);
            }
        }

        // process outstanding node messages
        const pendingNodeAnns = [
            await this.pendingStore.findNodeAnnouncement(msg.nodeId1),
            await this.pendingStore.findNodeAnnouncement(msg.nodeId2),
        ];
        for (const pendingNodeAnn of pendingNodeAnns) {
            if (pendingNodeAnn) {
                await this.pendingStore.deleteNodeAnnouncement(pendingNodeAnn.nodeId);
                const result = await this._validateNodeAnnouncement(pendingNodeAnn);
                if (result.isErr) return result;
                else results.push(...result.value);
            }
        }

        return Result.ok(results);
    }

    /**
     * Validates a channel_update message by ensuring that:
     * - the channel_announcement has already been recieved
     * - the channel_update is not old
     * - the channel_update is correctly signed by the node
     */
    private async _validateChannelUpdate(msg: ChannelUpdateMessage): Promise<GossipFilterResult> {
        // Ensure a channel announcement exists. If it does not,
        // we need to queue the update message until the channel announcement
        // can be adequately processed. Technically according to the specification in
        // Bolt 07, we should ignore channel_update message if we not processed
        // a valid channel_announcement. In reality, we may end up in a situation
        // where a channel_update makes it to our peer prior to the channel_announcement
        // being received.
        const channelMessage = await this.gossipStore.findChannelAnnouncement(msg.shortChannelId);
        if (!channelMessage) {
            await this.pendingStore.saveChannelUpdate(msg);
            return Result.ok([] as IWireMessage[]);
        }

        // ignore out of date message
        const existingUpdate = await this.gossipStore.findChannelUpdate(
            msg.shortChannelId,
            msg.direction,
        );
        if (existingUpdate && existingUpdate.timestamp >= msg.timestamp) {
            return Result.ok([] as IWireMessage[]);
        }

        // validate message signature for the node in
        const nodeId = msg.direction === 0 ? channelMessage.nodeId1 : channelMessage.nodeId2;
        if (!ChannelUpdateMessage.validateSignature(msg, nodeId)) {
            return Result.err(new WireError(WireErrorCode.chanUpdSigFailed, [msg, nodeId]));
        }

        // save the message
        await this.gossipStore.saveChannelUpdate(msg);

        // broadcast valid message
        return Result.ok([msg]);
    }
}
