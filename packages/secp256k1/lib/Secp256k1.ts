/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { EcdhOptions } from "./EcdhOptions";
import { EcdsaOptions } from "./EcdsaOptions";
import { EcdsaResult } from "./EcdsaResult";
import { Secp256k1Error } from "./Secp256k1Error";
import { assert, assertOutput, isCompressed, isUint8Array, toTypeString } from "./Utils";

export class Secp256k1 {
    constructor(readonly binding: any) {}

    public contextRandomize(seed: Uint8Array) {
        assert(
            seed === null || seed instanceof Uint8Array,
            "Expected seed to be an Uint8Array or null",
        );
        if (seed !== null) isUint8Array("seed", seed, 32);

        switch (this.binding.contextRandomize(seed)) {
            case 1:
                throw new Error(Secp256k1Error.CONTEXT_RANDOMIZE_UNKNOW);
        }
    }

    public privateKeyVerify(seckey: Uint8Array): boolean {
        if (!(seckey instanceof Uint8Array)) {
            return false;
        }
        if (seckey.length && seckey.length !== 32) {
            return false;
        }
        return this.binding.privateKeyVerify(seckey) === 0;
    }

    public privateKeyNegate(seckey: Uint8Array): Uint8Array {
        isUint8Array("private key", seckey, 32);

        switch (this.binding.privateKeyNegate(seckey)) {
            case 0:
                return seckey;
            case 1:
                throw new Error(Secp256k1Error.IMPOSSIBLE_CASE);
        }
    }

    public privateKeyTweakAdd(seckey: Uint8Array, tweak: Uint8Array): Uint8Array {
        isUint8Array("private key", seckey, 32);
        isUint8Array("tweak", tweak, 32);
        const output = new Uint8Array(seckey);

        switch (this.binding.privateKeyTweakAdd(output, tweak)) {
            case 0:
                return output;
            case 1:
                throw new Error(Secp256k1Error.TWEAK_ADD);
        }
    }

    public privateKeyTweakMul(seckey: Uint8Array, tweak: Uint8Array): Uint8Array {
        isUint8Array("private key", seckey, 32);
        isUint8Array("tweak", tweak, 32);
        const output = new Uint8Array(seckey);

        switch (this.binding.privateKeyTweakMul(output, tweak)) {
            case 0:
                return output;
            case 1:
                throw new Error(Secp256k1Error.TWEAK_MUL);
        }
    }

    public publicKeyVerify(pubkey: Uint8Array) {
        if (!(pubkey instanceof Uint8Array)) {
            return false;
        }
        if (pubkey.length && pubkey.length !== 33 && pubkey.length !== 65) {
            return false;
        }
        return this.binding.publicKeyVerify(pubkey) === 0;
    }

    public publicKeyCreate(
        seckey: Uint8Array,
        compressed: boolean = true,
        output?: Uint8Array,
    ): Uint8Array {
        isUint8Array("private key", seckey, 32);
        isCompressed(compressed);
        output = assertOutput(output, compressed ? 33 : 65);

        switch (this.binding.publicKeyCreate(output, seckey)) {
            case 0:
                return output;
            case 1:
                throw new Error(Secp256k1Error.SECKEY_INVALID);
            case 2:
                throw new Error(Secp256k1Error.PUBKEY_SERIALIZE);
        }
    }

    public publicKeyConvert(
        pubkey: Uint8Array,
        compressed: boolean = true,
        output?: Uint8Array,
    ): Uint8Array {
        isUint8Array("public key", pubkey, [33, 65]);
        isCompressed(compressed);
        output = assertOutput(output, compressed ? 33 : 65);

        switch (this.binding.publicKeyConvert(output, pubkey)) {
            case 0:
                return output;
            case 1:
                throw new Error(Secp256k1Error.PUBKEY_PARSE);
            case 2:
                throw new Error(Secp256k1Error.PUBKEY_SERIALIZE);
        }
    }

