const PingPongState = require('./pingpong-state');

function createAndStart({ PING_INTERVAL_MS, PONG_TIMEOUT_MS, PING_FLOOD_THRESHOLD }) {
  let peerClient = {
    disconnect: jest.fn(),
    sendMessage: jest.fn(),
  };
  let sut = new PingPongState(peerClient);
  if (PING_INTERVAL_MS) {
    sut.PING_INTERVAL_MS = PING_INTERVAL_MS;
  }
  if (PONG_TIMEOUT_MS) {
    sut.PONG_TIMEOUT_MS = PONG_TIMEOUT_MS;
  }
  if (PING_FLOOD_THRESHOLD) {
    sut.PING_FLOOD_THRESHOLD = PING_FLOOD_THRESHOLD;
  }
  sut.start();
  return sut;
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

let sut;
afterEach(() => {
  if (sut) sut.onDisconnecting();
});

describe('when ping interval expires', () => {
  describe('when no message has been received', () => {
    test('it should send a ping', async () => {
      sut = createAndStart({ PING_INTERVAL_MS: 10 });
      await wait(15);
      expect(sut._peerClient.sendMessage.mock.calls[0][0]).toEqual({
        type: 18,
        num_pong_bytes: 1,
        ignored: Buffer.alloc(0),
      });
    });
  });
  describe('when last message is old', () => {
    test('it should send a ping', async () => {
      sut = createAndStart({ PING_INTERVAL_MS: 10 });
      sut.onMessage({ type: 258 });
      await wait(15);
      expect(sut._peerClient.sendMessage.mock.calls[0][0]).toEqual({
        type: 18,
        num_pong_bytes: 1,
        ignored: Buffer.alloc(0),
      });
    });
  });
  describe('when message has been received', () => {
    test('it should not send ping', async () => {
      sut = createAndStart({ PING_INTERVAL_MS: 10 });
      await wait(5);
      sut.onMessage({ type: 258 });
      await wait(10);
      expect(sut._peerClient.sendMessage.mock.calls.length).toBe(0);
    });
  });
});

describe('when pong expires', () => {
  test('it should disconnect', async () => {
    sut = createAndStart({ PING_INTERVAL_MS: 10, PONG_TIMEOUT_MS: 1 });
    await wait(15);
    expect(sut._peerClient.disconnect.mock.calls.length).toBe(1);
  });
});

describe('when pong received', () => {
  test('it should cancel pong timeout', async () => {
    sut = createAndStart({ PING_INTERVAL_MS: 10, PONG_TIMEOUT_MS: 3 });
    await wait(12);
    sut.onMessage({ type: 19, ignored: Buffer.alloc(1) });
    await wait(5);
    expect(sut._peerClient.disconnect.mock.calls.length).toBe(0);
  });
  test('it should be happy if valid pong', async () => {
    sut = createAndStart({ PING_INTERVAL_MS: 10, PONG_TIMEOUT_MS: 3 });
    await wait(12);
    sut.onMessage({ type: 19, ignored: Buffer.alloc(1) });
    expect(sut._peerClient.disconnect.mock.calls.length).toBe(0);
  });
  test('it should disconnect if invalid pong', async () => {
    sut = createAndStart({ PING_INTERVAL_MS: 10, PONG_TIMEOUT_MS: 3 });
    await wait(12);
    sut.onMessage({ type: 19, ignored: Buffer.alloc(2) });
    expect(sut._peerClient.disconnect.mock.calls.length).toBe(1);
  });
});

describe('when ping received', () => {
  test('it should not send ping when num_pong_bytes gte 65532', () => {
    sut = createAndStart({ PING_INTERVAL_MS: 10, PONG_TIMEOUT_MS: 3 });
    sut.onMessage({ type: 18, num_pong_bytes: 65532 });
    expect(sut._peerClient.disconnect.mock.calls.length).toBe(0);
  });
  test('it should send correct pong', () => {
    sut = createAndStart({ PING_INTERVAL_MS: 10, PONG_TIMEOUT_MS: 3 });
    sut.onMessage({ type: 18, num_pong_bytes: 1 });
    expect(sut._peerClient.sendMessage.mock.calls[0][0]).toEqual({
      type: 19,
      ignored: Buffer.alloc(1),
    });
  });
  test('it should disconnect if ping flood', () => {
    sut = createAndStart({ PING_FLOOD_THRESHOLD: 2 });
    sut.onMessage({ type: 18, num_pong_bytes: 1 });
    sut.onMessage({ type: 18, num_pong_bytes: 1 });
    sut.onMessage({ type: 18, num_pong_bytes: 1 });
    expect(sut._peerClient.disconnect.mock.calls.length).toBe(1);
  });
});

describe('normal ping frequency', () => {
  test('should not trigger disconnect', async () => {
    sut = createAndStart({ PING_FLOOD_THRESHOLD: 2, PING_INTERVAL_MS: 10 });
    sut.onMessage({ type: 18, num_pong_bytes: 1 });
    await wait(10);
    sut.onMessage({ type: 18, num_pong_bytes: 1 });
    await wait(10);
    sut.onMessage({ type: 18, num_pong_bytes: 1 });
    await wait(10);
    sut.onMessage({ type: 18, num_pong_bytes: 1 });
    await wait(10);
    expect(sut._peerClient.disconnect.mock.calls.length).toBe(0);
  });
});
