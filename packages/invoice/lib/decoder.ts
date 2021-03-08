/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { BufferReader } from "@node-lightning/bufio";
import bech32 from "bech32";
import { ADDRESS_VERSION } from "./address-version";
import * as crypto from "./crypto";
import { FIELD_TYPE } from "./field-type";
import { hrpToPico } from "./hrp-pico";
import { Invoice } from "./invoice";
import { WordCursor } from "./word-cursor";

/**
 * Decodes an invoice into an Invoice object
 * @param invoice
 * @return
 */
export function decode(invoice: string): Invoice {
    // Decode the invoice into prefix and words.
    // The words will be interated over to decode the rest of thee invoice
    const { prefix, words } = bech32.decode(invoice, Number.MAX_SAFE_INTEGER);

    // Parse the prefix into the network and the value in pico bitcoin.
    const { network, picoBtc } = parsePrefix(prefix);

    // Construct a word cursor to read from the remaining data
    const wordcursor = new WordCursor(words);

    const timestamp = wordcursor.readUIntBE(7); // read 7 words / 35 bits

    const fields = [];
    const unknownFields = [];

    // read fields until at signature
    while (wordcursor.wordsRemaining > 104) {
        const type = wordcursor.readUIntBE(1); // read 1 word / 5 bits
        const len = wordcursor.readUIntBE(2); // read 2 words / 10 bits

        let value;

        switch (type) {
            case 0:
                continue; // read off padding
            case FIELD_TYPE.PAYMENT_HASH: // p - 256-bit sha256 payment_hash
                value = wordcursor.readBytes(len);
                // push non-standard length field into unknown fields
                if (len !== 52) {
                    unknownFields.push({ type, value });
                    continue;
                }
                break;
            case FIELD_TYPE.ROUTE: // r - variable, one or more entries containing extra routing info
                {
                    value = [];
                    const bytes = wordcursor.readBytes(len);
                    const bytecursor = new BufferReader(bytes);
                    while (!bytecursor.eof) {
                        value.push({
                            pubkey: bytecursor.readBytes(33),
                            short_channel_id: bytecursor.readBytes(8),
                            fee_base_msat: bytecursor.readUInt32BE(),
                            fee_proportional_millionths: bytecursor.readUInt32BE(),
                            cltv_expiry_delta: bytecursor.readUInt16BE(),
                        });
                    }
                }
                break;
            case FIELD_TYPE.EXPIRY: // x - expiry time in seconds
                value = wordcursor.readUIntBE(len);
                break;
            case FIELD_TYPE.FALLBACK_ADDRESS: // f - variable depending on version
                {
                    const version = wordcursor.readUIntBE(1);
                    const address = wordcursor.readBytes(len - 1);
                    value = {
                        version,
                        address,
                    };
                    if (
                        version !== ADDRESS_VERSION.SEGWIT &&
                        version !== ADDRESS_VERSION.P2PKH &&
                        version !== ADDRESS_VERSION.P2SH
                    ) {
                        unknownFields.push({ type, value });
                        continue;
                    }
                }
                break;
            case FIELD_TYPE.SHORT_DESC: // d - short description of purpose of payment utf-8
                value = wordcursor.readBytes(len).toString("utf8");
                break;
            case FIELD_TYPE.PAYEE_NODE: // n - 33-byte public key of the payee node
                value = wordcursor.readBytes(len);
                if (len !== 53) {
                    unknownFields.push({ type, value });
                    continue;
                }
                break;
            case FIELD_TYPE.HASH_DESC: // h - 256-bit sha256 description of purpose of payment
                value = wordcursor.readBytes(len);
                if (len !== 52) {
                    unknownFields.push({ type, value });
                    continue;
                }
                break;
            case FIELD_TYPE.MIN_FINAL_CLTV_EXPIRY: // c - min_final_cltv_expiry to use for the last HTLC in the route
                value = wordcursor.readUIntBE(len);
                break;
            default:
                value = wordcursor.readBytes(len);
                unknownFields.push({ type, value });
                continue;
        }

        fields.push({ type, value });
    }

    const sigBytes = wordcursor.readBytes(103); // read 512-bit sig
    const r = sigBytes.slice(0, 32);
    const s = sigBytes.slice(32);
    const recoveryFlag = wordcursor.readUIntBE(1);

    wordcursor.position = 0;
    let preHashData = wordcursor.readBytes(words.length - 104, true);
    preHashData = Buffer.concat([Buffer.from(prefix), preHashData]);
    const hashData = crypto.sha256(preHashData);

    // extract the pubkey for verifying the signature by either:
    // 1: using the payee field value (n)
    // 2: performing signature recovery
    const payeeNodeField = fields.find(p => p.type === FIELD_TYPE.PAYEE_NODE);
    const pubkey = payeeNodeField
        ? payeeNodeField.value // use payee node provided
        : crypto.ecdsaRecovery(hashData, sigBytes, recoveryFlag); // recovery pubkey from ecdsa sig

    // validate signature
    // note if we performed signature recovery this will always match
    // so we may want to just skip this if we had signature recovery
    if (!crypto.ecdsaVerify(pubkey, hashData, sigBytes)) throw new Error("Signature invalid");

    // constuct the invoice
    const result = new Invoice();
    result._value = picoBtc; // directly assign pico value since there is not setter
    result.network = network;
    result.timestamp = timestamp;
    result.fields = fields;
    result.unknownFields = unknownFields;
    result.signature = { r, s, recoveryFlag };
    result.pubkey = pubkey;
    result.hashData = hashData;
    result.usedSigRecovery = !!payeeNodeField;
    return result;
}

//////////////

/**
 * Parses the prefix into network and value and then performs
 * validations on the values.
 *
 * This code is rough. Should refactor into two steps:
 * 1) tokenize
 * 2) parse tokens
 *
 * Value is returned as pico bitcoin.
 */
function parsePrefix(prefix: string): { network: string; picoBtc: bigint } {
    if (!prefix.startsWith("ln")) throw new Error("Invalid prefix");
    let network = "";
    let tempValue = "";
    let value;
    let multiplier;
    let hasNetwork = false;
    let hasAmount = false;

    for (let i = 2; i < prefix.length; i++) {
        const charCode = prefix.charCodeAt(i);

        if (!hasNetwork) {
            if (charCode >= 97 && charCode <= 122) network += prefix[i];
            else hasNetwork = true;
        }

        if (hasNetwork && !hasAmount) {
            if (charCode >= 48 && charCode <= 57) tempValue += prefix[i];
            else if (tempValue) hasAmount = true;
            else throw new Error("Invalid amount");
        }

        if (hasAmount) {
            if (charCode >= 97 && charCode <= 122) multiplier = prefix[i];
            else throw new Error("Invalid character");
        }
    }

    // returns null if we do not have a value
    if (tempValue === "") value = null;
    // otherwise we multiply by the value by the pico amount to obtain
    // the actual pico value of the
    else value = BigInt(tempValue) * hrpToPico(multiplier);

    if (!isValidNetwork(network)) throw new Error("Invalid network");
    if (!isValidValue(value)) throw new Error("Invalid amount");

    return {
        network,
        picoBtc: value,
    };
}

function isValidNetwork(network) {
    return network === "bc" || network === "tb" || network === "bcrt" || network === "sb";
}

function isValidValue(value) {
    return value === null || value > 0;
}
