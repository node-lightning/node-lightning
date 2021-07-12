import { expect } from "chai";
import { Invoice } from "../lib/invoice";

describe("invoice", () => {
    let sut: Invoice;

    beforeEach(() => {
        sut = new Invoice();
    });

    describe("general", () => {
        it("it should update existing value", () => {
            sut.shortDesc = "hello";
            sut.shortDesc = "world";
            expect(sut.shortDesc).to.equal("world");
        });
        it("it should update existing value without creating a 2nd field", () => {
            sut.shortDesc = "hello";
            sut.shortDesc = "world";
            expect(sut.fields.length).to.equal(1);
        });
    });

    describe("amount", () => {
        it("should set the amount when a Number", () => {
            sut.amount = "1";
            expect(sut.amount).to.equal("1.00000000000");
        });
        it("should set the amount when a String", () => {
            sut.amount = "1";
            expect(sut.amount).to.equal("1.00000000000");
        });
        it("should set 0 to null", () => {
            sut.amount = null;
            expect(sut.amount).to.equal(null);
        });
        it("should set null to null", () => {
            sut.amount = null;
            expect(sut.amount).to.equal(null);
        });
        it("should set empty string to null", () => {
            sut.amount = "";
            expect(sut.amount).to.equal(null);
        });
        it("should have correct amount when value set", () => {
            sut.valueSat = "1000";
            expect(sut.amount).to.equal("0.00001000000");
        });
        it("should have correct amount when valueMsat set", () => {
            sut.valueMsat = "1000";
            expect(sut.amount).to.equal("0.00000001000");
        });
        it("should have have value when sub sat", () => {
            sut.valueMsat = "10";
            expect(sut.amount).to.equal("0.00000000010");
        });
    });

    describe("valueSat", () => {
        it("should set the value when a Number", () => {
            sut.valueSat = "1";
            expect(sut.valueSat).to.equal("1");
        });
        it("should set the value when a String", () => {
            sut.valueSat = "1";
            expect(sut.valueSat).to.equal("1");
        });
        it("should set 0 to null", () => {
            sut.valueSat = null;
            expect(sut.valueSat).to.equal(null);
        });
        it("should set null to null", () => {
            sut.valueSat = null;
            expect(sut.valueSat).to.equal(null);
        });
        it("should set empty string to null", () => {
            sut.valueSat = "";
            expect(sut.valueSat).to.equal(null);
        });
        it("should have correct value when amount set", () => {
            sut.amount = "0.00001000";
            expect(sut.valueSat).to.equal("1000");
        });
        it("should have correct value when valueMsat set", () => {
            sut.valueMsat = "1000";
            expect(sut.valueSat).to.equal("1");
        });
    });

    describe("valueMsat", () => {
        it("should set the value when a Number", () => {
            sut.valueMsat = "1000";
            expect(sut.valueMsat).to.equal("1000");
        });
        it("should set the value when a String", () => {
            sut.valueMsat = "1000";
            expect(sut.valueMsat).to.equal("1000");
        });
        it("should set 0 to null", () => {
            sut.valueMsat = "0";
            expect(sut.valueMsat).to.equal(null);
        });
        it("should set null to null", () => {
            sut.valueMsat = null;
            expect(sut.valueMsat).to.equal(null);
        });
        it("should set empty string to null", () => {
            sut.valueMsat = null;
            expect(sut.valueMsat).to.equal(null);
        });
        it("should have correct value when amount set", () => {
            sut.amount = "0.00001";
            expect(sut.valueMsat).to.equal("1000000");
        });
        it("should have correct value when value set", () => {
            sut.valueSat = "1000";
            expect(sut.valueMsat).to.equal("1000000");
        });
    });

    describe("expiry", () => {
        it("default get value is 3600", () => {
            expect(sut.expiry).to.equal(3600);
        });
    });

    describe("minFinalCltvExpiry", () => {
        it("default get value is 9", () => {
            expect(sut.minFinalCltvExpiry).to.equal(9);
        });
        it("set will create field", () => {
            sut.minFinalCltvExpiry = 9;
            expect(sut.fields[0]).to.deep.equal({ type: 24, value: 9 });
        });
    });

    describe("paymentHash", () => {
        it("when set string converts to a buffer", () => {
            sut.paymentHash = Buffer.from(
                "0001020304050607080900010203040506070809000102030405060708090102",
                "hex",
            );
            expect(sut.paymentHash).to.deep.equal(
                Buffer.from(
                    "0001020304050607080900010203040506070809000102030405060708090102",
                    "hex",
                ),
            );
        });
        it("when set buffer keeps as buffer", () => {
            sut.paymentHash = Buffer.from(
                "0001020304050607080900010203040506070809000102030405060708090102",
                "hex",
            );
            expect(sut.paymentHash).to.deep.equal(
                Buffer.from(
                    "0001020304050607080900010203040506070809000102030405060708090102",
                    "hex",
                ),
            );
        });
    });

    describe("desc", () => {
        it("when set should set short desc when less than 640 bytes", () => {
            sut.desc = "hello";
            expect(sut.shortDesc).to.equal("hello");
            expect(sut.desc).to.equal("hello");
        });
        it("when set should set hash desc when longer than 640 bytes", () => {
            sut.desc =
                "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
            expect(sut.hashDesc).to.deep.equal(
                Buffer.from(
                    "b2a3a502fdfc34f4e3edfa94b7f3109cd972d87a4fec63ab21a6673379ccf7ad",
                    "hex",
                ),
            );
            expect(sut.desc).to.deep.equal(
                Buffer.from(
                    "b2a3a502fdfc34f4e3edfa94b7f3109cd972d87a4fec63ab21a6673379ccf7ad",
                    "hex",
                ),
            );
        });
    });

    describe("hashDesc", () => {
        it("when set string, sets to buffer", () => {
            sut.hashDesc = Buffer.from(
                "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
                "hex",
            );
            expect(sut.hashDesc).to.deep.equal(
                Buffer.from(
                    "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
                    "hex",
                ),
            );
        });
        it("when set buffer, keeps as buffer", () => {
            sut.hashDesc = Buffer.from(
                "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
                "hex",
            );
            expect(sut.hashDesc).to.deep.equal(
                Buffer.from(
                    "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
                    "hex",
                ),
            );
        });
    });

    describe("payeeNode", () => {
        it("when set string, converts to buffer", () => {
            sut.payeeNode = Buffer.from(
                "000102030405060708090001020304050607080900010203040506070809010200",
                "hex",
            );
            expect(sut.payeeNode).to.deep.equal(
                Buffer.from(
                    "000102030405060708090001020304050607080900010203040506070809010200",
                    "hex",
                ),
            );
        });
        it("when set buffer, keeps as buffer", () => {
            sut.payeeNode = Buffer.from(
                "000102030405060708090001020304050607080900010203040506070809010200",
                "hex",
            );
            expect(sut.payeeNode).to.deep.equal(
                Buffer.from(
                    "000102030405060708090001020304050607080900010203040506070809010200",
                    "hex",
                ),
            );
        });
    });

    describe("addFallbackAddress", () => {
        it("Bitcoin Mainnet P2PKH - 1", () => {
            sut.addFallbackAddress("17VZNX1SN5NtKa8UQFxwQbFeFc3iqRYhem");
            expect(sut.fields[0].value.version).to.equal(17);
            expect(sut.fields[0].value.address).to.deep.equal(
                Buffer.from("47376c6f537d62177a2c41c4ca9b45829ab99083", "hex"),
            );
        });
        it("Bitcoin Testnet P2PKH - m", () => {
            sut.addFallbackAddress("mipcBbFg9gMiCh81Kj8tqqdgoZub1ZJRfn");
            expect(sut.fields[0].value.version).to.equal(17);
            expect(sut.fields[0].value.address).to.deep.equal(
                Buffer.from("243f1394f44554f4ce3fd68649c19adc483ce924", "hex"),
            );
        });
        it("Bitcoin Testnet P2PKH - n", () => {
            sut.addFallbackAddress("n11ByR8jqq6DiPB7ny2Udt9tK7QDVKNXKw");
            expect(sut.fields[0].value.version).to.equal(17);
            expect(sut.fields[0].value.address).to.deep.equal(
                Buffer.from("d5c174880d3dcdaf904cd89f06f1f2862c948cb7", "hex"),
            );
        });
        it("Bitcoin Mainnet P2SH - 3", () => {
            sut.addFallbackAddress("3EktnHQD7RiAE6uzMj2ZifT9YgRrkSgzQX");
            expect(sut.fields[0].value.version).to.equal(18);
            expect(sut.fields[0].value.address).to.deep.equal(
                Buffer.from("8f55563b9a19f321c211e9b9f38cdf686ea07845", "hex"),
            );
        });
        it("Bitcoin Testnet P2SH - 2", () => {
            sut.addFallbackAddress("2MzQwSSnBHWHqSAqtTVQ6v47XtaisrJa1Vc");
            expect(sut.fields[0].value.version).to.equal(18);
            expect(sut.fields[0].value.address).to.deep.equal(
                Buffer.from("4e9f39ca4688ff102128ea4ccda34105324305b0", "hex"),
            );
        });
        it("Bitcoin Mainnet Bech32", () => {
            sut.addFallbackAddress("bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4");
            expect(sut.fields[0].value.version).to.equal(0);
            expect(sut.fields[0].value.address).to.deep.equal(
                Buffer.from("751e76e8199196d454941c45d1b3a323f1433bd6", "hex"),
            );
        });
        it("Bitcoin Testnet Bech32", () => {
            sut.addFallbackAddress("tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx");
            expect(sut.fields[0].value.version).to.equal(0);
            expect(sut.fields[0].value.address).to.deep.equal(
                Buffer.from("751e76e8199196d454941c45d1b3a323f1433bd6", "hex"),
            );
        });
    });
});
