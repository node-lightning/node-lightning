import { expect } from "chai";
import { hkdf } from "../lib/hkdf";

describe("hkdf", () => {
    describe("general", () => {
        it("should not overflow on length", () => {
            expect(() => hkdf(Buffer.alloc(32, 1), 8192)).to.throw();
        });
    });

    describe("rfc5869 vectors", () => {
        const vectors = [
      {
        title: "1. Basic test case with SHA-256",
        hash: "sha256",
        ikm: "0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b",
        salt: "000102030405060708090a0b0c",
        len: 42,
        info: "f0f1f2f3f4f5f6f7f8f9",
        output: "3cb25f25faacd57a90434f64d0362f2a2d2d0a90cf1a5a4c5db02d56ecc4c5bf34007208d5b887185865",
      },
      {
        title: "2. Test with SHA-256 and longer input/outputs",
        hash: "sha256",
        ikm: "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f202122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f404142434445464748494a4b4c4d4e4f",
        salt: "606162636465666768696a6b6c6d6e6f707172737475767778797a7b7c7d7e7f808182838485868788898a8b8c8d8e8f909192939495969798999a9b9c9d9e9fa0a1a2a3a4a5a6a7a8a9aaabacadaeaf",
        len: 82,
        info: "b0b1b2b3b4b5b6b7b8b9babbbcbdbebfc0c1c2c3c4c5c6c7c8c9cacbcccdcecfd0d1d2d3d4d5d6d7d8d9dadbdcdddedfe0e1e2e3e4e5e6e7e8e9eaebecedeeeff0f1f2f3f4f5f6f7f8f9fafbfcfdfeff",
        output: "b11e398dc80327a1c8e7f78c596a49344f012eda2d4efad8a050cc4c19afa97c59045a99cac7827271cb41c65e590e09da3275600c2f09b8367793a9aca3db71cc30c58179ec3e87c14c01d5c1f3434f1d87",
      },
      {
        title: "3. Test with SHA-256 and zero-length salt/info",
        hash: "sha256",
        ikm: "0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b",
        salt: "",
        len: 42,
        info: "",
        output: "8da4e775a563c18f715f802a063c5a31b8a11f5c5ee1879ec3454e5f3c738d2d9d201395faa4b61a96c8",
      },
      {
        title: "4. Basic test case with SHA-1",
        hash: "sha1",
        ikm: "0b0b0b0b0b0b0b0b0b0b0b",
        salt: "000102030405060708090a0b0c",
        len: 42,
        info: "f0f1f2f3f4f5f6f7f8f9",
        output: "085a01ea1b10f36933068b56efa5ad81a4f14b822f5b091568a9cdd4f155fda2c22e422478d305f3f896",
      },
      {
        title: "5. Test with SHA-1 and longer inputs/outputs",
        hash: "sha1",
        ikm: "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f202122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f404142434445464748494a4b4c4d4e4f",
        salt: "606162636465666768696a6b6c6d6e6f707172737475767778797a7b7c7d7e7f808182838485868788898a8b8c8d8e8f909192939495969798999a9b9c9d9e9fa0a1a2a3a4a5a6a7a8a9aaabacadaeaf",
        len: 82,
        info: "b0b1b2b3b4b5b6b7b8b9babbbcbdbebfc0c1c2c3c4c5c6c7c8c9cacbcccdcecfd0d1d2d3d4d5d6d7d8d9dadbdcdddedfe0e1e2e3e4e5e6e7e8e9eaebecedeeeff0f1f2f3f4f5f6f7f8f9fafbfcfdfeff",
        output: "0bd770a74d1160f7c9f12cd5912a06ebff6adcae899d92191fe4305673ba2ffe8fa3f1a4e5ad79f3f334b3b202b2173c486ea37ce3d397ed034c7f9dfeb15c5e927336d0441f4c4300e2cff0d0900b52d3b4",
      },
    ]; // prettier-ignore

        for (const vector of vectors) {
            it(vector.title, () => {
                const actual = hkdf(
                    Buffer.from(vector.ikm, "hex"),
                    vector.len,
                    Buffer.from(vector.salt, "hex"),
                    Buffer.from(vector.info, "hex"),
                    vector.hash,
                );
                expect(actual.toString("hex")).to.equal(vector.output);
            });
        }
    });

    describe("BOLT #8 vectors", () => {
        const vectors = [
      {
        title: "Noise initiator act 1",
        salt: "2640f52eebcd9e882958951c794250eedb28002c05d7dc2ea0f195406042caf1",
        ikm: "1e2fb3c8fe8fb9f262f649f64d26ecf0f2c0a805a767cf02dc2d77a6ef1fdcc3",
        len: 64,
        output: "b61ec1191326fa240decc9564369dbb3ae2b34341d1e11ad64ed89f89180582fe68f69b7f096d7917245f5e5cf8ae1595febe4d4644333c99f9c4a1282031c9f",
      },
      {
        title: "Noise initiator act 2",
        salt: "b61ec1191326fa240decc9564369dbb3ae2b34341d1e11ad64ed89f89180582f",
        ikm: "c06363d6cc549bcb7913dbb9ac1c33fc1158680c89e972000ecd06b36c472e47",
        len: 64,
        output: "e89d31033a1b6bf68c07d22e08ea4d7884646c4b60a9528598ccb4ee2c8f56ba908b166535c01a935cf1e130a5fe895ab4e6f3ef8855d87e9b7581c4ab663ddc",
      },
      {
        title: "Noise initiator act 3",
        salt: "e89d31033a1b6bf68c07d22e08ea4d7884646c4b60a9528598ccb4ee2c8f56ba",
        ikm: "b36b6d195982c5be874d6d542dc268234379e1ae4ff1709402135b7de5cf0766",
        len: 64,
        output: "919219dbb2920afa8db80f9a51787a840bcf111ed8d588caf9ab4be716e42b01981a46c820fb7a241bc8184ba4bb1f01bcdfafb00dde80098cb8c38db9141520",
      },
      {
        title: "Noise responder act 1",
        salt: "2640f52eebcd9e882958951c794250eedb28002c05d7dc2ea0f195406042caf1",
        ikm: "1e2fb3c8fe8fb9f262f649f64d26ecf0f2c0a805a767cf02dc2d77a6ef1fdcc3",
        len: 64,
        output: "b61ec1191326fa240decc9564369dbb3ae2b34341d1e11ad64ed89f89180582fe68f69b7f096d7917245f5e5cf8ae1595febe4d4644333c99f9c4a1282031c9f",
      },
      {
        title: "Noise responder act 2",
        salt: "b61ec1191326fa240decc9564369dbb3ae2b34341d1e11ad64ed89f89180582f",
        ikm: "c06363d6cc549bcb7913dbb9ac1c33fc1158680c89e972000ecd06b36c472e47",
        len: 64,
        output: "e89d31033a1b6bf68c07d22e08ea4d7884646c4b60a9528598ccb4ee2c8f56ba908b166535c01a935cf1e130a5fe895ab4e6f3ef8855d87e9b7581c4ab663ddc",
      },
      {
        title: "Noise responder act 3",
        salt: "e89d31033a1b6bf68c07d22e08ea4d7884646c4b60a9528598ccb4ee2c8f56ba",
        ikm: "b36b6d195982c5be874d6d542dc268234379e1ae4ff1709402135b7de5cf0766",
        len: 64,
        output: "919219dbb2920afa8db80f9a51787a840bcf111ed8d588caf9ab4be716e42b01981a46c820fb7a241bc8184ba4bb1f01bcdfafb00dde80098cb8c38db9141520",
      },
    ]; // prettier-ignore

        for (const vector of vectors) {
            it(vector.title, () => {
                const actual = hkdf(
                    Buffer.from(vector.ikm, "hex"),
                    vector.len,
                    Buffer.from(vector.salt, "hex"),
                );
                expect(actual.toString("hex")).to.equal(vector.output);
            });
        }
    });
});
