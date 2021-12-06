export type EcdhOptions = {
    data?: Uint8Array;
    hashfn?: (xbuf: Uint8Array, ybuf: Uint8Array, data: Uint8Array) => Uint8Array;
    xbuf?: Uint8Array;
    ybuf?: Uint8Array;
};
