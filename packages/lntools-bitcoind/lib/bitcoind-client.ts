import { EventEmitter } from "events";
import * as http from "http";
import { Socket } from "net";
import * as zmq from "zeromq";
import { BlockSummary } from "./types/blocksummary";
import { Transaction } from "./types/transaction";
import { Utxo } from "./types/transaction";

export interface IBitcoindOptions {
  rpcuser?: string;
  rpcpassword?: string;
  host: string;
  port: number;
  zmqpubrawtx?: string;
  zmqpubrawblock?: string;
}

export declare interface IBitcoindClient {
  on(event: "rawtx", listener: (rawtx: Buffer) => void): this;
  on(event: "rawblock", listener: (rawblock: Buffer) => void): this;
}

export class BitcoindClient extends EventEmitter {
  public opts: IBitcoindOptions;
  public id: number;

  public rawTxSock: zmq.socket;
  public rawBlockSock: zmq.socket;

  constructor(opts: IBitcoindOptions) {
    super();
    this.opts = opts;
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

  public async getBlockchainInfo(): Promise<any> {
    return this._request("getblockchaininfo");
  }

  public async getBlockHash(height: number): Promise<string> {
    const result = await this._request("getblockhash", [height]);
    return result as string;
  }

  public async getBlock(hash: string): Promise<BlockSummary> {
    const result = await this._request("getblock", [hash]);
    return result as BlockSummary;
  }

  public async getRawBlock(hash: string): Promise<Buffer> {
    const result = await this._request("getblock", [hash, 0]);
    return Buffer.from(result as string, "hex");
  }

  public async getTransaction(txid: string): Promise<Transaction> {
    const result = await this._request("getrawtransaction", [txid, true]);
    return result as Transaction;
  }

  public async getRawTransaction(txid: string): Promise<Buffer> {
    const result = await this._request("getrawtransaction", [txid, false]);
    return Buffer.from(result as string, "hex");
  }

  public async getUtxo(txid: string, n: number): Promise<Utxo> {
    const result = await this._request("gettxout", [txid, n]);
    return result as Utxo;
  }

  public _request(method: string, params: any = []) {
    return new Promise((resolve, reject) => {
      const { host, port, rpcuser: rpcUser, rpcpassword: rpcPassword } = this.opts;
      const body = JSON.stringify({
        id: ++this.id,
        jsonrpc: "1.0",
        method,
        params,
      });
      const req = http.request(
        {
          auth: `${rpcUser}:${rpcPassword}`,
          headers: {
            "content-length": body.length,
            "content-type": "text/plain",
          },
          host,
          method: "POST",
          port,
        },
        res => {
          const buffers = [];
          res.on("error", reject);
          res.on("data", buf => buffers.push(buf));
          res.on("end", () => {
            const ok = res.statusCode === 200 ? resolve : reject;
            const isJson = res.headers["content-type"] === "application/json";
            const raw = Buffer.concat(buffers).toString();
            const result = isJson ? JSON.parse(raw) : raw;
            // buf = buf.replace(/:[0-9]\.{0,1}[0-9]/)
            if (ok) {
              resolve(result.result);
            } else {
              reject(result);
            }
          });
        },
      );
      req.on("error", reject);
      req.end(body);
    });
  }
}
