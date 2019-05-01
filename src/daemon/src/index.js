const winston = require('winston');
winston.configure({
  level: 'info',
  transports: [new winston.transports.Console()],
  format: winston.format.combine(
    winston.format.splat(),
    winston.format.colorize(),
    winston.format.simple()
  ),
});

const { Peer } = require('@lntools/wire');

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
    let pubkey = Buffer.from('036b96e4713c5f84dcb8030592e1bd42a2d9a43d91fa2e535b9bfd05f2c5def9b9', 'hex'); // prettier-ignore
    let host = '38.87.54.163';
    let port = 9745;

    // hard coding to some testnet values for now
    let ls = Buffer.from('535e52756e85ee72c83429ce2cc0ff4c801c9d2f8f3c0fd84b2f4dac0b2c0c18', 'hex');

    let peer = new Peer();
    await peer.connect({ ls, rpk: pubkey, host, port });
  }
}

App.run();
