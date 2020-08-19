import * as crypto from "@node-lightning/crypto";
import { ILogger } from "../../wire/node_modules/@node-lightning/logger/dist";
import { bufRightShift } from "./bufRightShift";
import { generateCipherStream } from "./generateCipherStream";
import { generateFiller } from "./generateFiller";
import { generateKey } from "./generateKey";
import { KeyType } from "./KeyType";
import { SharedSecretGenerator } from "./SharedSecretGenerator";

export class OnionPacket {
    public routingInfo: Buffer;
    public headerMac: Buffer;
    public hmacs: Buffer[];

    constructor(
        readonly version: number = 0x00,
        hopPayloads: Buffer[],
        readonly associatedData: Buffer,
        readonly ss: SharedSecretGenerator,
        logger?: ILogger,
    ) {
        const numHops = hopPayloads.length;
        const hopDataSize = 65; // payload=32, hmac=32, realm=1
        const hmacSize = 32;
        const routingInfoSize = 1300;
        const numStreamBytes = routingInfoSize * 2;

        logger?.trace("numHops", numHops);
        logger?.trace("hopDataSize", hopDataSize);
        logger?.trace("hmacSize", hmacSize);
        logger?.trace("routinInfoSize", routingInfoSize);
        logger?.trace("numStreamBytes", numStreamBytes);

        // generate the "filler string" padding
        const filler = generateFiller(KeyType.rho, numHops, hopDataSize, ss.sharedSecrets);
        logger?.trace("filler", filler);

        // the starting packet needs to be filled with random bytes which are
        // generated deterministically using the session private key
        const paddingKey = generateKey(KeyType.pad, ss.sessionKey);
        logger?.trace("paddingKey", paddingKey);

        const paddingBytes = generateCipherStream(paddingKey, routingInfoSize);
        logger?.trace("paddingBytes", paddingBytes);

        // construct the mix header from the cipher stream
        let mixHeader: Buffer = Buffer.alloc(routingInfoSize, paddingBytes);
        logger?.trace("initial mixHeader", mixHeader);

        // initialize an empty mac since the last hop doesn't have a mac
        let nextHmac: Buffer = Buffer.alloc(hmacSize);
        logger?.trace("initial nextHmac", nextHmac);

        this.hmacs = [];

        // traverse the hope in reverse order and compute the routing
        // information for each hop along with a MAC of the routing information
        // using the shared secret for that hop
        for (let i = numHops - 1; i >= 0; i--) {
            logger?.trace("hop", i);

            const rhoKey = generateKey(KeyType.rho, ss.sharedSecrets[i]);
            logger?.trace("rhoKey", rhoKey);

            const muKey = generateKey(KeyType.mu, ss.sharedSecrets[i]);
            logger?.trace("muKey", muKey);

            // shift and obfuscate routing information
            const streamBytes = generateCipherStream(rhoKey, numStreamBytes);
            logger?.trace("streamBytes", streamBytes);

            // right shift by hopDataSize
            mixHeader = bufRightShift(mixHeader, hopDataSize);
            logger?.trace("rightShifted", mixHeader);

            // create the hop_data bytes, this is hopDataSize and includes the
            // 1-byte relam, hop_data length (32 for legacy) and hmac = 32
            const hopData = Buffer.concat([Buffer.alloc(1), hopPayloads[i], nextHmac]);
            logger?.trace("hopData", hopData);

            // copy hop_payload to start of mixHeader where the shifted blanks
            // values are now available
            hopData.copy(mixHeader);
            logger?.trace("pre-xor", mixHeader);

            // xor the current mix header with the stream bytes
            mixHeader = crypto.xor(mixHeader, streamBytes);
            logger?.trace("post-xor", mixHeader);

            // ensure every node has the correctly filler length
            if (i === numHops - 1) {
                filler.copy(mixHeader, mixHeader.length - filler.length);
            }

            const packet = Buffer.concat([mixHeader, associatedData]);
            logger?.trace("pre-hmac", packet);

            nextHmac = crypto.hmac(muKey, packet);
            logger?.trace("hmac", nextHmac);

            this.hmacs.unshift(nextHmac);
        }

        this.headerMac = nextHmac;
        this.routingInfo = mixHeader;
    }

    public toBuffer(): Buffer {
        return Buffer.concat([
            Buffer.from([this.version]), // version
            this.ss.sessionPubKey, // pubkey
            this.routingInfo,
            this.headerMac,
        ]);
    }
}