    public publicKeyNegate(
        pubkey: Uint8Array,
        compressed: boolean = true,
        output?: Uint8Array,
    ): Uint8Array {
        isUint8Array("public key", pubkey, [33, 65]);
        isCompressed(compressed);
        output = assertOutput(output, compressed ? 33 : 65);

        switch (this.binding.publicKeyNegate(output, pubkey)) {
            case 0:
                return output;
            case 1:
                throw new Error(Secp256k1Error.PUBKEY_PARSE);
            case 2:
                throw new Error(Secp256k1Error.IMPOSSIBLE_CASE);
            case 3:
                throw new Error(Secp256k1Error.PUBKEY_SERIALIZE);
        }
    }

    public publicKeyCombine(
        pubkeys: Uint8Array[],
        compressed: boolean = true,
        output?: Uint8Array,
    ): Uint8Array {
        assert(Array.isArray(pubkeys), "Expected public keys to be an Array");
        assert(pubkeys.length > 0, "Expected public keys array will have more than zero items");
        for (const pubkey of pubkeys) {
            isUint8Array("public key", pubkey, [33, 65]);
        }
        isCompressed(compressed);
        output = assertOutput(output, compressed ? 33 : 65);

        switch (this.binding.publicKeyCombine(output, pubkeys)) {
            case 0:
                return output;
            case 1:
                throw new Error(Secp256k1Error.PUBKEY_PARSE);
            case 2:
                throw new Error(Secp256k1Error.PUBKEY_COMBINE);
            case 3:
                throw new Error(Secp256k1Error.PUBKEY_SERIALIZE);
        }
    }

    public publicKeyTweakAdd(
        pubkey: Uint8Array,
        tweak: Uint8Array,
        compressed: boolean = true,
        output?: Uint8Array,
    ): Uint8Array {
        isUint8Array("public key", pubkey, [33, 65]);
        isUint8Array("tweak", tweak, 32);
        isCompressed(compressed);
        output = assertOutput(output, compressed ? 33 : 65);

        switch (this.binding.publicKeyTweakAdd(output, pubkey, tweak)) {
            case 0:
                return output;
            case 1:
                throw new Error(Secp256k1Error.PUBKEY_PARSE);
            case 2:
                throw new Error(Secp256k1Error.TWEAK_ADD);
        }
    }

    public publicKeyTweakMul(
        pubkey: Uint8Array,
        tweak: Uint8Array,
        compressed: boolean = true,
        output?: Uint8Array,
    ): Uint8Array {
        isUint8Array("public key", pubkey, [33, 65]);
        isUint8Array("tweak", tweak, 32);
        isCompressed(compressed);
        output = assertOutput(output, compressed ? 33 : 65);

        switch (this.binding.publicKeyTweakMul(output, pubkey, tweak)) {
            case 0:
                return output;
            case 1:
                throw new Error(Secp256k1Error.PUBKEY_PARSE);
            case 2:
                throw new Error(Secp256k1Error.TWEAK_MUL);
        }
    }

    public signatureNormalize(sig: Uint8Array): Uint8Array {
        isUint8Array("signature", sig, 64);

        switch (this.binding.signatureNormalize(sig)) {
            case 0:
                return sig;
            case 1:
                throw new Error(Secp256k1Error.SIG_PARSE);
        }
    }

    public signatureExport(sig: Uint8Array, output?: Uint8Array): Uint8Array {
        isUint8Array("signature", sig, 64);
        output = assertOutput(output, 72);

        const obj = { output, outputlen: 72 };
        switch (this.binding.signatureExport(obj, sig)) {
            case 0:
                return output.slice(0, obj.outputlen);
            case 1:
                throw new Error(Secp256k1Error.SIG_PARSE);
            case 2:
                throw new Error(Secp256k1Error.IMPOSSIBLE_CASE);
        }
    }

