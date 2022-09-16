import * as http from "http";
import { IBitcoindOptions } from "./BitcoindOptions";
import { JsonRpcError } from "./JsonRpcError";
import { JsonRpcOptions } from "./JsonRpcOptions";

export function jsonrpcRequest<T>(
    method: string,
    params: any = [],
    id: number,
    opts: JsonRpcOptions,
): Promise<T> {
    return new Promise((resolve, reject) => {
        const { host, hostname, port, username, password } = opts;
        const body = JSON.stringify({
            id,
            jsonrpc: "1.0",
            method,
            params,
        });
        const req = http.request(
            {
                auth: `${username}:${password}`,
                headers: {
                    "content-length": body.length,
                    "content-type": "text/plain",
                },
                method: "POST",
                host,
                hostname,
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
