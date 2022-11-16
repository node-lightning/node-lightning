export class Result<V, E> {
    public static err<V, E>(error: E, value?: V) {
        return new Result<V, E>(value, error);
    }

    public static ok<V, E>(value: V) {
        return new Result<V, E>(value);
    }

    constructor(readonly value?: V, readonly error?: E) {}

    public get isOk(): boolean {
        return !this.isErr && this.value !== undefined;
    }

    public get isErr(): boolean {
        return this.error !== undefined;
    }
}
