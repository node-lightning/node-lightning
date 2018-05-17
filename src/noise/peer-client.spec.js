let PeerClient = require('./peer-client');

function createFakePeerClient() {
  let client = new PeerClient();
  let noiseState = {
    initialize: jest.fn(),
    initiatorAct1: jest.fn().mockReturnValue('act1'),
    initiatorAct2: jest.fn(),
    initiatorAct3: jest.fn().mockReturnValue('act3'),
    decryptLength: jest.fn(),
    decryptMessage: jest.fn(),
  };
  client.noiseState = noiseState;
  return client;
}

let sut;
beforeAll(() => {
  sut = createFakePeerClient();
  sut.socket = {
    write: jest.fn(),
    read: jest.fn(),
  };
});

describe('when connection is established', () => {
  it('should send the initial handshake', async () => {
    await sut._onConnected();
    expect(sut.socket.write.mock.calls[0][0]).toBe('act1');
  });
  it('should transition to awaiting_handshake_reply', () => {
    expect(sut.state).toBe(PeerClient.states.awaiting_handshake_reply);
  });
});

describe('when awaiting handshake reply and message received', () => {
  it('should process the reply and finalize the handshake', async () => {
    sut.socket.read.mockReturnValueOnce('act2');
    sut.sendMessage = jest.fn();
    await sut._onData();

    expect(sut.socket.write.mock.calls[1][0]).toBe('act3');
  });
  it('should construct and send an init message', async () => {
    expect(sut.sendMessage.mock.calls[0][0]).toEqual({
      type: 16,
      globalFeatures: 0,
      localFeatures: 0,
    });
  });
  it('should transition to awaiting_init_reply', () => {
    expect(sut.state).toBe(PeerClient.states.awaiting_init_reply);
  });
});

describe('when init reply is receieved', () => {
  it('should capture the init', async () => {
    sut.socket.read.mockReturnValueOnce(Buffer.alloc(18));
    sut.socket.read.mockReturnValueOnce(Buffer.alloc(6));
    sut.noiseState.decryptLength.mockReturnValueOnce(6);
    sut.noiseState.decryptMessage.mockReturnValueOnce(Buffer.from('001000000000', 'hex'));
    await sut._onData();
    expect(sut.remoteInit).toEqual({ type: 16, globalFeatures: 0, localFeatures: 0 });
  });
  it('should set state to awaiting_message_length', () => {
    expect(sut.state).toBe(PeerClient.states.awaiting_message_length);
  });
});
