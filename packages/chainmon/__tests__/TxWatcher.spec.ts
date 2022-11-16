/* eslint-disable @typescript-eslint/no-unsafe-argument */
import sinon from "sinon";
import { expect } from "chai";
import { OutPoint, Tx } from "@node-lightning/bitcoin";
import { BitcoindClient } from "@node-lightning/bitcoind";
import { TxWatcher } from "../lib";

describe("TxWatcher", () => {
    let bitcoind: sinon.SinonStubbedInstance<BitcoindClient>;
    let sut: TxWatcher;

    beforeEach(() => {
        bitcoind = sinon.createStubInstance(BitcoindClient);
        sut = new TxWatcher(bitcoind as any);
    });

    describe("event: client emits valid rawtx", () => {
        it("emits tx event", done => {
            sut.on("tx", (tx: Tx) => {
                expect(tx).to.not.be.undefined;
                expect(tx.version).to.equal(2);
                expect(tx.inputs[0].outpoint.toString()).to.equal("0f9aafa6848bdb3e05472898debcaccc47bacd35650ad1ec8e34743576b9652f:1"); // prettier-ignore
                done();
            });

            const rawtx = Buffer.from("020000000001012f65b9763574348eecd10a6535cdba47ccacbcde982847053edb8b84a6af9a0f0100000000feffffff027cb5642c0100000017a9140a735a29d6550e4f95d8da54fa1df1747f04a25b8774f819000000000017a914911eeae7f2d140c31b980c6e27376f1cf87ab08a870247304402201a6cf3c6557141be9631b25e421d3f3cf88067952d1c0ed5ef5930e6f5ebeee602200bf035f7c2c489698d885a559836f3c21dcbd4589c48367dbb57563e5b53d49601210266674381f9ad884942b93a355c76de82e517ca6ca2cd3a92a05601129409aefc89fd1f00", "hex"); // prettier-ignore
            (sut as any)._onRawTx(rawtx);
        });

        it("emits outputspent event", done => {
            sut.watchOutpoint(
                OutPoint.fromString(
                    "0f9aafa6848bdb3e05472898debcaccc47bacd35650ad1ec8e34743576b9652f:1",
                ),
            );

            sut.on("outpointspent", (tx: Tx, outpoint: OutPoint) => {
                expect(tx).to.not.be.undefined;
                expect(tx.version).to.equal(2);
                expect(tx.inputs[0].outpoint.toString()).to.equal("0f9aafa6848bdb3e05472898debcaccc47bacd35650ad1ec8e34743576b9652f:1"); // prettier-ignore
                expect(outpoint.toString()).to.equal("0f9aafa6848bdb3e05472898debcaccc47bacd35650ad1ec8e34743576b9652f:1"); // prettier-ignore
                done();
            });

            const rawtx = Buffer.from("020000000001012f65b9763574348eecd10a6535cdba47ccacbcde982847053edb8b84a6af9a0f0100000000feffffff027cb5642c0100000017a9140a735a29d6550e4f95d8da54fa1df1747f04a25b8774f819000000000017a914911eeae7f2d140c31b980c6e27376f1cf87ab08a870247304402201a6cf3c6557141be9631b25e421d3f3cf88067952d1c0ed5ef5930e6f5ebeee602200bf035f7c2c489698d885a559836f3c21dcbd4589c48367dbb57563e5b53d49601210266674381f9ad884942b93a355c76de82e517ca6ca2cd3a92a05601129409aefc89fd1f00", "hex"); // prettier-ignore
            (sut as any)._onRawTx(rawtx);
        });
    });

    describe("event: client emits bad rawtx", () => {
        it("emits error", done => {
            const rawtx = Buffer.from("020000000001012f65b9763574348eecd10a6535cdba47ccacbcde982847053edb8b84a6af9a0f0100000000feffffff027cb5642c0100000017a9140a735a29d6550e4f95d8da54fa1df1747f04a25b8774f819000000000016a914911eeae7f2d140c31b980c6e27376f1cf87ab08a870247304402201a6cf3c6557141be9631b25e421d3f3cf88067952d1c0ed5ef5930e6f5ebeee602200bf035f7c2c489698d885a559836f3c21dcbd4589c48367dbb57563e5b53d49601210266674381f9ad884942b93a355c76de82e517ca6ca2cd3a92a05601129409aefc89fd1f00", "hex"); // prettier-ignore
            sut.on("error", (err, buf) => {
                expect(buf).to.equal(rawtx);
                done();
            });
            (sut as any)._onRawTx(rawtx);
        });
    });
});
