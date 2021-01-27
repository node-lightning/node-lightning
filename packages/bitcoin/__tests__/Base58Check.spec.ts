import { expect } from "chai";
import { Base58Check } from "../lib/Base58Check";

describe("Base58Check", () => {
    describe(".encode", () => {
        const tests: Array<[Buffer, string]> = [
            [
                Buffer.from("7c076ff316692a3d7eb3c3bb0f8b1488cf72e1afcd929e29307032997a838a3d", "hex"),
                "wdA2ffYs5cudrdkhFm5Ym94AuLvavacapuDBL2CAcvqYPkcvi"
            ],
            [
                Buffer.from("eff69ef2b1bd93a66ed5219add4fb51e11a840f404876325a1e8ffe0529a2c", "hex"),
                "Qwj1mwXNifQmo5VV2s587usAy4QRUviQsBxoe4EJXyWz4GBs"
            ],
            [
                Buffer.from("c7207fee197d27c618aea621406f6bf5ef6fca38681d82b2f06fddbdce6feab6", "hex"),
                "2WhRyzK3iKFveq4hvQ3VR9uau26t6qZCMhADPAVMeMR6VraBbX"
            ]
        ]; // prettier-ignore

        for (const test of tests) {
            it(`${test[0].toString("hex")}`, () => {
                expect(Base58Check.encode(test[0])).to.equal(test[1]);
            });
        }
    });

    describe(".decode", () => {
        const tests: Array<[string, Buffer]> = [
            [
                "wdA2ffYs5cudrdkhFm5Ym94AuLvavacapuDBL2CAcvqYPkcvi",
                Buffer.from("7c076ff316692a3d7eb3c3bb0f8b1488cf72e1afcd929e29307032997a838a3d", "hex"),
            ],
            [
                "Qwj1mwXNifQmo5VV2s587usAy4QRUviQsBxoe4EJXyWz4GBs",
                Buffer.from("eff69ef2b1bd93a66ed5219add4fb51e11a840f404876325a1e8ffe0529a2c", "hex"),
            ],
            [
                "2WhRyzK3iKFveq4hvQ3VR9uau26t6qZCMhADPAVMeMR6VraBbX",
                Buffer.from("c7207fee197d27c618aea621406f6bf5ef6fca38681d82b2f06fddbdce6feab6", "hex"),
            ]
        ]; // prettier-ignore

        for (const test of tests) {
            it(`${test[0]}`, () => {
                expect(Base58Check.decode(test[0])).to.deep.equal(test[1]);
            });
        }
    });
});
