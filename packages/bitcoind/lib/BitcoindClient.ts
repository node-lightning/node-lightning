/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { EventEmitter } from "events";
import * as zmq from "zeromq";
import { IBitcoindOptions } from "./BitcoindOptions";
import { jsonrpcRequest } from "./JsonRpcRequest";
import { ConstantBackoff } from "./policies/ConstantBackoff";
import { RetryPolicy } from "./policies/RetryPolicy";
import { BlockChainInfo } from "./types/BlockChainInfo";
import { Block } from "./types/Block";
import { BlockHeader } from "./types/BlockHeader";
import { BlockSummary } from "./types/BlockSummary";
import { Transaction } from "./types/Transaction";
import { Utxo } from "./types/Transaction";
import url from "url";
import { JsonRpcOptions } from "./JsonRpcOptions";
import { SmartFeeEstimate } from "./types/SmartFeeEstimate";
import { UnspentTx } from "./types/UnspentTx";
import { SigningResult } from "./types/SigningResult";

export declare interface IBitcoindClient {
    on(event: "rawtx", listener: (rawtx: Buffer) => void): this;
    on(event: "rawblock", listener: (rawblock: Buffer) => void): this;
}

/**
 * Bitcoind RPC and Zeromq client
 */
export class BitcoindClient extends EventEmitter {
    public opts: IBitcoindOptions;
    public jsonRpcOptions: JsonRpcOptions;
    public id: number;

    public rawTxSock: zmq.socket;
    public rawBlockSock: zmq.socket;

    constructor(opts: IBitcoindOptions) {
        super();
        this.opts = opts;

        this.jsonRpcOptions = {
            host: opts.host,
            port: opts.port,
            username: opts.rpcuser,
            password: opts.rpcpassword,
        };

        if (opts.rpcurl) {
            this.jsonRpcOptions = { ...this.jsonRpcOptions, ...url.parse(opts.rpcurl) };
        }
        this.id = 0;
    }

    /**
     * Subscribes to the raw transaction ZeroMQ stream and emits
     * rawtx events with a Buffer payload
     * @emits rawtx
     */
    public subscribeRawTx() {
        const sock = (this.rawTxSock = zmq.socket("sub"));
        sock.connect(this.opts.zmqpubrawtx);
        sock.subscribe("rawtx");
        sock.on("message", (topic: string, message: Buffer) => this.emit("rawtx", message));
    }

    /**
     * Subscribes to the raw block ZeroMQ stream and emits
     * rawblock events with a Buffer payload.
     * @emits rawblock
     */
    public subscribeRawBlock() {
        const sock = (this.rawBlockSock = zmq.socket("sub"));
        sock.connect(this.opts.zmqpubrawblock);
        sock.subscribe("rawblock");
        sock.on("message", (topic: string, message: Buffer) => this.emit("rawblock", message));
    }

    /**
     * Estimates the approximate fee per kilobyte needed for a
     * transaction to begin confirmation within conf_target blocks if
     * possible and return the number of blocks for which the estimate
     * is valid.
     * @param blocks
     */
    public async estimateSmartFee(confTarget: number): Promise<SmartFeeEstimate> {
        return this._jsonrpc<SmartFeeEstimate>("estimatesmartfee", [confTarget]);
    }

    /**
     * Gets the BlockChaininfo using the `getblockchaininfo` RPC method
     */
    public async getBlockchainInfo(): Promise<BlockChainInfo> {
        return this._jsonrpc<BlockChainInfo>("getblockchaininfo");
    }

    /**
     * Returns the height of the most-work fully-validated chain.
     * The genesis block has height 0.
     * @returns
     */
    public async getBlockCount(): Promise<number> {
        return this._jsonrpc<number>("getblockcount");
    }

    /**
     * Returns the hash of the best block.
     */
    public async getBestBlockHash(): Promise<string> {
        return this._jsonrpc<string>("getbestblockhash");
    }

    /**
     * Gets the block hash for a given block height. Hash is returned in RPC byte
     * order using the `getblockhash` RPC method
     * @param height
     */
    public async getBlockHash(height: number): Promise<string> {
        return this._jsonrpc<string>("getblockhash", [height]);
    }

    /**
     * Gets a BlockSummary object, which only includes the transaction identifiers
     * using the `getblock` RPC method with option 1.
     * @param hash
     */
    public async getBlockSummary(hash: string): Promise<BlockSummary> {
        return this._jsonrpc<BlockSummary>("getblock", [hash, 1]);
    }

    /**
     * Gets a `Block` object, which includes the full transaction information
     * using the `getblock` RPC method with option 2.
     * @param hash
     * @returns
     */
    public async getBlock(hash: string): Promise<Block> {
        return this._jsonrpc<Block>("getblock", [hash, 2]);
    }

    /**
     * Gets a raw block as a Buffer use the `getblock` RPC method
     * @param hash
     */
    public async getRawBlock(hash: string): Promise<Buffer> {
        const result = await this._jsonrpc<string>("getblock", [hash, 0]);
        return Buffer.from(result, "hex");
    }

