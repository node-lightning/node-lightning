const { generateKey } = require('../wallet/key');
const NoiseState = require('./noise-state');

// describe('intiator', () => {
//   let rs = {
//     pub: Buffer.from('028d7500dd4c12685d1f568b4c2b5048e8534b873319f3a8daa612b469132ec7f7', 'hex'),
//     compressed() {
//       return Buffer.from(
//         '028d7500dd4c12685d1f568b4c2b5048e8534b873319f3a8daa612b469132ec7f7',
//         'hex'
//       );
//     },
//   };
//   let ls = generateKey('1111111111111111111111111111111111111111111111111111111111111111');
//   let es = generateKey('1212121212121212121212121212121212121212121212121212121212121212');
//   let sut = new NoiseState({ ls, rs, es });

//   let sent = [
//     Buffer.from(
//       'cf2b30ddf0cf3f80e7c35a6e6730b59fe802473180f396d88a8fb0db8cbcf25d2f214cf9ea1d95',
//       'hex'
//     ),
//   ];

//   describe('initiator act 1', () => {
//     let m;
//     beforeAll(async () => {
//       m = await sut.initiatorAct1();
//     });
//     test('should set the hash correctly', () => {
//       expect(sut.h.toString('hex')).toEqual(
//         '9d1ffbb639e7e20021d9259491dc7b160aab270fb1339ef135053f6f2cebe9ce'
//       );
//     });
//     test('should have the correct output', () => {
//       expect(m.toString('hex')).toEqual(
//         '00036360e856310ce5d294e8be33fc807077dc56ac80d95d9cd4ddbd21325eff73f70df6086551151f58b8afe6c195782c6a'
//       );
//     });
//   });

//   describe('initiator act2 and act3', () => {
//     let m;
//     beforeAll(async () => {
//       let input = Buffer.from(
//         '0002466d7fcae563e5cb09a0d1870bb580344804617879a14949cf22285f1bae3f276e2470b93aac583c9ef6eafca3f730ae',
//         'hex'
//       );
//       m = await sut.initiatorAct2Act3(input);
//     });
//     test('should have the correct output', () => {
//       expect(m.toString('hex')).toEqual(
//         '00b9e3a702e93e3a9948c2ed6e5fd7590a6e1c3a0344cfc9d5b57357049aa22355361aa02e55a8fc28fef5bd6d71ad0c38228dc68b1c466263b47fdf31e560e139ba'
//       );
//     });
//     test('should have the correct shared key', () => {
//       expect(sut.rk.toString('hex')).toEqual(
//         'bb9020b8965f4df047e07f955f3c4b88418984aadc5cdb35096b9ea8fa5c3442'
//       );
//     });
//     it('should have the correct shared key', () => {
//       expect(sut.sk.toString('hex')).toEqual(
//         '969ab31b4d288cedf6218839b27a3e2140827047f2c0f01bf5c04435d43511a9'
//       );
//     });
//   });

//   describe('send messages', () => {
//     test('should encrypt message properly', async () => {
//       let m = await sut.encryptMessage(Buffer.from('68656c6c6f', 'hex'));
//       expect(m.toString('hex')).toEqual(
//         'cf2b30ddf0cf3f80e7c35a6e6730b59fe802473180f396d88a8fb0db8cbcf25d2f214cf9ea1d95'
//       );
//     });

//     test('should rotate the sending nonce', () => {
//       expect(sut.sn.toString('hex')).toEqual('000000000200000000000000');
//     });

