const winston = require('winston');
winston.level = 'debug';

const { PeerClient } = require('@lntools/wire');

class App {
  static async run() {
    try {
      let app = new App();
      await app.connectToPeer();

      process.stdin.resume();
    } catch (ex) {
      winston.error('there was an error');
      winston.error(ex);
      process.exit(1);
    }
  }

  async connectToPeer() {
    // hadrcoding to demo1.lndexplorer.com
    let pubkey = '036b96e4713c5f84dcb8030592e1bd42a2d9a43d91fa2e535b9bfd05f2c5def9b9';
    let host = '38.87.54.163';
    let port = 9745;

    // hard coding to some testnet values for now
    let ls = {
      priv: Buffer.from('535e52756e85ee72c83429ce2cc0ff4c801c9d2f8f3c0fd84b2f4dac0b2c0c18', 'hex'),
      pub: Buffer.from('02fd830096ddb75d993df04258e5bf4b17dba17c28a8ba310e3b1f9d2157c4114b', 'hex'),
      compressed() {
        return this.pub;
      },
    };
    let rs = {
      pub: Buffer.from(pubkey, 'hex'),
      compressed() {
        return this.pub;
      },
    };

    let peer = new PeerClient();
    await peer.connect({ localSecret: ls, remoteSecret: rs, host, port });
  }
}

App.run();
