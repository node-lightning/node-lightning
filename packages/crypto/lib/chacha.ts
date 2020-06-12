import * as crypto from "crypto";

export function chachaEncrypt(key: Buffer, iv: Buffer, data: Buffer): Buffer {
    const cipher = crypto.createCipheriv("chacha20" as any, key, iv);
    return cipher.update(data);
}

export function chachaDecrypt(key: Buffer, iv: Buffer, cipher: Buffer): Buffer {
    const decipher = crypto.createDecipheriv("chacha20" as any, key, iv);
    return decipher.update(cipher);
}