//     test('should rotate keys correctly', async () => {
//       let input = Buffer.from('68656c6c6f', 'hex');
//       for (let i = 1; i < 1001; i++) {
//         let m = await sut.encryptMessage(input);
//         sent.push(m);
//         let tests = {
//           1: '72887022101f0b6753e0c7de21657d35a4cb2a1f5cde2650528bbc8f837d0f0d7ad833b1a256a1',
//           500: '178cb9d7387190fa34db9c2d50027d21793c9bc2d40b1e14dcf30ebeeeb220f48364f7a4c68bf8',
//           501: '1b186c57d44eb6de4c057c49940d79bb838a145cb528d6e8fd26dbe50a60ca2c104b56b60e45bd',
//           1000: '4a2f3cc3b5e78ddb83dcb426d9863d9d9a723b0337c89dd0b005d89f8d3c05c52b76b29b740f09',
//           1001: '2ecd8c8a5629d0d02ab457a0fdd0f7b90a192cd46be5ecb6ca570bfc5e268338b1a16cf4ef2d36',
//         };
//         if (tests[i]) {
//           expect(m.toString('hex')).toEqual(tests[i], 'failed on message ' + i);
//         }
//       }
//     });
//   });

//   describe('receive messages', () => {
//     beforeAll(async () => {
//       sut = new NoiseState({ ls, rs, es });
//       await sut.initiatorAct1();
//       await sut.initiatorAct2Act3(
//         Buffer.from(
//           '0002466d7fcae563e5cb09a0d1870bb580344804617879a14949cf22285f1bae3f276e2470b93aac583c9ef6eafca3f730ae',
//           'hex'
//         )
//       );
//       sut.rk = sut.sk;
//     });

//     test('should decrypt the length', async () => {
//       let l = await sut.decryptLength(sent[0].slice(0, 18));
//       expect(l).toEqual(5);
//     });

//     test('should decrypt the message', async () => {
//       let m = await sut.decryptMessage(sent[0].slice(18));
//       expect(m.toString()).toEqual('hello');
//     });

//     test('should rotate keys correctly', async () => {
//       for (let i = 1; i < 1001; i++) {
//         let l = await sut.decryptLength(sent[i].slice(0, 18));
//         let m = await sut.decryptMessage(sent[i].slice(18));

//         expect(l).toEqual(5, 'failed on message' + i);
//         expect(m.toString()).toEqual('hello', 'failed on message' + i);
//       }
//     });
//   });

//   test('transport initiator act2 short read test', async () => {
//     sut = new NoiseState({ ls, rs, es });
//     await sut.initiatorAct1();
//     let input = Buffer.from(
//       '0002466d7fcae563e5cb09a0d1870bb580344804617879a14949cf22285f1bae3f276e2470b93aac583c9ef6eafca3f730',
//       'hex'
//     );
//     expect(sut.initiatorAct2Act3(input)).rejects.toEqual(new Error('message must be 50 bytes'));
//   });

//   test('transport-initiator act2 bad version test', async () => {
//     sut = new NoiseState({ ls, rs, es });
//     await sut.initiatorAct1();
//     let input = Buffer.from(
//       '0102466d7fcae563e5cb09a0d1870bb580344804617879a14949cf22285f1bae3f276e2470b93aac583c9ef6eafca3f730ae',
//       'hex'
//     );
//     expect(sut.initiatorAct2Act3(input)).rejects.toEqual(new Error('unrecognized version'));
//   });

//   test('transport-initiator act2 bad key serialization test', async () => {
//     sut = new NoiseState({ ls, rs, es });
//     await sut.initiatorAct1();
//     let input = Buffer.from(
//       '0004466d7fcae563e5cb09a0d1870bb580344804617879a14949cf22285f1bae3f276e2470b93aac583c9ef6eafca3f730ae',
//       'hex'
//     );
//     expect(sut.initiatorAct2Act3(input)).rejects.toEqual(new Error('Unknown point format'));
//   });

//   test('transport-initiator act2 bad MAC test', async () => {
//     sut = new NoiseState({ ls, rs, es });
//     await sut.initiatorAct1();
//     let input = Buffer.from(
//       '0002466d7fcae563e5cb09a0d1870bb580344804617879a14949cf22285f1bae3f276e2470b93aac583c9ef6eafca3f730af',
//       'hex'
//     );
//     expect(sut.initiatorAct2Act3(input)).rejects.toEqual(new Error('Unknown point format'));
//   });
// });

