export class JsonRpcError extends Error {
    public statusCode: number;
    public body: string;

    constructor(statusCode: number, body: string) {
        super("Request failed");
        this.statusCode = statusCode;
        this.body = body;
    }
}
