import * as crypto from "@lntools/crypto";

/**
 * Constructs a number of keys from the shared secret. Keys are generated by
 * computing an HMAC (with SHA256 as hashing algorithm) using the appropriate
 * key-type (i.e. rho, mu, um, or pad) as HMAC-key and the 32-byte shared secret
 * as the message. The resulting HMAC is then returned as the key.
 */
export class SharedSecretKeyRing {
    /**
     * Rho is used as a key when generating the pseudo-random byte stream that
     * is used to obfuscate the per-hop information.
     */
    public readonly rhoKey: Buffer;

    /**
     * Mu is used during the HMAC generation.
     */
    public readonly muKey: Buffer;

    /**
     * Um is used during error reporting
     */
    public readonly umKey: Buffer;

    /**
     * Pad is used to generate random filler bytes for the starting mix-header
     * packet.
     */
    public readonly padKey: Buffer;

    /**
     * Constructs the keys for the shared secret
     * @param ss shared secret as a 32-byte secret key
     */
    constructor(ss: Buffer) {
        const rho = Buffer.from("72686f", "hex");
        const mu = Buffer.from("6d75", "hex");
        const um = Buffer.from("756d", "hex");
        const pad = Buffer.from("706164", "hex");

        this.rhoKey = crypto.hmac(rho, ss);
        this.muKey = crypto.hmac(mu, ss);
        this.umKey = crypto.hmac(um, ss);
        this.padKey = crypto.hmac(pad, ss);
    }
}