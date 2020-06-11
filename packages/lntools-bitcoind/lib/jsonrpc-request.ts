import * as http from "http";
import { IBitcoindOptions } from "./bitcoind-options";
import { JsonRpcError } from "./jsonrpc-error";

export function jsonrpcRequest<T>(
    method: string,
    params: any = [],
    id: number,
    opts: IBitcoindOptions,
): Promise<T> {
    return new Promise((resolve, reject) => {
        const { host, port, rpcuser: rpcUser, rpcpassword: rpcPassword } = opts;
        const body = JSON.stringify({
            id,
            jsonrpc: "1.0",
            method,
            params,
        });
        const req = http.request(
            {
                auth: `${rpcUser}:${rpcPassword}`,
                headers: {
                    "content-length": body.length,
                    "content-type": "text/plain",
                },
                host,
                method: "POST",
                port,
            },
            res => {
                const buffers = [];
                res.on("error", reject);
                res.on("data", buf => buffers.push(buf));
                res.on("end", () => {
                    const isJson = res.headers["content-type"] === "application/json";
                    const raw = Buffer.concat(buffers).toString();
                    const result = isJson ? JSON.parse(raw) : raw;
                    if (res.statusCode === 200) {
                        resolve(result.result);
                    } else {
                        reject(new JsonRpcError(res.statusCode, result));
                    }
                });
            },
        );
        req.on("error", reject);
        req.end(body);
    });
}
