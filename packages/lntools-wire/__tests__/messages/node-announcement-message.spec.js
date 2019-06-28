const { expect } = require('chai');
const { NodeAnnouncementMessage } = require('../../lib/messages/node-announcement-message');

describe('NodeAnnouncementMessage', () => {
  describe('deserialize basic message', () => {
    let input = Buffer.from(
      '010105d3b12aacb824409ce8724609fe453fdcd33a498ecca170784985c4a6a2765657c4ef9e1170d3a5795ec86021c3a081c84a9f3a02e2ca66d17b683baacae08000005cddd5e5036b96e4713c5f84dcb8030592e1bd42a2d9a43d91fa2e535b9bfd05f2c5def9b9b6d43364656d6f312e6c6e646578706c6f7265722e636f6d0000000000000000000000000701265736a32611',
      'hex'
    );

    /** @type {NodeAnnouncementMessage} */
    let result;

    before(() => {
      result = NodeAnnouncementMessage.deserialize(input);
    });

    it('should be type 257', () => {
      expect(result.type).to.equal(257);
    });

    it('should have a 64-byte signature', () => {
      expect(result.signature).to.deep.equal(
        Buffer.from(
          '05d3b12aacb824409ce8724609fe453fdcd33a498ecca170784985c4a6a2765657c4ef9e1170d3a5795ec86021c3a081c84a9f3a02e2ca66d17b683baacae080',
          'hex'
        )
      );
    });

    it('should have featuers', () => {
      expect(result.features.toNumber()).to.equal(0);
    });

    it('should have the correct timestamp', () => {
      expect(result.timestamp).to.equal(1558042085);
    });

    it('should have the 33-byte node_id', () => {
      expect(result.nodeId).to.deep.equal(
        Buffer.from('036b96e4713c5f84dcb8030592e1bd42a2d9a43d91fa2e535b9bfd05f2c5def9b9', 'hex')
      );
    });

    it('should have the 3-byte rgb_color', () => {
      expect(result.rgbColor).to.deep.equal(Buffer.from('b6d433', 'hex'));
    });

    it('should have the 32-byte alias', () => {
      expect(result.alias).to.deep.equal(
        Buffer.from('64656d6f312e6c6e646578706c6f7265722e636f6d0000000000000000000000', 'hex')
      );
    });

    it('should valid addresses', () => {
      expect(result.addresses.length).to.equal(1);
      expect(result.addresses[0].type).to.equal(1);
      expect(result.addresses[0].host).to.equal('38.87.54.163');
      expect(result.addresses[0].port).to.equal(9745);
    });
  });

  // describe('serialize basic message', () => {
  //   it('should serialize', () => {
  //     let instance = new NodeAnnouncementMessage();
  //     instance.nodeId = Buffer.from(
  //       '036b96e4713c5f84dcb8030592e1bd42a2d9a43d91fa2e535b9bfd05f2c5def9b9',
  //       'hex'
  //     );
  //     instance.signature = Buffer.from(
  //       '05d3b12aacb824409ce8724609fe453fdcd33a498ecca170784985c4a6a2765657c4ef9e1170d3a5795ec86021c3a081c84a9f3a02e2ca66d17b683baacae080',
  //       'hex'
  //     );
  //     instance.features = new BN(0);
  //     instance.timestamp = 1558042085;
  //     instance.rgbColor = Buffer.from('b6d433', 'hex');
  //     instance.alias = Buffer.from(
  //       '64656d6f312e6c6e646578706c6f7265722e636f6d0000000000000000000000',
  //       'hex'
  //     );
  //     instance.addresses.push({
  //       type: 1,
  //       addr: Buffer.from([38, 87, 54, 163]),
  //       port: 9745,
  //     });

  //     let result = instance.serialize();

  //     expect(result).to.deep.equal(
  //       Buffer.from(
  //         '010105d3b12aacb824409ce8724609fe453fdcd33a498ecca170784985c4a6a2765657c4ef9e1170d3a5795ec86021c3a081c84a9f3a02e2ca66d17b683baacae08000005cddd5e5036b96e4713c5f84dcb8030592e1bd42a2d9a43d91fa2e535b9bfd05f2c5def9b9b6d43364656d6f312e6c6e646578706c6f7265722e636f6d0000000000000000000000000701265736a32611',
  //         'hex'
  //       )
  //     );
  //   });
  // });

  // describe('.verifySignatures', () => {
  //   it('should verify valid sigs', () => {
  //     let instance = NodeAnnouncementMessage.deserialize(
  //       Buffer.from(
  //         '010105d3b12aacb824409ce8724609fe453fdcd33a498ecca170784985c4a6a2765657c4ef9e1170d3a5795ec86021c3a081c84a9f3a02e2ca66d17b683baacae08000005cddd5e5036b96e4713c5f84dcb8030592e1bd42a2d9a43d91fa2e535b9bfd05f2c5def9b9b6d43364656d6f312e6c6e646578706c6f7265722e636f6d0000000000000000000000000701265736a32611',
  //         'hex'
  //       )
  //     );
  //     let result = NodeAnnouncementMessage.verifySignatures(instance);
  //     expect(result).to.be.true;
  //   });
  // });
});
