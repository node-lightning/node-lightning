export enum KeyType {
    /**
     * Rho is used as a key when generating the pseudo-random byte stream that
     * is used to obfuscate the per-hop information.
     */
    rho,

    /**
     * Mu is used during the HMAC generation.
     */
    mu,
    /**
     * Um is used during error reporting
     */
    um,

    /**
     * Pad is used to generate random filler bytes for the starting mix-header
     * packet.
     */
    pad,
}
