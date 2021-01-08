import { OutPoint } from "../lib/OutPoint";
import { bip69InputSorter, bip69OutputSorter } from "../lib/LexicographicalSorters";
import { TxIn } from "../lib/TxIn";
import { TxOut } from "../lib/TxOut";
import { expect } from "chai";
import { Value } from "../lib/Value";
import { Script } from "../lib/Script";

describe("bip69InputSorter", () => {
    it("sorting by txid", () => {
        const inputs = [
            new TxIn(OutPoint.fromString("f320832a9d2e2452af63154bc687493484a0e7745ebd3aaf9ca19eb80834ad60:0")),
            new TxIn(OutPoint.fromString("26aa6e6d8b9e49bb0630aac301db6757c02e3619feb4ee0eea81eb1672947024:1")),
            new TxIn(OutPoint.fromString("0e53ec5dfb2cb8a71fec32dc9a634a35b7e24799295ddd5278217822e0b31f57:0")),
        ]; // prettier-ignore

        inputs.sort(bip69InputSorter);

        const results = inputs.map(p => p.outpoint.toString());
        expect(results).to.deep.equal([
            "0e53ec5dfb2cb8a71fec32dc9a634a35b7e24799295ddd5278217822e0b31f57:0",
            "26aa6e6d8b9e49bb0630aac301db6757c02e3619feb4ee0eea81eb1672947024:1",
            "f320832a9d2e2452af63154bc687493484a0e7745ebd3aaf9ca19eb80834ad60:0",
        ]);
    });

    it("sorting by output index", () => {
        const inputs = [
            new TxIn(OutPoint.fromString("35288d269cee1941eaebb2ea85e32b42cdb2b04284a56d8b14dcc3f5c65d6055:1")),
            new TxIn(OutPoint.fromString("35288d269cee1941eaebb2ea85e32b42cdb2b04284a56d8b14dcc3f5c65d6055:0")),
        ]; // prettier-ignore

        inputs.sort(bip69InputSorter);

        const results = inputs.map(p => p.outpoint.toString());
        expect(results).to.deep.equal([
            "35288d269cee1941eaebb2ea85e32b42cdb2b04284a56d8b14dcc3f5c65d6055:0",
            "35288d269cee1941eaebb2ea85e32b42cdb2b04284a56d8b14dcc3f5c65d6055:1",
        ]);
    });
});

describe("bip69OutputSorter", () => {
    it("sorts by amount first", () => {
        const outputs = [
            new TxOut(Value.fromSats(1000), new Script()),
            new TxOut(Value.fromSats(1), new Script()),
        ];

        outputs.sort(bip69OutputSorter);

        expect(outputs[0].value.sats.toString()).to.equal("1");
        expect(outputs[1].value.sats.toString()).to.equal("1000");
    });

    it("sorts by scriptPubKey of equal length", () => {
        const outputs = [
            new TxOut(
                Value.fromSats(1),
                new Script(
                    ...Script.parseCmds(
                        Buffer.from(
                            "41046a0765b5865641ce08dd39690aade26dfbf5511430ca428a3089261361cef170e3929a68aee3d8d4848b0c5111b0a37b82b86ad559fd2a745b44d8e8d9dfdc0cac",
                            "hex",
                        ),
                    ),
                ),
            ),
            new TxOut(
                Value.fromSats(1),
                new Script(
                    ...Script.parseCmds(
                        Buffer.from(
                            "41044a656f065871a353f216ca26cef8dde2f03e8c16202d2e8ad769f02032cb86a5eb5e56842e92e19141d60a01928f8dd2c875a390f67c1f6c94cfc617c0ea45afac",
                            "hex",
                        ),
                    ),
                ),
            ),
        ];

        outputs.sort(bip69OutputSorter);

        expect(outputs[0].serialize().toString("hex")).to.deep.equal(
            "01000000000000004341044a656f065871a353f216ca26cef8dde2f03e8c16202d2e8ad769f02032cb86a5eb5e56842e92e19141d60a01928f8dd2c875a390f67c1f6c94cfc617c0ea45afac",
        );
        expect(outputs[1].serialize().toString("hex")).to.deep.equal(
            "01000000000000004341046a0765b5865641ce08dd39690aade26dfbf5511430ca428a3089261361cef170e3929a68aee3d8d4848b0c5111b0a37b82b86ad559fd2a745b44d8e8d9dfdc0cac",
        );
    });
});
