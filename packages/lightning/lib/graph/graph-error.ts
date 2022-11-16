// tslint:disable: max-classes-per-file
import { ShortChannelId } from "../domain/ShortChannelId";

export enum GraphErrorCode {
    ChannelNotFound = 1,
    NodeNotFound = 2,
}

export abstract class GraphError extends Error {
    public code: GraphErrorCode;

    constructor(code: GraphErrorCode, message: string) {
        super(message);
        this.code = code;
    }
}

export class ChannelNotFoundError extends GraphError {
    constructor(scid: ShortChannelId) {
        const msg = `channel_not_found ${scid.toString()}`;
        super(GraphErrorCode.ChannelNotFound, msg);
    }
}

export class NodeNotFoundError extends GraphError {
    constructor(nodeId: Buffer) {
        const msg = `node_not_found ${nodeId.toString()}`;
        super(GraphErrorCode.NodeNotFound, msg);
    }
}
