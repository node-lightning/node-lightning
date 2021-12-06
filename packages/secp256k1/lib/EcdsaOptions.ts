export type EcdsaOptions = {
    data?: Uint8Array;
    noncefn?: (
        msg: Uint8Array,
        privkey: Uint8Array,
        a: any,
        data: Uint8Array,
        b: any,
    ) => Uint8Array;
};
