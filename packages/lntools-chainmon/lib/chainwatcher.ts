import { BitcoindClient } from '@lntools/bitcoind';
import { BitcoindOptions } from '@lntools/bitcoind';
import { decodeTx } from '@lntools/bitcoin/dist/tx-decoder';

export class ChainWatcher {
  client: BitcoindClient;
  txqueue: Array<Buffer>;

  constructor(opts: BitcoindOptions) {
    this.client = new BitcoindClient(opts);
  }

  start() {
    this.client.subscribeRawTx();
    this.client.on('rawtx', this._onRawTx.bind(this));
  }

  stop() {}

  _onRawTx(buf: Buffer) {
    console.log(decodeTx(buf));
  }
}
