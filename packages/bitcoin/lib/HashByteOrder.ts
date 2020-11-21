export enum HashByteOrder {
    /**
     * Internal byte order is the natural byte order of elements as they
     * cedome out of hash function. Calculations are often performed
     * using the internal byte order.
     *
     * This is often referred to as little-endian byte-order due to the
     * block hash being reversed to compare it to the target.
     */
    Internal,

    /**
     * RPC byte order is the byte order of hash value as displayed in
     * the bitcoind RPC. Most hash values associated with Bitcoin are
     * displayed in this order by reversing the internal byte order.
     *
     * This is often referred to as big-endian byte-order due to the
     * block hash being reversed to compare it to the target.
     */
    RPC,
}