    public signatureImport(sig: Uint8Array, output?: Uint8Array): Uint8Array {
        isUint8Array("signature", sig);
        output = assertOutput(output, 64);

        switch (this.binding.signatureImport(output, sig)) {
            case 0:
                return output;
            case 1:
                throw new Error(Secp256k1Error.SIG_PARSE);
            case 2:
                throw new Error(Secp256k1Error.IMPOSSIBLE_CASE);
        }
    }

    public ecdsaSign(
        msg32: Uint8Array,
        seckey: Uint8Array,
        options: EcdsaOptions = {},
        output?: Uint8Array,
    ): EcdsaResult {
        isUint8Array("message", msg32, 32);
        isUint8Array("private key", seckey, 32);
        assert(toTypeString(options) === "Object", "Expected options to be an Object");
        if (options.data !== undefined) isUint8Array("options.data", options.data);
        if (options.noncefn !== undefined)
            assert(
                toTypeString(options.noncefn) === "Function",
                "Expected options.noncefn to be a Function",
            );
        output = assertOutput(output, 64);

        const obj = { signature: output, recid: null };
        switch (this.binding.ecdsaSign(obj, msg32, seckey, options.data, options.noncefn)) {
            case 0:
                return obj;
            case 1:
                throw new Error(Secp256k1Error.SIGN);
            case 2:
                throw new Error(Secp256k1Error.IMPOSSIBLE_CASE);
        }
    }

    public ecdsaVerify(sig: Uint8Array, msg32: Uint8Array, pubkey: Uint8Array) {
        isUint8Array("signature", sig, 64);
        isUint8Array("message", msg32, 32);
        isUint8Array("public key", pubkey, [33, 65]);

        switch (this.binding.ecdsaVerify(sig, msg32, pubkey)) {
            case 0:
                return true;
            case 3:
                return false;
            case 1:
                throw new Error(Secp256k1Error.SIG_PARSE);
            case 2:
                throw new Error(Secp256k1Error.PUBKEY_PARSE);
        }
    }

    public ecdsaRecover(
        sig: Uint8Array,
        recid: number,
        msg32: Uint8Array,
        compressed: boolean = true,
        output?: Uint8Array,
    ): Uint8Array {
        isUint8Array("signature", sig, 64);
        assert(
            toTypeString(recid) === "Number" && recid >= 0 && recid <= 3,
            "Expected recovery id to be a Number within interval [0, 3]",
        );
        isUint8Array("message", msg32, 32);
        isCompressed(compressed);
        output = assertOutput(output, compressed ? 33 : 65);

        switch (this.binding.ecdsaRecover(output, sig, recid, msg32)) {
            case 0:
                return output;
            case 1:
                throw new Error(Secp256k1Error.SIG_PARSE);
            case 2:
                throw new Error(Secp256k1Error.RECOVER);
            case 3:
                throw new Error(Secp256k1Error.IMPOSSIBLE_CASE);
        }
    }

    public ecdh(
        pubkey: Uint8Array,
        seckey: Uint8Array,
        options: EcdhOptions = {},
        output?: Uint8Array,
    ): Uint8Array {
        isUint8Array("public key", pubkey, [33, 65]);
        isUint8Array("private key", seckey, 32);
        assert(toTypeString(options) === "Object", "Expected options to be an Object");
        if (options.data !== undefined) isUint8Array("options.data", options.data);
        if (options.hashfn !== undefined) {
            assert(
                toTypeString(options.hashfn) === "Function",
                "Expected options.hashfn to be a Function",
            );
            if (options.xbuf !== undefined) isUint8Array("options.xbuf", options.xbuf, 32);
            if (options.ybuf !== undefined) isUint8Array("options.ybuf", options.ybuf, 32);
        }
        output = assertOutput(output, 32);

        switch (
            this.binding.ecdh(
                output,
                pubkey,
                seckey,
                options.data,
                options.hashfn,
                options.xbuf,
                options.ybuf,
            )
        ) {
            case 0:
                return output as Uint8Array;
            case 1:
                throw new Error(Secp256k1Error.PUBKEY_PARSE);
            case 2:
                throw new Error(Secp256k1Error.ECDH);
        }
    }
}
