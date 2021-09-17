import { PeerHostRecord } from "../PeerHostRecord";
import { promises as dnsPromises, SrvRecord } from "dns";

import bech32 from "bech32";
import { AddressType } from "../domain/AddressType";
export interface DnsPeerQueryOptions {
    /**
     * The domain of the dns seed.
     */
    dnsSeed: string;

    /**
     * The realm byte used to specify what realm the returned nodes must support.
     */
    realm?: number;

    /**
     * The address type bit field specifies the address types that should be returned.
     * It follows the format of the address descriptor type specified in BOLT #7.
     */
    addressTypes?: AddressType[];

    /**
     * The bech32-encoded node id used to retrive the result of a single node.
     */
    nodeId?: string;

    /**
     * The number of desired reply records.
     */
    desiredReplyRecords?: number;
}

/**
 * This class implements the node discovery mechanism described
 * in BOLT #10.
 * The purpose of this component is to assist in the initial
 * node discovery process for nodes that have no known contacts,
 * and to help nodes discover the current network address of previously
 * known peers. A domain name server that implements BOLT #10 is
 * referred to as a DNS Seed and answers incoming DNS queries of
 * type A, AAAA, or SRV.
 *
 * The query method starts by querying a DNS seed for SRV records.
 * This will result in a list of returned SRV records that each
 * represent a lightning node that can be connected to. Each record
 * is a subdomain of the dns seed where the first component of the
 * subdomain is the bech32 encoded public key of the node (also known
 * as the node_id). Each subdomain can subsequently be used to query
 * the DNS seed for the A (or AAA) records of the lightning node with
 *  the specified node_id. The query method ends by constructing peer
 *  host records using the port from the SRV records and the ip
 * address from the A (or AAA) records.
 */
export class DnsPeerQuery {
    private resolver: dnsPromises.Resolver;

    constructor(resolver?: dnsPromises.Resolver) {
        this.resolver = resolver || new dnsPromises.Resolver();
    }

    public async query(dnsPeerQueryOptions: DnsPeerQueryOptions): Promise<PeerHostRecord[]> {
        const dnsSeed = this.buildUrl(dnsPeerQueryOptions);
        const peerSrvRecords: SrvRecord[] = await this.getPeerSrvRecords(dnsSeed);
        const peerHostRecordPromises: Promise<PeerHostRecord>[] = [];

        for (const peerSrvRecord of peerSrvRecords) {
            peerHostRecordPromises.push(this.createPeerHostRecord(peerSrvRecord));
        }

        const peerHostRecordSettlements = await Promise.allSettled(peerHostRecordPromises);

        const peers = peerHostRecordSettlements
            .filter(recordSettlement => recordSettlement?.status == "fulfilled")
            .map((p: PromiseFulfilledResult<PeerHostRecord>) => p.value);

        return peers;
    }

    private async createPeerHostRecord(peerSrvRecord: SrvRecord): Promise<PeerHostRecord> {
        const peerAddress = await this.resolveSrvNameToIp(peerSrvRecord.name);

        return new PeerHostRecord(
            this.getPublicKeyFromSrvRecord(peerSrvRecord),
            peerAddress,
            peerSrvRecord.port,
        );
    }

    private buildUrl(dnsPeerQueryOptions: DnsPeerQueryOptions): string {
        let { dnsSeed } = dnsPeerQueryOptions;
        const { realm, addressTypes, nodeId, desiredReplyRecords } = dnsPeerQueryOptions;

        if (desiredReplyRecords != null) {
            dnsSeed = `n${desiredReplyRecords}.${dnsSeed}`;
        }

        if (nodeId != null) {
            dnsSeed = `l${nodeId}.${dnsSeed}`;
        }

        if (addressTypes != null) {
            const a = addressTypes.reduce((bitField, addressType) => {
                return bitField | (1 << addressType);
            }, 0);

            dnsSeed = `a${a}.${dnsSeed}`;
        }

        if (realm != null) {
            dnsSeed = `r${realm}.${dnsSeed}`;
        }

        return dnsSeed;
    }

    private getPublicKeyFromSrvRecord(srvRecord: SrvRecord): Buffer {
        const domainComponents = srvRecord.name.split(".");
        const { words } = bech32.decode(domainComponents[0]);
        return Buffer.from(bech32.fromWords(words));
    }

    private getPeerSrvRecords(dnsSeed: string): Promise<SrvRecord[]> {
        return this.resolver.resolveSrv(dnsSeed);
    }

    private async resolveSrvNameToIp(hostname: string): Promise<string> {
        const ipAddresses: string[] = await this.resolver.resolve(hostname, "A");
        return ipAddresses?.[0];
    }
}
