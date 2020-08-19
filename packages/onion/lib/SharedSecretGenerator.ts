import * as crypto from "@node-lightning/crypto";

/**
 * Generates blinded shared secret between each hop in an onion packet.
 */
export class SharedSecretGenerator {
    public readonly sessionPubKey: Buffer;
    public readonly sharedSecrets: Buffer[];

    /**
     * Construct a new SessionKeyChain from the supplied sessionSecret.
     * @param sessionKey 32-byte private key to use for constructing ephemeral
     * keys
     * @param hops 33-byte compressed public keys of all nodes on the hops
     */
    constructor(readonly sessionKey: Buffer, ...hops: Buffer[]) {
        this.sessionPubKey = crypto.getPublicKey(sessionKey, true);
        this.sharedSecrets = [];

        // Initialize the first ephemeral key to the session key. This value
        // be used in subsequent iterations by multiplying it by the blinding
        // factor
        let ephemeralKey = sessionKey;

        // Iterate each hop to obtain its shared secret
        for (let i = 0; i < hops.length; i++) {
            const hop = hops[i];

            // perform ECDH calculation by performing a scalar multiplying
            // the remote nodes point by the ephemeral key to obtain a new
            // shared point. Coming from libsecp256k1, the returned point is
            // compressed and passed through sha256 to arridve at a 32-byte
            // shared secret.
            const ss = crypto.ecdh(hop, ephemeralKey);
            this.sharedSecrets.push(ss);

            // obtain the ephemeral public key from the current ephemeral key
            const ephemeralPubKey = crypto.getPublicKey(ephemeralKey, true);

            // compute the blinding factor with sha256(epk || ss)
            const blindingFactor = crypto.sha256(Buffer.concat([ephemeralPubKey, ss]));

            // finally blind the ephemeral key for the next hop
            ephemeralKey = crypto.privateKeyMul(ephemeralKey, blindingFactor);
        }
    }
}