describe('responder', () => {
  let ls = generateKey('2121212121212121212121212121212121212121212121212121212121212121');
  let es = generateKey('2222222222222222222222222222222222222222222222222222222222222222');
  let sut;

  describe('act 1', () => {
    beforeAll(async () => {
      sut = new NoiseState({ ls, es });
      let input = Buffer.from(
        '00036360e856310ce5d294e8be33fc807077dc56ac80d95d9cd4ddbd21325eff73f70df6086551151f58b8afe6c195782c6a',
        'hex'
      );
      await sut.receiveAct1(input);
    });
    test('should setup hash', () => {
      expect(sut.h.toString('hex')).toBe(
        '9d1ffbb639e7e20021d9259491dc7b160aab270fb1339ef135053f6f2cebe9ce'
      );
    });
  });

  describe('act 2', async () => {
    let m;
    beforeAll(async () => {
      m = await sut.recieveAct2();
    });
    test('should setup hash', () => {
      expect(sut.h.toString('hex')).toBe(
        '90578e247e98674e661013da3c5c1ca6a8c8f48c90b485c0dfa1494e23d56d72'
      );
    });
    test('should return correct message', async () => {
      expect(m.toString('hex')).toBe(
        '0002466d7fcae563e5cb09a0d1870bb580344804617879a14949cf22285f1bae3f276e2470b93aac583c9ef6eafca3f730ae'
      );
    });
  });

  describe('act 3', () => {
    beforeAll(async () => {
      let input = Buffer.from(
        '00b9e3a702e93e3a9948c2ed6e5fd7590a6e1c3a0344cfc9d5b57357049aa22355361aa02e55a8fc28fef5bd6d71ad0c38228dc68b1c466263b47fdf31e560e139ba',
        'hex'
      );
      await sut.receiveAct3(input);
    });
    test('should have correct rk', () => {
      expect(sut.rk.toString('hex')).toBe(
        '969ab31b4d288cedf6218839b27a3e2140827047f2c0f01bf5c04435d43511a9'
      );
    });
    test('should have correct sk', () => {
      expect(sut.sk.toString('hex')).toBe(
        'bb9020b8965f4df047e07f955f3c4b88418984aadc5cdb35096b9ea8fa5c3442'
      );
    });
    test('should have the remote pub key', () => {
      expect(sut.rs.compressed().toString('hex')).toBe(
        '034f355bdcb7cc0af728ef3cceb9615d90684bb5b2ca5f859ab0f0b704075871aa'
      );
    });
  });

  test('transport-responder act1 short read test', async () => {
    sut = new NoiseState({ ls, es });
    let input = Buffer.from(
      '00036360e856310ce5d294e8be33fc807077dc56ac80d95d9cd4ddbd21325eff73f70df6086551151f58b8afe6c195782c'
    );
    expect(sut.receiveAct1(input)).rejects.toEqual(new Error('ACT1_READ_FAILED'));
  });

  test('transport-responder act1 bad version test', async () => {
    sut = new NoiseState({ ls, es });
    let input = Buffer.from(
      '01036360e856310ce5d294e8be33fc807077dc56ac80d95d9cd4ddbd21325eff73f70df6086551151f58b8afe6c195782c6a',
      'hex'
    );
    expect(sut.receiveAct1(input)).rejects.toEqual(new Error('ACT1_BAD_VERSION'));
  });

  test('transport-responder act1 bad key serialization test', async () => {
    sut = new NoiseState({ ls, es });
    let input = Buffer.from(
      '00046360e856310ce5d294e8be33fc807077dc56ac80d95d9cd4ddbd21325eff73f70df6086551151f58b8afe6c195782c6a',
      'hex'
    );
    expect(sut.receiveAct1(input)).rejects.toEqual(new Error('Unknown point format'));
  });

  test('transport-responder act1 bad MAC test', async () => {
    sut = new NoiseState({ ls, es });
    let input = Buffer.from(
      '00036360e856310ce5d294e8be33fc807077dc56ac80d95d9cd4ddbd21325eff73f70df6086551151f58b8afe6c195782c6b',
      'hex'
    );
    expect(sut.receiveAct1(input)).rejects.toEqual(new Error('Unknown point format'));
  });

  test('transport-responder act3 bad version test', async () => {
    sut = new NoiseState({ ls, es });
    await sut.receiveAct1(
      Buffer.from(
        '00036360e856310ce5d294e8be33fc807077dc56ac80d95d9cd4ddbd21325eff73f70df6086551151f58b8afe6c195782c6a',
        'hex'
      )
    );
    await sut.recieveAct2();
    expect(
      sut.receiveAct3(
        Buffer.from(
          '01b9e3a702e93e3a9948c2ed6e5fd7590a6e1c3a0344cfc9d5b57357049aa22355361aa02e55a8fc28fef5bd6d71ad0c38228dc68b1c466263b47fdf31e560e139ba',
          'hex'
        )
      )
    ).rejects.toEqual(new Error('ACT3_BAD_VERSION'));
  });

  test('transport-responder act3 short read test', async () => {
    sut = new NoiseState({ ls, es });
    await sut.receiveAct1(
      Buffer.from(
        '00036360e856310ce5d294e8be33fc807077dc56ac80d95d9cd4ddbd21325eff73f70df6086551151f58b8afe6c195782c6a',
        'hex'
      )
    );
    await sut.recieveAct2();
    expect(
      sut.receiveAct3(
        Buffer.from(
          '00b9e3a702e93e3a9948c2ed6e5fd7590a6e1c3a0344cfc9d5b57357049aa22355361aa02e55a8fc28fef5bd6d71ad0c38228dc68b1c466263b47fdf31e560e139',
          'hex'
        )
      )
    ).rejects.toEqual(new Error('ACT3_READ_FAILED'));
  });

  test('transport-responder act3 bad MAC for ciphertext test', async () => {
    sut = new NoiseState({ ls, es });
    await sut.receiveAct1(
      Buffer.from(
        '00036360e856310ce5d294e8be33fc807077dc56ac80d95d9cd4ddbd21325eff73f70df6086551151f58b8afe6c195782c6a',
        'hex'
      )
    );
    await sut.recieveAct2();
    expect(
      sut.receiveAct3(
        Buffer.from(
          '00c9e3a702e93e3a9948c2ed6e5fd7590a6e1c3a0344cfc9d5b57357049aa22355361aa02e55a8fc28fef5bd6d71ad0c38228dc68b1c466263b47fdf31e560e139ba',
          'hex'
        )
      )
    ).rejects.toEqual(new Error('Unknown point format'));
  });

  test('transport-responder act3 bad rs test', async () => {
    sut = new NoiseState({ ls, es });
    await sut.receiveAct1(
      Buffer.from(
        '00036360e856310ce5d294e8be33fc807077dc56ac80d95d9cd4ddbd21325eff73f70df6086551151f58b8afe6c195782c6a',
        'hex'
      )
    );
    await sut.recieveAct2();
    expect(
      sut.receiveAct3(
        Buffer.from(
          '00bfe3a702e93e3a9948c2ed6e5fd7590a6e1c3a0344cfc9d5b57357049aa2235536ad09a8ee351870c2bb7f78b754a26c6cef79a98d25139c856d7efd252c2ae73c',
          'hex'
        )
      )
    ).rejects.toEqual(new Error('Unknown point format'));
  });

  test('transport-responder act3 bad MAC test', async () => {
    sut = new NoiseState({ ls, es });
    await sut.receiveAct1(
      Buffer.from(
        '00036360e856310ce5d294e8be33fc807077dc56ac80d95d9cd4ddbd21325eff73f70df6086551151f58b8afe6c195782c6a',
        'hex'
      )
    );
    await sut.recieveAct2();
    expect(
      sut.receiveAct3(
        Buffer.from(
          '00b9e3a702e93e3a9948c2ed6e5fd7590a6e1c3a0344cfc9d5b57357049aa22355361aa02e55a8fc28fef5bd6d71ad0c38228dc68b1c466263b47fdf31e560e139bb',
          'hex'
        )
      )
    ).rejects.toEqual(new Error('Unknown point format'));
  });
});
