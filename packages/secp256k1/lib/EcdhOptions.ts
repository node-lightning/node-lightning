export type EcdhOptions = {
    data?: Uint8Array;
    hashfn?: () => Uint8Array;
    xbuf?: Uint8Array;
    ybuf?: Uint8Array;
};
