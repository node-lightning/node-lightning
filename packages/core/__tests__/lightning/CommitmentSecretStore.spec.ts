import { expect } from "chai";
import { CommitmentSecretStore } from "../../lib/lightning/CommitmentSecretStore";

describe("CommitmentSecretStore", () => {
    describe("#calcIndex()", () => {
        const tests: Array<[bigint, number]> = [
            [BigInt(0b0000), 48], // 0
            [BigInt(0b0001), 0], // 1
            [BigInt(0b0010), 1], // 2
            [BigInt(0b0011), 0], // 3
            [BigInt(0b0100), 2], // 4
            [BigInt(0b0101), 0], // 5
            [BigInt(0b0110), 1], // 6
            [BigInt(0b0111), 0], // 7
            [BigInt(0b1000), 3], // 8
            [BigInt(0b1001), 0], // 9
            [BigInt(0b1010), 1], // 10
            [BigInt(0b1011), 0], // 11
            [BigInt(0b1100), 2], // 12
            [BigInt(0b1101), 0], // 13
            [BigInt(0b1110), 1], // 14
            [BigInt(0b1111), 0], // 15
        ];

        for (const [input, output] of tests) {
            it(`${input} => ${output}`, () => {
                expect(CommitmentSecretStore.calcIndex(input)).to.equal(output);
            });
        }
    });

    describe("BOLT3 Test Vectors", () => {
        const vectors = [
            `name: insert_secret correct sequence
I: 281474976710655
secret: 0x7cc854b54e3e0dcdb010d7a3fee464a9687be6e8db3be6854c475621e007a5dc
output: OK
I: 281474976710654
secret: 0xc7518c8ae4660ed02894df8976fa1a3659c1a8b4b5bec0c4b872abeba4cb8964
output: OK
I: 281474976710653
secret: 0x2273e227a5b7449b6e70f1fb4652864038b1cbf9cd7c043a7d6456b7fc275ad8
output: OK
I: 281474976710652
secret: 0x27cddaa5624534cb6cb9d7da077cf2b22ab21e9b506fd4998a51d54502e99116
output: OK
I: 281474976710651
secret: 0xc65716add7aa98ba7acb236352d665cab17345fe45b55fb879ff80e6bd0c41dd
output: OK
I: 281474976710650
secret: 0x969660042a28f32d9be17344e09374b379962d03db1574df5a8a5a47e19ce3f2
output: OK
I: 281474976710649
secret: 0xa5a64476122ca0925fb344bdc1854c1c0a59fc614298e50a33e331980a220f32
output: OK
I: 281474976710648
secret: 0x05cde6323d949933f7f7b78776bcc1ea6d9b31447732e3802e1f7ac44b650e17
output: OK`,
            `name: insert_secret #1 incorrect
I: 281474976710655
secret: 0x02a40c85b6f28da08dfdbe0926c53fab2de6d28c10301f8f7c4073d5e42e3148
output: OK
I: 281474976710654
secret: 0xc7518c8ae4660ed02894df8976fa1a3659c1a8b4b5bec0c4b872abeba4cb8964
output: ERROR`,
            `name: insert_secret #2 incorrect (#1 derived from incorrect)
I: 281474976710655
secret: 0x02a40c85b6f28da08dfdbe0926c53fab2de6d28c10301f8f7c4073d5e42e3148
output: OK
I: 281474976710654
secret: 0xdddc3a8d14fddf2b68fa8c7fbad2748274937479dd0f8930d5ebb4ab6bd866a3
output: OK
I: 281474976710653
secret: 0x2273e227a5b7449b6e70f1fb4652864038b1cbf9cd7c043a7d6456b7fc275ad8
output: OK
I: 281474976710652
secret: 0x27cddaa5624534cb6cb9d7da077cf2b22ab21e9b506fd4998a51d54502e99116
output: ERROR`,
            `name: insert_secret #3 incorrect
I: 281474976710655
secret: 0x7cc854b54e3e0dcdb010d7a3fee464a9687be6e8db3be6854c475621e007a5dc
output: OK
I: 281474976710654
secret: 0xc7518c8ae4660ed02894df8976fa1a3659c1a8b4b5bec0c4b872abeba4cb8964
output: OK
I: 281474976710653
secret: 0xc51a18b13e8527e579ec56365482c62f180b7d5760b46e9477dae59e87ed423a
output: OK
I: 281474976710652
secret: 0x27cddaa5624534cb6cb9d7da077cf2b22ab21e9b506fd4998a51d54502e99116
output: ERROR`,
            `name: insert_secret #4 incorrect (1,2,3 derived from incorrect)
I: 281474976710655
secret: 0x02a40c85b6f28da08dfdbe0926c53fab2de6d28c10301f8f7c4073d5e42e3148
output: OK
I: 281474976710654
secret: 0xdddc3a8d14fddf2b68fa8c7fbad2748274937479dd0f8930d5ebb4ab6bd866a3
output: OK
I: 281474976710653
secret: 0xc51a18b13e8527e579ec56365482c62f180b7d5760b46e9477dae59e87ed423a
output: OK
I: 281474976710652
secret: 0xba65d7b0ef55a3ba300d4e87af29868f394f8f138d78a7011669c79b37b936f4
output: OK
I: 281474976710651
secret: 0xc65716add7aa98ba7acb236352d665cab17345fe45b55fb879ff80e6bd0c41dd
output: OK
I: 281474976710650
secret: 0x969660042a28f32d9be17344e09374b379962d03db1574df5a8a5a47e19ce3f2
output: OK
I: 281474976710649
secret: 0xa5a64476122ca0925fb344bdc1854c1c0a59fc614298e50a33e331980a220f32
output: OK
I: 281474976710648
secret: 0x05cde6323d949933f7f7b78776bcc1ea6d9b31447732e3802e1f7ac44b650e17
output: ERROR`,
            `name: insert_secret #5 incorrect
I: 281474976710655
secret: 0x7cc854b54e3e0dcdb010d7a3fee464a9687be6e8db3be6854c475621e007a5dc
output: OK
I: 281474976710654
secret: 0xc7518c8ae4660ed02894df8976fa1a3659c1a8b4b5bec0c4b872abeba4cb8964
output: OK
I: 281474976710653
secret: 0x2273e227a5b7449b6e70f1fb4652864038b1cbf9cd7c043a7d6456b7fc275ad8
output: OK
I: 281474976710652
secret: 0x27cddaa5624534cb6cb9d7da077cf2b22ab21e9b506fd4998a51d54502e99116
output: OK
I: 281474976710651
secret: 0x631373ad5f9ef654bb3dade742d09504c567edd24320d2fcd68e3cc47e2ff6a6
output: OK
I: 281474976710650
secret: 0x969660042a28f32d9be17344e09374b379962d03db1574df5a8a5a47e19ce3f2
output: ERROR`,
            `name: insert_secret #6 incorrect (5 derived from incorrect)
I: 281474976710655
secret: 0x7cc854b54e3e0dcdb010d7a3fee464a9687be6e8db3be6854c475621e007a5dc
output: OK
I: 281474976710654
secret: 0xc7518c8ae4660ed02894df8976fa1a3659c1a8b4b5bec0c4b872abeba4cb8964
output: OK
I: 281474976710653
secret: 0x2273e227a5b7449b6e70f1fb4652864038b1cbf9cd7c043a7d6456b7fc275ad8
output: OK
I: 281474976710652
secret: 0x27cddaa5624534cb6cb9d7da077cf2b22ab21e9b506fd4998a51d54502e99116
output: OK
I: 281474976710651
secret: 0x631373ad5f9ef654bb3dade742d09504c567edd24320d2fcd68e3cc47e2ff6a6
output: OK
I: 281474976710650
secret: 0xb7e76a83668bde38b373970155c868a653304308f9896692f904a23731224bb1
output: OK
I: 281474976710649
secret: 0xa5a64476122ca0925fb344bdc1854c1c0a59fc614298e50a33e331980a220f32
output: OK
I: 281474976710648
secret: 0x05cde6323d949933f7f7b78776bcc1ea6d9b31447732e3802e1f7ac44b650e17
output: ERROR`,
            `name: insert_secret #7 incorrect
I: 281474976710655
secret: 0x7cc854b54e3e0dcdb010d7a3fee464a9687be6e8db3be6854c475621e007a5dc
output: OK
I: 281474976710654
secret: 0xc7518c8ae4660ed02894df8976fa1a3659c1a8b4b5bec0c4b872abeba4cb8964
output: OK
I: 281474976710653
secret: 0x2273e227a5b7449b6e70f1fb4652864038b1cbf9cd7c043a7d6456b7fc275ad8
output: OK
I: 281474976710652
secret: 0x27cddaa5624534cb6cb9d7da077cf2b22ab21e9b506fd4998a51d54502e99116
output: OK
I: 281474976710651
secret: 0xc65716add7aa98ba7acb236352d665cab17345fe45b55fb879ff80e6bd0c41dd
output: OK
I: 281474976710650
secret: 0x969660042a28f32d9be17344e09374b379962d03db1574df5a8a5a47e19ce3f2
output: OK
I: 281474976710649
secret: 0xe7971de736e01da8ed58b94c2fc216cb1dca9e326f3a96e7194fe8ea8af6c0a3
output: OK
I: 281474976710648
secret: 0x05cde6323d949933f7f7b78776bcc1ea6d9b31447732e3802e1f7ac44b650e17
output: ERROR`,
            `name: insert_secret #8 incorrect
I: 281474976710655
secret: 0x7cc854b54e3e0dcdb010d7a3fee464a9687be6e8db3be6854c475621e007a5dc
output: OK
I: 281474976710654
secret: 0xc7518c8ae4660ed02894df8976fa1a3659c1a8b4b5bec0c4b872abeba4cb8964
output: OK
I: 281474976710653
secret: 0x2273e227a5b7449b6e70f1fb4652864038b1cbf9cd7c043a7d6456b7fc275ad8
output: OK
I: 281474976710652
secret: 0x27cddaa5624534cb6cb9d7da077cf2b22ab21e9b506fd4998a51d54502e99116
output: OK
I: 281474976710651
secret: 0xc65716add7aa98ba7acb236352d665cab17345fe45b55fb879ff80e6bd0c41dd
output: OK
I: 281474976710650
secret: 0x969660042a28f32d9be17344e09374b379962d03db1574df5a8a5a47e19ce3f2
output: OK
I: 281474976710649
secret: 0xa5a64476122ca0925fb344bdc1854c1c0a59fc614298e50a33e331980a220f32
output: OK
I: 281474976710648
secret: 0xa7efbc61aac46d34f77778bac22c8a20c6a46ca460addc49009bda875ec88fa4
output: ERROR`,
        ];

        for (const vector of vectors) {
            const parts = vector.split("\n");
            const name = parts.shift();
            const tests = [];
            while (parts.length) {
                const i = BigInt(parts.shift().split(": ")[1]);
                const secret = Buffer.from(parts.shift().split(": ")[1].substring(2), "hex"); // prettier-ignore
                const ok = parts.shift().split(": ")[1] === "OK";
                tests.push({ i, secret, ok });
            }

            it(name, () => {
                const sut = new CommitmentSecretStore();

                // insert values
                for (let insert = 0; insert < tests.length; insert++) {
                    {
                        const { ok, i, secret } = tests[insert];
                        if (ok) {
                            sut.insert(secret, i);
                        } else {
                            expect(() => sut.insert(secret, i)).to.throw(
                                "The secret for I is incorrect",
                            );
                        }
                    }

                    // for each insertion validate all prior insertions
                    for (let derive = insert; derive >= 0; derive--) {
                        const { ok, i, secret } = tests[derive];
                        if (ok) {
                            expect(sut.derive(i)).to.deep.equal(secret);
                        } else {
                            expect(() => sut.derive(i)).to.throw(
                                "Index I hasn't been received yet",
                            );
                        }
                    }
                }
            });
        }
    });
});
