const { NodeAnnouncementMessage } = require('../../lib/messages/node-announcement-message');

describe('NodeAnnouncementMessage', () => {
  describe('deserialize', () => {
    let input = Buffer.from(
      '010171376a9183b443570c068fc318ecface1d376cc2baa19639bd5b33fb81be72340e20f4efe422cf90bd49a4d1ac461ac8ce059fb1cfe39275d5d656e61382060200005ac8798c02f85b64a0b6022315d49a46bcaafcbb79f05a2352bf72556ac7868cfc63ea4f953399ff30326638356236346130623630323233313564340000000000000000000000000000',
      'hex'
    );
    it('should deserialize', () => {
      NodeAnnouncementMessage.deserialize(input);
    });
  });
});
