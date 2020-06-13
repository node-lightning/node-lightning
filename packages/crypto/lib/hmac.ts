import crypto from "crypto";

export function hmac(key: Buffer, data: Buffer, algorithm: string = "sha256") {
    const h = crypto.createHmac(algorithm, key);
    h.update(data);
    return h.digest();
}