    /**
     * Gets a transaction header from the by calling the
     * `getblockheader` RPC
     * @param hash
     */
    public async getHeader(hash: string): Promise<BlockHeader> {
        return await this._jsonrpc<BlockHeader>("getblockheader", [hash]);
    }

    /**
     * Gets a parsed transaction using the `getrawtransaction` method
     * @param txid
     */
    public async getTransaction(txid: string): Promise<Transaction> {
        return this._jsonrpc<Transaction>("getrawtransaction", [txid, true]);
    }

    /**
     * Gets a raw transaction as a buffer using the `getrawtransaction` RPC method
     * @param txid
     */
    public async getRawTransaction(txid: string): Promise<Buffer> {
        const result = await this._jsonrpc<string>("getrawtransaction", [txid, false]);
        return Buffer.from(result, "hex");
    }

    /**
     * Retrieves the UTXO value using the gettxout rpc method
     * @param txid
     * @param n
     */
    public async getUtxo(txid: string, n: number): Promise<Utxo> {
        return await this._jsonrpc<Utxo>("gettxout", [txid, n]);
    }

    /**
     * Generates the supplied number of blocks to the specified address.
     * @param blocks
     * @param address
     */
    public async generateToAddress(blocks: number, address: string): Promise<string[]> {
        return await this._jsonrpc<string[]>("generatetoaddress", [blocks, address]);
    }

    /**
     * Returns the estimated network hashes per second based on the last n blocks.
     * @param blocks
     * @param height
     * @returns
     */
    public async getNetworkHashPs(blocks: number, height: number): Promise<number> {
        return await this._jsonrpc<number>("getnetworkhashps", [blocks, height]);
    }

    /**
     * Submit a raw transaction (serialized, hex-encoded) to local node and network.
     * @param hexstring hex-encoded transaction
     * @returns
     */
    public async sendRawTransaction(hexString: string): Promise<string> {
        return await this._jsonrpc<string>("sendrawtransaction", [hexString]);
    }

    /**
     * Send an amount to a given address.
     * @param address the bitcoin address to send to
     * @param amountInBtc the amount in BC to send. eg. 0.1
     * @returns the hex encoded transaction id
     */
    public async sendToAddress(address: string, amountInBtc: string | number): Promise<string> {
        return await this._jsonrpc<string>("sendtoaddress", [address, amountInBtc]);
    }

    /**
     * Returns a new address for receiving payments.
     * @param label optional label
     * @param type legacy, p2sh-segwit, or bech32. Defaults to beceh32
     */
    public async getNewAddress(
        label?: string,
        type: "legacy" | "p2sh-segwit" | "bech32" = "bech32",
    ): Promise<string> {
        return await this._jsonrpc<string>("getnewaddress", [label, type]);
    }

    /**
     * Returns array of unspent transaction outputs with between minconf
     * and maxconf (inclusive) confirmations.
     *
     * Optionally filter to only include txouts paid to specified addresses.
     * @returns
     */
    public async listUnspent(): Promise<UnspentTx[]> {
        return await this._jsonrpc<UnspentTx[]>("listunspent");
    }

    /**
     * Sign inputs for raw transaction (serialized, hex-encoded).
     *
     * The second optional argument (may be null) is an array of previous
     * transaction outputs that this transaction depends on but may not
     * yet be in the block chain.
     *
     * Requires wallet passphrase to be set with walletpassphrase call
     * if wallet is encrypted.
     * @param hex
     */
    public async signTransactionWithWallet(hex: string): Promise<SigningResult> {
        return await this._jsonrpc<SigningResult>("signrawtransactionwithwallet", [hex]);
    }

    /**
     * This API will block until the bitcoind has been synced.  If the bitcoind
     * has already been synced then it will immediately return.
     *
     * This method works by using the `getblockchaininfo` RPC call and analyzing
     * the mediantime, blocks, and headers values.  The mediantime must be within
     * several hours of the current system time and then we verify that the
     * blocks and headers counts match. If either of this conditions fail we use a
     * backoff strategy and try again.
     */
    public async waitForSync(): Promise<boolean> {
        const constant = new ConstantBackoff(15000);
        const retry = new RetryPolicy<boolean>(Number.MAX_SAFE_INTEGER, constant);
        const now = Math.floor(Date.now() / 1000);
        const threeHours = 180 * 60;
        const mediantimeTarget = now - threeHours;
        return await retry.execute(async () => {
            const info = await this.getBlockchainInfo();
            if (info.mediantime >= mediantimeTarget && info.blocks >= info.headers) {
                return true;
            } else {
                throw new Error("Sync in progress"); // fails the retry polic
            }
        });
    }

    /**
     * Performs a json-rpc requets using the configured options for the client.
     * @param method
     * @param args
     */
    private _jsonrpc<T>(method: string, args?: any): Promise<T> {
        // constructs a request delegate that will be used for retries
        const fn = () => jsonrpcRequest<T>(method, args, ++this.id, this.jsonRpcOptions);

        // if we have a retry policy specified in the options, we will build a
        // new policy for this request and use it to execute our function delegate
        if (this.opts.policyMaker) {
            return this.opts.policyMaker<T>().execute(fn);
        }
        // otherwise just directly invoke our function request
        else {
            return fn();
        }
    }
}
