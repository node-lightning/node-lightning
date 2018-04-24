const winston = require('winston');
winston.level = 'debug';

const PeerClient = require('./noise/peer-client');

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
    // hard coding to some testnet values for now
    let ls = {
      priv: Buffer.from('535e52756e85ee72c83429ce2cc0ff4c801c9d2f8f3c0fd84b2f4dac0b2c0c18', 'hex'),
      pub: Buffer.from('02fd830096ddb75d993df04258e5bf4b17dba17c28a8ba310e3b1f9d2157c4114b', 'hex'),
      compressed() {
        return this.pub;
      },
    };
    let rs = {
      pub: Buffer.from('0303276be77510d384d2452f8f2027f447968b82798c528a57cd13e6e2814dffa4', 'hex'),
      compressed() {
        return this.pub;
      },
    };

    winston.debug('connecting to peer');
    let peer = new PeerClient({ localSecret: ls, remoteSecret: rs, host: 'localhost' });
    await peer.connect();
    winston.debug('connected to peer');
  }
}

App.run();
