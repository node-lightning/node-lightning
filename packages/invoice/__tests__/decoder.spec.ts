import { expect } from "chai";
import crypto from "crypto";
import bs58check from "bs58check";
import bech32 from "bech32";
import * as sut from "../lib/decoder";

describe("decoder", () => {
    it("must fail if checksum incorrect", () => {
        const input = "lnbc1pvjluezca784w";
        expect(() => sut.decode(input)).to.throw(/Invalid checksum/);
    });

    it("must fail if prefix does not start with ln", () => {
        const input = bech32.encode("bad", bech32.toWords("test" as any));
        expect(() => sut.decode(input)).to.throw(/Invalid prefix/);
    });

    it("must fail if unknown network", () => {
        const input = bech32.encode("lnbad1", bech32.toWords("test" as any));
        expect(() => sut.decode(input)).to.throw(/Invalid network/);
    });

    it("must fail if amount contains non-digit", () => {
        const input = bech32.encode("lnbc1&m", bech32.toWords("test" as any));
        expect(() => sut.decode(input)).to.throw(/Invalid character/);
    });

    it("must fail if multiplier contains non-digit", () => {
        const input = bech32.encode("lnbc1m&", bech32.toWords("test" as any));
        expect(() => sut.decode(input)).to.throw(/Invalid character/);
    });

    it("must fail if amount contains invalid amount", () => {
        const input = bech32.encode("lnbc0m", bech32.toWords("test" as any));
        expect(() => sut.decode(input)).to.throw(/Invalid amount/);
    });

    it("must fail when multiplier without amount", () => {
        const input = bech32.encode("lnbcm", bech32.toWords("test" as any));
        expect(() => sut.decode(input)).to.throw(/Invalid network/);
    });

    it("must fail if amount contains invalid multiplier", () => {
        const input = bech32.encode("lnbc1a", bech32.toWords("test" as any));
        expect(() => sut.decode(input)).to.throw(/Invalid multiplier/);
    });

    it("should have no amount when amount is empty", () => {
        const input = "lnbc1pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdq5xysxxatsyp3k7enxv4jshwlglv23cytkzvq8ld39drs8sq656yh2zn0aevrwu6uqctaklelhtpjnmgjdzmvwsh0kuxuwqf69fjeap9m5mev2qzpp27xfswhs5vgqmn9xzq"; // prettier-ignore
        const result = sut.decode(input);
        expect(result.valueMsat).to.be.null;
    });

    it("should have correct valueMsat with pico multiplier", () => {
        const input = "lnbc10p1pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdq5xysxxatsyp3k7enxv4jseccf6w0x0jznsldtk8zggwp4py4ck2yk5gsgxdu5udzel4ct9gtsyy7nexyfwflwrxl4wpy96uks55uv4fuc3cdjr3tj83wzjp8q6vcq0la8ay"; // prettier-ignore
        const result = sut.decode(input);
        expect(result.valueMsat).to.equal("1");
    });

    it("should have correct valueMsat with nano multiplier", () => {
        const input = "lnbc1n1pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdq5xysxxatsyp3k7enxv4jsydccnehd6uwnnkpk3v94mfeun6rk025yygw0l73usy93snxzwmmhzqxpu2nv80dp2hz47y8tk8znv3mnaez5lvhznfws500cp8f43ucp00ns2d"; // prettier-ignore
        const result = sut.decode(input);
        expect(result.valueMsat).to.equal("100");
    });

    it("should have correct amount with micro multiplier", () => {
        const input = "lnbc1u1pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdq5xysxxatsyp3k7enxv4jssz5kxlujxj66rcfq6w2ye7dr27u3unumw6wkrs3r9795lrwzallswnvsa0l6dfqm8rzmquv20dqj5zv48n352qfwqtw8572vdha9f0spm5lkzk"; // prettier-ignore
        const result = sut.decode(input);
        expect(result.valueMsat).to.equal("100000");
    });

    it("should have correct amount with milli multiplier", () => {
        const input = "lnbc1m1pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdq5xysxxatsyp3k7enxv4js6qu20kendkn4qgalrnmcwmnffvswt0clnlfeuqkcdenpttsqynh3fl37rqrvc2p8y80jxcyz470ur69jh2ugfcdgjyu0l0mmh0ja2vcpzgn39l"; //prettier-ignore
        const result = sut.decode(input);
        expect(result.valueMsat).to.equal("100000000");
    });

    it("should have correct amount with no multiplier", () => {
        const input = "lnbc11pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdq5xysxxatsyp3k7enxv4jsn4qy2qvfxxml5e6mnynqy9mhz4x4vqzqtnwp92fw6xrz5rvspm98u6jg0slh85kq7934eh86tg2up7h5cxhyf229gsrrtstfw5zcheqqm2ezmv"; // prettier-ignore
        const result = sut.decode(input);
        expect(result.valueMsat).to.equal("100000000000");
    });

    it("must skip f field with unknown version", () => {
        const input = "lnbc11pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdq5xysxxatsyp3k7enxv4jsfqfndpjkcmr0vwkqhkwv54grmkq6r8w4tweqj3d44x66fx42uc6zufkw6ytdus4jxnyrwce5ryjv5hs23l4zcrl2u0vuzzs73eeyugr8gf85gcufgycpmplv60"; // prettier-ignore
        const result = sut.decode(input);
        expect(result.unknownFields[0]).to.deep.equal({
            type: 9,
            value: {
                version: 19,
                address: Buffer.from("hello"),
            },
        });
    });

    it("must skip p (payment hash) with length !== 52", () => {
        // generated with payment hash '000102030405060708090001020304050607080900010203040506070809010200000000';
        const input =
            "lnbc1pvjluezdpl2pkx2ctnv5sxxmmwwd5kgetjypeh2ursdae8g6twvus8g6rfwvs8qun0dfjkxaqpp6qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqqqqqqqtqaxnfek4ygrx305qsmd2dgrd3wgwcln668ap6mdtsxlyf0v9g9hts94px9z7adcgkwv66ydzjufx4qgr3jvs09mleuctyv3yjnsdcsphnuj0m";
        const result = sut.decode(input);
        const unknown = result.unknownFields[0];
        expect(unknown).to.not.be.undefined;
        expect(unknown.type).to.equal(1);
        expect(unknown.value.toString("hex")).to.equal(
            "000102030405060708090001020304050607080900010203040506070809010200000000",
        );
    });

    it("must skip h (hash desc) field with length !== 52", () => {
        // generateed with invalid hash description: 00000000000000000000000000000000112233
        const input =
            "lnbc11pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqhqlqqqqqqqqqqqqqqqqqqqqqqqqqqgjyvcj9m7zcp3s9uamfa0ud53vw7ejlw6kzzyfmaek6s8ndfc05f4tu054t38mz4n0y4w39sla46zaj8nt37s8pgt56y7p4gu29uhhued85sq3lfz5f";
        const result = sut.decode(input);
        const unknown = result.unknownFields[0];
        expect(unknown).to.not.be.undefined;
        expect(unknown.type).to.equal(23);
        expect(unknown.value.toString("hex")).to.equal("00000000000000000000000000000000112233");
    });

    it("must skip n (payee node) with length !== 53", () => {
        // generated with payee node of invalid pub key: 029e03a901b85534ff1e92c43c74431f7ce72046060fcf7a95c37e148f78c7725500000000
        const input =
            "lnbc11pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdq5xysxxatsyp3k7enxv4jsnpuq20q82gphp2nflc7jtzrcazrra7wwgzxqc8u7754cdlpfrmccae92qqqqqqqulye7spj6xpv60s0xhxtd3nysc6pl2e787p4xz3upel08ldnztsxuk9444972yjg8ukjdx64jmxq77fw28nf652ut68pwjx98zqlmuqpjz27xn";
        const result = sut.decode(input);
        const unknown = result.unknownFields[0];
        expect(unknown).to.not.be.undefined;
        expect(unknown.type).to.equal(19);
        expect(unknown.value.toString("hex")).to.equal(
            "029e03a901b85534ff1e92c43c74431f7ce72046060fcf7a95c37e148f78c7725500000000",
        );
    });

    // TODO: this should be moved to the validator
    it("must check sha256 of h field matches the hashed description");

    it("must use n field (payee node) to validate signature instead of performing signature recovery if a valid n is provided", () => {
        const input =
            "lnbc11pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdq5xysxxatsyp3k7enxv4jsnp4q0n326hr8v9zprg8gsvezcch06gfaqqhde2aj730yg0durunfhv66ghfg0ykn0a8jsk8qvcsgv053m8celd4r3ae6n6upln5v4mvddjrnvzf08tk40t40j4r5t82x9qqqwp86udyxy3le8qvkmhzgpld0etsqd3ew8u";
        expect(() => sut.decode(input)).to.not.throw();
    });

    it("should throw when invalid pubkey assigned to payee node field", () => {
        const input =
            "lnbc11pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdq5xysxxatsyp3k7enxv4jsnp4q0n326hr8v9zprg8gsvezcch06gfaqqhde2aj730yg0durunfhv65407eksnvvecq9vztqk0gtajdze0srmjkz5kaatkjp3afc2fm62xrkf4s345v36vwm9mvse86dpuk9wq2cnsy6jym6cu2xl0rt0p4vqcpje3h3d";
        expect(() => sut.decode(input)).to.throw(/Signature invalid/);
    });

    describe("test vectors", () => {
        const sha256 = crypto.createHash("sha256");
        sha256.update("One piece of chocolate cake, one icecream cone, one pickle, one slice of swiss cheese, one slice of salami, one lollypop, one piece of cherry pie, one sausage, one cupcake, and one slice of watermelon"); // prettier-ignore
        const hashDescription = sha256.digest();

        const pubkey = Buffer.from(
            "03e7156ae33b0a208d0744199163177e909e80176e55d97a2f221ede0f934dd9ad",
            "hex",
        );

        it("donation of any amount using payment_hash 0001020304050607080900010203040506070809000102030405060708090102 to me @03e7156ae33b0a208d0744199163177e909e80176e55d97a2f221ede0f934dd9ad", () => {
            const input =
                "lnbc1pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdpl2pkx2ctnv5sxxmmwwd5kgetjypeh2ursdae8g6twvus8g6rfwvs8qun0dfjkxaq8rkx3yf5tcsyz3d73gafnh3cax9rn449d9p5uxz9ezhhypd0elx87sjle52x86fux2ypatgddc6k63n7erqz25le42c4u4ecky03ylcqca784w";
            const result = sut.decode(input);
            expect(result.network).to.equal("bc");
            expect(result.valueMsat).to.be.null;
            expect(result.timestamp).to.equal(1496314658);
            expect(result.paymentHash).to.deep.equal(
                Buffer.from(
                    "0001020304050607080900010203040506070809000102030405060708090102",
                    "hex",
                ),
            );
            expect(result.shortDesc).to.equal("Please consider supporting this project");
            expect(result.signature.r).to.deep.equal(
                Buffer.from(
                    "38ec6891345e204145be8a3a99de38e98a39d6a569434e1845c8af7205afcfcc",
                    "hex",
                ),
            );
            expect(result.signature.s).to.deep.equal(
                Buffer.from(
                    "7f425fcd1463e93c32881ead0d6e356d467ec8c02553f9aab15e5738b11f127f",
                    "hex",
                ),
            );
            expect(result.signature.recoveryFlag).to.equal(0);
            expect(result.pubkey).to.deep.equal(pubkey);
        });

        it("send $3 for a cup of coffee to the same peer, within 1 minute", () => {
            const input =
                "lnbc2500u1pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdq5xysxxatsyp3k7enxv4jsxqzpuaztrnwngzn3kdzw5hydlzf03qdgm2hdq27cqv3agm2awhz5se903vruatfhq77w3ls4evs3ch9zw97j25emudupq63nyw24cg27h2rspfj9srp";
            const result = sut.decode(input);
            expect(result.network).to.equal("bc");
            expect(parseFloat(result.amount)).to.equal(0.0025);
            expect(result.valueSat).to.equal("250000");
            expect(result.timestamp).to.equal(1496314658);
            expect(result.fields.length).to.equal(3);
            expect(result.paymentHash).to.deep.equal(
                Buffer.from(
                    "0001020304050607080900010203040506070809000102030405060708090102",
                    "hex",
                ),
            );
            expect(result.shortDesc).to.equal("1 cup coffee");
            expect(result.expiry).to.equal(60);
            expect(result.signature.r).to.deep.equal(
                Buffer.from(
                    "e89639ba6814e36689d4b91bf125f10351b55da057b00647a8dabaeb8a90c95f",
                    "hex",
                ),
            );
            expect(result.signature.s).to.deep.equal(
                Buffer.from(
                    "160f9d5a6e0f79d1fc2b964238b944e2fa4aa677c6f020d466472ab842bd750e",
                    "hex",
                ),
            );
            expect(result.signature.recoveryFlag).to.deep.equal(1);
            expect(result.pubkey).to.deep.equal(pubkey);
        });

        it("send 0.0025 BTC for a cup of nonsense (ナンセンス 1杯) to the same peer, within 1 minute", () => {
            const input =
                "lnbc2500u1pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdpquwpc4curk03c9wlrswe78q4eyqc7d8d0xqzpuyk0sg5g70me25alkluzd2x62aysf2pyy8edtjeevuv4p2d5p76r4zkmneet7uvyakky2zr4cusd45tftc9c5fh0nnqpnl2jfll544esqchsrny";
            const result = sut.decode(input);
            expect(result.network).to.equal("bc");
            expect(result.valueSat).to.equal("250000");
            expect(result.timestamp).to.equal(1496314658);
            expect(result.fields.length).to.equal(3);
            expect(result.paymentHash).to.deep.equal(
                Buffer.from(
                    "0001020304050607080900010203040506070809000102030405060708090102",
                    "hex",
                ),
            );
            expect(result.shortDesc).to.equal("ナンセンス 1杯");
            expect(result.expiry).to.equal(60);
            expect(result.signature.r).to.deep.equal(
                Buffer.from(
                    "259f04511e7ef2aa77f6ff04d51b4ae9209504843e5ab9672ce32a153681f687",
                    "hex",
                ),
            );
            expect(result.signature.s).to.deep.equal(
                Buffer.from(
                    "515b73ce57ee309db588a10eb8e41b5a2d2bc17144ddf398033faa49ffe95ae6",
                    "hex",
                ),
            );
            expect(result.signature.recoveryFlag).to.deep.equal(0);
            expect(result.pubkey).to.deep.equal(pubkey);
        });

        it("send $24 for an entire list of things (hashed)", () => {
            const input =
                "lnbc20m1pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqhp58yjmdan79s6qqdhdzgynm4zwqd5d7xmw5fk98klysy043l2ahrqscc6gd6ql3jrc5yzme8v4ntcewwz5cnw92tz0pc8qcuufvq7khhr8wpald05e92xw006sq94mg8v2ndf4sefvf9sygkshp5zfem29trqq2yxxz7";
            const result = sut.decode(input);
            expect(result.network).to.equal("bc");
            expect(parseFloat(result.amount)).to.equal(0.02);
            expect(result.valueSat).to.equal("2000000");
            expect(result.timestamp).to.equal(1496314658);
            expect(result.fields.length).to.equal(2);
            expect(result.paymentHash).to.deep.equal(
                Buffer.from(
                    "0001020304050607080900010203040506070809000102030405060708090102",
                    "hex",
                ),
            );
            expect(result.hashDesc).to.deep.equal(hashDescription);
            expect(result.signature.r).to.deep.equal(
                Buffer.from(
                    "c63486e81f8c878a105bc9d959af1973854c4dc552c4f0e0e0c7389603d6bdc6",
                    "hex",
                ),
            );
            expect(result.signature.s).to.deep.equal(
                Buffer.from(
                    "7707bf6be992a8ce7bf50016bb41d8a9b5358652c4960445a170d049ced4558c",
                    "hex",
                ),
            );
            expect(result.signature.recoveryFlag).to.deep.equal(0);
            expect(result.pubkey).to.deep.equal(pubkey);
        });

        it("send $24, on itnet, with a fallback address mk2QpYatsKicvFVuTAQLBryyccRXMUaGHP", () => {
            const input =
                "lntb20m1pvjluezhp58yjmdan79s6qqdhdzgynm4zwqd5d7xmw5fk98klysy043l2ahrqspp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqfpp3x9et2e20v6pu37c5d9vax37wxq72un98kmzzhznpurw9sgl2v0nklu2g4d0keph5t7tj9tcqd8rexnd07ux4uv2cjvcqwaxgj7v4uwn5wmypjd5n69z2xm3xgksg28nwht7f6zspwp3f9t";
            const result = sut.decode(input);
            expect(result.network).to.equal("tb");
            expect(result.valueSat).to.equal("2000000");
            expect(result.timestamp).to.equal(1496314658);
            expect(result.fields.length).to.equal(3);
            expect(result.hashDesc).to.deep.equal(hashDescription);
            expect(result.paymentHash).to.deep.equal(
                Buffer.from(
                    "0001020304050607080900010203040506070809000102030405060708090102",
                    "hex",
                ),
            );
            expect(result.fallbackAddresses[0].version).to.equal(17);
            expect(result.fallbackAddresses[0].address).to.deep.equal(
                bs58check.decode("mk2QpYatsKicvFVuTAQLBryyccRXMUaGHP").slice(1), // get rid of p2pkh prefix
            );
            expect(result.signature.r).to.deep.equal(
                Buffer.from(
                    "b6c42b8a61e0dc5823ea63e76ff148ab5f6c86f45f9722af0069c7934daff70d",
                    "hex",
                ),
            );
            expect(result.signature.s).to.deep.equal(
                Buffer.from(
                    "5e315893300774c897995e3a7476c8193693d144a36e2645a0851e6ebafc9d0a",
                    "hex",
                ),
            );
            expect(result.signature.recoveryFlag).to.deep.equal(1);
            expect(result.pubkey).to.deep.equal(pubkey);
        });

        it("send $24, on mainnet, with fallback address 1RustyRX2oai4EYYDpQGWvEL62BBGqN9T with extra routing info to go via nodes 029e03a901b85534ff1e92c43c74431f7ce72046060fcf7a95c37e148f78c77255 then 039e03a901b85534ff1e92c43c74431f7ce72046060fcf7a95c37e148f78c77255", () => {
            const input =
                "lnbc20m1pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqhp58yjmdan79s6qqdhdzgynm4zwqd5d7xmw5fk98klysy043l2ahrqsfpp3qjmp7lwpagxun9pygexvgpjdc4jdj85fr9yq20q82gphp2nflc7jtzrcazrra7wwgzxqc8u7754cdlpfrmccae92qgzqvzq2ps8pqqqqqqpqqqqq9qqqvpeuqafqxu92d8lr6fvg0r5gv0heeeqgcrqlnm6jhphu9y00rrhy4grqszsvpcgpy9qqqqqqgqqqqq7qqzqj9n4evl6mr5aj9f58zp6fyjzup6ywn3x6sk8akg5v4tgn2q8g4fhx05wf6juaxu9760yp46454gpg5mtzgerlzezqcqvjnhjh8z3g2qqdhhwkj";
            const result = sut.decode(input);
            expect(result.network).to.equal("bc");
            expect(result.valueSat).to.equal("2000000");
            expect(result.timestamp).to.equal(1496314658);
            expect(result.fields.length).to.equal(4);
            expect(result.paymentHash).to.deep.equal(
                Buffer.from(
                    "0001020304050607080900010203040506070809000102030405060708090102",
                    "hex",
                ),
            );
            expect(result.hashDesc).to.deep.equal(hashDescription);
            expect(result.fallbackAddresses[0].version).to.equal(17);
            expect(result.fallbackAddresses[0].address).to.deep.equal(
                bs58check.decode("1RustyRX2oai4EYYDpQGWvEL62BBGqN9T").slice(1), // get rid of pubkey hash prefix 00
            );
            expect(result.routes[0][0].pubkey).to.deep.equal(
                Buffer.from(
                    "029e03a901b85534ff1e92c43c74431f7ce72046060fcf7a95c37e148f78c77255",
                    "hex",
                ),
            );
            expect(result.routes[0][0].short_channel_id).to.deep.equal(
                Buffer.from("0102030405060708", "hex"),
            );
            expect(result.routes[0][0].fee_base_msat).to.equal(1);
            expect(result.routes[0][0].fee_proportional_millionths).to.equal(20);
            expect(result.routes[0][0].cltv_expiry_delta).to.equal(3);
            expect(result.routes[0][1].pubkey).to.deep.equal(
                Buffer.from(
                    "039e03a901b85534ff1e92c43c74431f7ce72046060fcf7a95c37e148f78c77255",
                    "hex",
                ),
            );
            expect(result.routes[0][1].short_channel_id).to.deep.equal(
                Buffer.from("030405060708090a", "hex"),
            );
            expect(result.routes[0][1].fee_base_msat).to.equal(2);
            expect(result.routes[0][1].fee_proportional_millionths).to.equal(30);
            expect(result.routes[0][1].cltv_expiry_delta).to.equal(4);
            expect(result.signature.r).to.deep.equal(
                Buffer.from(
                    "91675cb3fad8e9d915343883a49242e074474e26d42c7ed914655689a8074553",
                    "hex",
                ),
            );
            expect(result.signature.s).to.deep.equal(
                Buffer.from(
                    "733e8e4ea5ce9b85f69e40d755a55014536b12323f8b220600c94ef2b9c51428",
                    "hex",
                ),
            );
            expect(result.signature.recoveryFlag).to.deep.equal(0);
            expect(result.pubkey).to.deep.equal(pubkey);
        });

        it("send $24, on mainnet, with fallback (P2SH) address 3EktnHQD7RiAE6uzMj2ZifT9YgRrkSgzQX", () => {
            const input =
                "lnbc20m1pvjluezhp58yjmdan79s6qqdhdzgynm4zwqd5d7xmw5fk98klysy043l2ahrqspp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqfppj3a24vwu6r8ejrss3axul8rxldph2q7z9kmrgvr7xlaqm47apw3d48zm203kzcq357a4ls9al2ea73r8jcceyjtya6fu5wzzpe50zrge6ulk4nvjcpxlekvmxl6qcs9j3tz0469gq5g658y";
            const result = sut.decode(input);
            expect(result.network).to.equal("bc");
            expect(result.valueSat).to.equal("2000000");
            expect(result.timestamp).to.equal(1496314658);
            expect(result.fields.length).to.equal(3);
            expect(result.hashDesc).to.deep.equal(hashDescription);
            expect(result.paymentHash).to.deep.equal(
                Buffer.from(
                    "0001020304050607080900010203040506070809000102030405060708090102",
                    "hex",
                ),
            );
            expect(result.fallbackAddresses[0].version).to.equal(18);
            expect(result.fallbackAddresses[0].address).to.deep.equal(
                bs58check.decode("3EktnHQD7RiAE6uzMj2ZifT9YgRrkSgzQX").slice(1), // get rid of p2sh prefix 5
            );
            expect(result.signature.r).to.deep.equal(
                Buffer.from(
                    "b6c6860fc6ff41bafba1745b538b6a7c6c2c0234f76bf817bf567be88cf2c632",
                    "hex",
                ),
            );
            expect(result.signature.s).to.deep.equal(
                Buffer.from(
                    "492c9dd279470841cd1e21a33ae7ed59b25809bf9b3366fe81881651589f5d15",
                    "hex",
                ),
            );
            expect(result.signature.recoveryFlag).to.deep.equal(0);
            expect(result.pubkey).to.deep.equal(pubkey);
        });

        it("send $24, on mainnet, with fallback (P2WPKH) address bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4", () => {
            const input =
                "lnbc20m1pvjluezhp58yjmdan79s6qqdhdzgynm4zwqd5d7xmw5fk98klysy043l2ahrqspp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqfppqw508d6qejxtdg4y5r3zarvary0c5xw7kepvrhrm9s57hejg0p662ur5j5cr03890fa7k2pypgttmh4897d3raaq85a293e9jpuqwl0rnfuwzam7yr8e690nd2ypcq9hlkdwdvycqa0qza8";
            const result = sut.decode(input);
            const { words } = bech32.decode("bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4");
            const p2wpkh = Buffer.from(bech32.fromWords(words.slice(1)));
            expect(result.network).to.equal("bc");
            expect(result.valueSat).to.equal("2000000");
            expect(result.timestamp).to.equal(1496314658);
            expect(result.fields.length).to.equal(3);
            expect(result.hashDesc).to.deep.equal(hashDescription);
            expect(result.paymentHash).to.deep.equal(
                Buffer.from(
                    "0001020304050607080900010203040506070809000102030405060708090102",
                    "hex",
                ),
            );
            expect(result.fallbackAddresses[0].version).to.equal(0);
            expect(result.fallbackAddresses[0].address).to.deep.equal(p2wpkh);
            expect(result.signature.r).to.deep.equal(
                Buffer.from(
                    "c8583b8f65853d7cc90f0eb4ae0e92a606f89caf4f7d65048142d7bbd4e5f362",
                    "hex",
                ),
            );
            expect(result.signature.s).to.deep.equal(
                Buffer.from(
                    "3ef407a75458e4b20f00efbc734f1c2eefc419f3a2be6d51038016ffb35cd613",
                    "hex",
                ),
            );
            expect(result.signature.recoveryFlag).to.deep.equal(0);
            expect(result.pubkey).to.deep.equal(pubkey);
        });

        it("send $24, on mainnet, with fallback (P2WSH) address bc1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3qccfmv3", () => {
            const input =
                "lnbc20m1pvjluezhp58yjmdan79s6qqdhdzgynm4zwqd5d7xmw5fk98klysy043l2ahrqspp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqfp4qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3q28j0v3rwgy9pvjnd48ee2pl8xrpxysd5g44td63g6xcjcu003j3qe8878hluqlvl3km8rm92f5stamd3jw763n3hck0ct7p8wwj463cql26ava";
            const result = sut.decode(input);
            const { words } = bech32.decode(
                "bc1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3qccfmv3",
            );
            const address = Buffer.from(bech32.fromWords(words.slice(1)));
            expect(result.network).to.equal("bc");
            expect(result.valueSat).to.equal("2000000");
            expect(result.timestamp).to.equal(1496314658);
            expect(result.fields.length).to.equal(3);
            expect(result.hashDesc).to.deep.equal(hashDescription);
            expect(result.paymentHash).to.deep.equal(
                Buffer.from(
                    "0001020304050607080900010203040506070809000102030405060708090102",
                    "hex",
                ),
            );
            expect(result.fallbackAddresses[0].version).to.equal(0);
            expect(result.fallbackAddresses[0].address).to.deep.equal(address);
            expect(result.signature.r).to.deep.equal(
                Buffer.from(
                    "51e4f6446e410a164a6da9f39507e730c26241b4456ab6ea28d1b12c71ef8ca2",
                    "hex",
                ),
            );
            expect(result.signature.s).to.deep.equal(
                Buffer.from(
                    "0c9cfe3dffc07d9f8db671ecaa4d20beedb193bda8ce37c59f85f82773a55d47",
                    "hex",
                ),
            );
            expect(result.signature.recoveryFlag).to.deep.equal(0);
            expect(result.pubkey).to.deep.equal(pubkey);
        });
    });

    describe("additional test vectors", () => {
        it("send 0.02 BTC, on simnet", () => {
            const input =
                "lnsb20m1pd3dfr9pp5s90vpp5a7sxzd4zenxxesvfge73nqslj4h7zn29059hgyp7jdvjqdqqcqzysqngw58lu63trytwj7ktx7vasdutvvan7paq5qrgjj6wg065qzr8pv8p6q7kcdeg0kdpek09gc7xf6y972gy7t3pl6gtcqww440znz6gpfec4kj";
            const result = sut.decode(input);
            expect(result.network).to.equal("sb");
            expect(result.valueSat).to.equal("2000000");
        });
        it("should decode amount with floating point issues", () => {
            const input =
                "lnbc10u1pwg6478pp5ju9dps97wqhzwtwy85579jwkhahq5je4ta52fefvpcn2p5falpuqdp4vfkx7cmtvdkx7cmt8gsxgctwd9jkctrjd93kx6tpwfjzcmeqve68wcqzysvvw8e3zy8aceft4ls8qvynveq8pmdlzuxdgt738tg0nyece8atjxj2l0qlskcwslhkwt9rlg4gnezxh85yzznk0fsdjvu443u867hvqpxxe6ax";
            const result = sut.decode(input);
            expect(result.amount).to.equal("0.00001000000");
        });
        it("should decode an invoice with a payee node", () => {
            const input =
                "lnbc1pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqnp4q0n326hr8v9zprg8gsvezcch06gfaqqhde2aj730yg0durunfhv66t9sfxuhugqeh0pjtckefuffen5pqnvajdcljyk6a3en4zym4m7krcflhf0wyryvya8dxclyg36d0z4a6zmzxfpc25uxtfk6ls55zpegqfjw4su";
            const result = sut.decode(input);
            expect(result.payeeNode.toString("hex")).to.equal(
                "03e7156ae33b0a208d0744199163177e909e80176e55d97a2f221ede0f934dd9ad",
            );
        });
        it("should decode custom min final CLTV expiry", () => {
            const input =
                "lnbc1pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdqad45ku3nfdeskcsmvw3my27rsd9e8jcqp0huernjk8n84gcyeyneleczksmtmhmpyc5uxzfuy92akwq6593gqqcy4e0cse5jcfkmhge0wyd7hrlvrvxumr5k5lggl727tjzwc83ygpnwqcaz";
            const result = sut.decode(input);
            expect(result.minFinalCltvExpiry).to.equal(15);
        });
        it("should process unknown field", () => {
            const input =
                "lnbc1pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdqvw4hxkmn0wahq7qgdpjkcmr0530rjesw23a7fgq3se6egxrtqez5mqpuveg0zsryumrrq8v2433xm25p57n54t767y8wtljmtwljatr93cnn6e8cayjg46p0uq5rp0cq0gz348";
            const result = sut.decode(input);
            const unknown = result.unknownFields[0];
            expect(unknown).to.not.be.undefined;
            expect(unknown.type).to.equal(30);
            expect(unknown.value.toString()).to.equal("hello");
        });
    });
});
