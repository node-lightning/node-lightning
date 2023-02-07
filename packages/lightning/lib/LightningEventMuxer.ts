import { ILogger } from "@node-lightning/logger";
import { ChannelManager } from "./channels/ChannelManager";
import { GossipManager } from "./gossip/GossipManager";
import { ILightningEventMuxer } from "./ILightningEventMuxer";
import { LightningEvent } from "./LightningEvent";
import { LightningEventResult } from "./LightningEventResult";
import { LightningEventType } from "./LightningEventType";
import { AcceptChannelMessage } from "./messages/AcceptChannelMessage";
import { ChannelReadyMessage } from "./messages/ChannelReadyMessage";
import { FundingSignedMessage } from "./messages/FundingSignedMessage";
import { MessageType } from "./MessageType";
import { Result } from "./Result";

/**
 * Routes events to the appropriate handlers.
 */
export class LightningEventMuxer implements ILightningEventMuxer {
    public logger: ILogger;

    constructor(
        logger: ILogger,
        readonly gossipManager: GossipManager,
        readonly channelManager: ChannelManager,
    ) {
        this.logger = logger.sub(LightningEventMuxer.name);
    }

    /**
     * Process an event and returns the handling result from one or more
     * result handlers.
     * @param event
     */
    public async onEvent(event: LightningEvent): Promise<LightningEventResult> {
        let result: LightningEventResult;
        switch (event.type) {
            case LightningEventType.PeerReady:
                result = await this.onPeerReady(event);
                break;
            case LightningEventType.PeerMessage:
                result = await this.onPeerMessage(event);
                break;
            case LightningEventType.BlockConnected:
                result = await this.onBlockConnected(event);
                break;
            default:
                throw new Error("Unknown event type");
        }
        return result;
    }

    protected async onPeerReady(event: LightningEvent): Promise<LightningEventResult> {
        // eslint-disable-next-line @typescript-eslint/await-thenable
        await this.gossipManager.onPeerReady(event.peer);
        return Result.ok(event);
    }

    protected async onPeerMessage(event: LightningEvent): Promise<LightningEventResult> {
        switch (event.msg.type) {
            // gossip messages
            case MessageType.ChannelAnnouncement:
            case MessageType.ChannelUpdate:
            case MessageType.NodeAnnouncement:
            case MessageType.QueryChannelRange:
            case MessageType.ReplyChannelRange:
            case MessageType.QueryShortChannelIds:
            case MessageType.ReplyShortChannelIdsEnd: {
                const wireResult = await this.gossipManager?.onWireMessage(event.peer, event.msg);
                if (wireResult && wireResult.isErr) {
                    return Result.err(wireResult.error, event);
                }
                return Result.ok(event);
            }

            // change open message
            case MessageType.OpenChannel: {
                break;
            }
            case MessageType.AcceptChannel: {
                await this.channelManager.onAcceptChannelMessage(
                    event.peer,
                    event.msg as AcceptChannelMessage,
                );
                break;
            }
            case MessageType.FundingCreated: {
                break;
            }
            case MessageType.FundingSigned: {
                await this.channelManager.onFundingSignedMessage(
                    event.peer,
                    event.msg as FundingSignedMessage,
                );
                break;
            }
            case MessageType.FundingLocked: {
                await this.channelManager.onChannelReadyMessage(
                    event.peer,
                    event.msg as ChannelReadyMessage,
                );
                break;
            }
        }

        return Result.ok(event);
    }

    protected async onBlockConnected(event: LightningEvent): Promise<LightningEventResult> {
        await this.channelManager.onBlockConnected(event.block);
        return Result.ok(event);
    }
}
