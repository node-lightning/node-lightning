export type EcdsaOptions = {
    data?: Uint8Array;
    noncefn?: () => Uint8Array;
};
