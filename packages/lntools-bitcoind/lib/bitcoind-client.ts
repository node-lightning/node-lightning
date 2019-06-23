import { EventEmitter } from 'events';
import * as http from 'http';
import * as zmq from 'zeromq';
import { BlockSummary } from './types/blocksummary';
import { Transaction } from './types/transaction';
import { Utxo } from './types/transaction';
import { Socket } from 'net';

export interface BitcoindOptions {
  rpcuser?: string;
  rpcpassword?: string;
  host: string;
  port: number;
  zmqpubrawtx?: string;
  zmqpubrawblock?: string;
}

export declare interface BitcoindClient {
  on(event: 'rawtx', listener: (rawtx: Buffer) => void): this;
  on(event: 'rawblock', listener: (rawblock: Buffer) => void): this;
}

export class BitcoindClient extends EventEmitter {
  opts: BitcoindOptions;
  id: number;

  rawTxSock: zmq.socket;
  rawBlockSock: zmq.socket;

  constructor(opts: BitcoindOptions) {
    super();
    this.opts = opts;
    this.id = 0;
  }

  /**
    Subscribes to the raw transaction ZeroMQ stream and emits
    rawtx events with a Buffer payload
    @emits rawtx
   */
  subscribeRawTx() {
    let sock = (this.rawTxSock = zmq.socket('sub'));
    sock.connect(this.opts.zmqpubrawtx);
    sock.subscribe('rawtx');
    sock.on('message', (topic: string, message: Buffer) => this.emit('rawtx', message));
  }

  /**
    Subscribes to the raw block ZeroMQ stream and emits
    rawblock events with a Buffer payload.
    @emits rawblock
   */
  subscribeRawBlock() {
    let sock = (this.rawBlockSock = zmq.socket('sub'));
    sock.connect(this.opts.zmqpubrawblock);
    sock.subscribe('rawblock');
    sock.on('message', (topic: string, message: Buffer) => this.emit('rawblock', message));
  }

  async getBlockchainInfo(): Promise<any> {
    return this._request('getblockchaininfo');
  }

  async getBlockHash(height: number): Promise<string> {
    let result = await this._request('getblockhash', [height]);
    return result as string;
  }

  async getBlock(hash: string): Promise<BlockSummary> {
    let result = await this._request('getblock', [hash]);
    return result as BlockSummary;
  }

  async getRawBlock(hash: string): Promise<Buffer> {
    let result = await this._request('getblock', [hash, 0]);
    return Buffer.from(result as string, 'hex');
  }

  async getTransaction(txid: string): Promise<Transaction> {
    let result = await this._request('getrawtransaction', [txid, true]);
    return result as Transaction;
  }

  async getRawTransaction(txid: string): Promise<Buffer> {
    let result = await this._request('getrawtransaction', [txid, false]);
    return Buffer.from(result as string, 'hex');
  }

  async getUtxo(txid: string, n: number): Promise<Utxo> {
    let result = await this._request('gettxout', [txid, n]);
    return result as Utxo;
  }

  _request(method: string, params: any = []) {
    return new Promise((resolve, reject) => {
      let { host, port, rpcuser: rpcUser, rpcpassword: rpcPassword } = this.opts;
      let body = JSON.stringify({
        jsonrpc: '1.0',
        id: ++this.id,
        method,
        params,
      });
      let req = http.request(
        {
          host,
          port,
          method: 'POST',
          auth: `${rpcUser}:${rpcPassword}`,
          headers: {
            'content-type': 'text/plain',
            'content-length': body.length,
          },
        },
        res => {
          let buffers = [];
          res.on('error', reject);
          res.on('data', buf => buffers.push(buf));
          res.on('end', () => {
            let ok = res.statusCode === 200 ? resolve : reject;
            let isJson = res.headers['content-type'] === 'application/json';
            let raw = Buffer.concat(buffers).toString();
            let result = isJson ? JSON.parse(raw) : raw;
            // buf = buf.replace(/:[0-9]\.{0,1}[0-9]/)
            if (ok) {
              resolve(result.result);
            } else {
              reject(result);
            }
          });
        }
      );
      req.on('error', reject);
      req.end(body);
    });
  }
}
