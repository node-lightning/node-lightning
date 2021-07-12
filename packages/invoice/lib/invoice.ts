/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */

import bech32 from "bech32";
import bs58check from "bs58check";
import { ADDRESS_VERSION } from "./address-version";
import { EXPIRY_DEFAULT, MIN_FINAL_CLTV_EXPIRY_DEFAULT } from "./constants";
import * as crypto from "./crypto";
import { FallbackAddress } from "./fallback-address";
import { FIELD_TYPE } from "./field-type";
import { Route } from "./route";
import { Signature } from "./signature";

const picoToMsat = BigInt(10);
const picoToSat = picoToMsat * BigInt(1000);
const picoToBtc = BigInt(1e12);
const MAX_SHORT_DESC_BYTES = 639;

/**
 * Invoice is the state container used for invoice data. It is used
 * when building an invoice or contains the results from decoded
 * invoices. The Invoice type does not perform validation on
 * data it contains but does contain helper methods to help
 * construct proper invoices.
 */
export class Invoice {
    public network: string;
    public timestamp: number = 0;
    public fields: any[] = [];
    public unknownFields: any[] = [];

    /**
     * ECDSA signature used to sign the invoice.
     */
    public signature: Signature;

    /**
     * Compressed public key on elliptic curve secp256k1 corresponding
     * to the node that generated and signed the invoice. Returned
     * as 33-bytes.
     */
    public pubkey: Buffer;

    /**
     * Buffer containing the buffer of the data used to generate the
     * hash used in the signature.
     */
    public hashData: Buffer;

    /**
     * Inidicates if signature recovery was used when decoding and
     * performing signature verification for an invoice. This value
     * will be false if a payee node field was provided.
     */
    public usedSigRecovery: boolean;

    /**
     * Invoice value stored in pico bitcoin
     */
    public _value: bigint;

    /**
     * Returns true when the invoice has a value
     * associated with it. Invoices may optionally contain a value.
     * When there is no value, the invoice is for the receipt of
     * any value.
     */
    public get hasValue(): boolean {
        return typeof this._value === "bigint";
    }

    /**
     * Warning: there is the possibility of precision loss!
     *
     * Gets the value in bitcoin as a string by converting from pico btc
     * into bitcoin. Returns null if the invoice has no amount.
     *
     * Sets the value from a number or string that represeents a bitcoin
     * value, such as 0.0001 to represent 10000 satoshi. Setting a falsy
     * value will remove the value from the invoice.
     *
     * @deprecated This property is maintained for backwards compaibility.
     * Use property `valueSat` or `valueMsat` instead.
     */
    public get amount(): string {
        return this.hasValue ? (Number(this._value) / Number(picoToBtc)).toFixed(11) : null;
    }

    public set amount(val) {
        if (!val) this._value = null;
        else this._value = BigInt(Math.trunc(parseFloat(val) * Number(picoToBtc)));
    }

    /**
     * Warning: Msat fractions are truncated!
     *
     * Gets the value in satoshi as a string by converting from pico btc
     * into satoshi. Returns null if the invoice has no amount.
     *
     * Sets the value in satoshi from a string or number, such as 10000 satoshi.
     * Setting a falsy value will remove the value from the invoice.
     */
    public get valueSat() {
        return this.hasValue ? (this._value / picoToSat).toString() : null;
    }

    public set valueSat(val) {
        if (!val) this._value = null;
        else this._value = BigInt(val) * picoToSat;
    }

    /**
     * Gets the value in milli-sataoshi as a string or returns null
     * if the invoice has no amount.
     *
     * Sets the value in millisatoshi from a string or number. Setting a falsy
     * value will remove the value from the invoice.
     */
    public get valueMsat(): string {
        return this.hasValue ? (this._value / picoToMsat).toString() : null;
    }

    public set valueMsat(val) {
        if (!val || Number(val) === 0) this._value = null;
        else this._value = BigInt(val) * picoToMsat;
    }

    /**
     * Get the expiry time for the invoice as a big endian number
     * of seconds. The defualt is one hour (3600).
     *
     * Sets the expiry time in seconds for the invoice.  Only a single
     * expiry field is valid in the invoice.
     */
    public get expiry(): number {
        return this._getFieldValue(FIELD_TYPE.EXPIRY, EXPIRY_DEFAULT);
    }

    public set expiry(value) {
        this._setFieldValue(FIELD_TYPE.EXPIRY, value);
    }

    /**
     * Gets the 256-bit payment hash. The preimage of this value
     * will provide proof of payment.
     *
     * Sets the 256-bit payment hash for the invoice from a Buffer
     * or hex-encoded string. Only a single field of this type is
     * valid in the invoice.
     */
    public get paymentHash(): Buffer {
        return this._getFieldValue(FIELD_TYPE.PAYMENT_HASH);
    }

    public set paymentHash(value) {
        if (typeof value === "string") value = Buffer.from(value, "hex");
        this._setFieldValue(FIELD_TYPE.PAYMENT_HASH, value);
    }

    /**
     * Gets the description as either a shortDesc or hashDesc
     * value. If it is the former it is returned as a string.
     * hashDesc is returned as a buffer of the hash.
     *
     * Sets the description for the invoice. An invoice must use hash
     * description for messages longer than 639 bytes. If the string is
     * longer than 639 bytes, the description will be hashed and stored
     * in hashDesc. Otherwise, the raw string will be stored in the
     * short desc.
     */
    public get desc(): string | Buffer {
        return this.shortDesc || this.hashDesc;
    }

    public set desc(desc) {
        const len = Buffer.byteLength(desc);
        if (len > MAX_SHORT_DESC_BYTES) this.hashDesc = crypto.sha256(desc as Buffer);
        else this.shortDesc = desc as string;
    }

    /**
     * Gets the short description text. Returns null when the invoice
     * does not contain a short description. An invoice must set
     * either a short description or a hash description.
     *
     * Sets the short description text. Maximum valid length is 639
     * bytes. Only a single short desc or hash desc field is allowed.
     * Setting this field will remove the hashDesc field value.
     */
    public get shortDesc(): string {
        return this._getFieldValue(FIELD_TYPE.SHORT_DESC);
    }

    public set shortDesc(value) {
        this._removeFieldByType(FIELD_TYPE.HASH_DESC);
        this._setFieldValue(FIELD_TYPE.SHORT_DESC, value);
    }

    /**
     * Gets the 256-bit hash of the description. Returns
     * null when an invoice does not contain a hash description.
     * An invoice must contain either a shortDesc or hashDesc.
     *
     * Sets the hash description to the hex-encoded string or
     * Buffer containing the the hashed description.
     * This must be used for descriptions that are over 639 bytes
     * long. Setting this field will remove any short desc fields.
     */
    public get hashDesc(): Buffer {
        return this._getFieldValue(FIELD_TYPE.HASH_DESC);
    }

    public set hashDesc(value) {
        if (typeof value === "string") value = Buffer.from(value, "hex");
        this._removeFieldByType(FIELD_TYPE.SHORT_DESC);
        this._setFieldValue(FIELD_TYPE.HASH_DESC, value);
    }

    /**
     * Gets the 33-byte public key of the payee node. This is
     * used to explicitly describe the payee node instead of
     * relying on pub key recovery from the signature.
     *
     * Sets the 33-byte public key of the payee node. This is
     * used to set the public key explicitly instead of relying
     * on signature recovery. This field must match the pubkey
     * used to generate the signature.
     */
    public get payeeNode(): Buffer {
        return this._getFieldValue(FIELD_TYPE.PAYEE_NODE);
    }

    public set payeeNode(value) {
        if (typeof value === "string") value = Buffer.from(value, "hex");
        this._setFieldValue(FIELD_TYPE.PAYEE_NODE, value);
    }

    /**
     * Gets the min final route CLTV expiry. If none is provided,
     * the default is 9.
     *
     * Sets the min final route CLTV expiry used in the final route.
     */
    public get minFinalCltvExpiry(): number {
        return this._getFieldValue(FIELD_TYPE.MIN_FINAL_CLTV_EXPIRY, MIN_FINAL_CLTV_EXPIRY_DEFAULT);
    }

    public set minFinalCltvExpiry(value) {
        this._setFieldValue(FIELD_TYPE.MIN_FINAL_CLTV_EXPIRY, value);
    }

    /**
     * Gets a list of fall back addresses. An invoice can include
     * multiple fallback addresses to send to an on-chain address
     * in the event of failure.
     */
    public get fallbackAddresses(): FallbackAddress[] {
        return this.fields
            .filter(p => p.type === FIELD_TYPE.FALLBACK_ADDRESS)
            .map(p => p.value) as FallbackAddress[];
    }

    /**
     * Adds a fallback address to the invoice. An invoice can include
     * one or more fallback addresses to send to an on-chain address
     * in the event of failure. This field may not make sense for small
     * or time-sensitive payments.
     *
     * The address string will be parsed and the appropriate address
     * type is added to the field metadata. The address will be
     * converted into a buffer containing the string values of the
     * address.
     */
    public addFallbackAddress(addrStr: string) {
        let version: ADDRESS_VERSION;
        let address: number[] | Buffer;

        // TODO - externalize magic strings!!!
        if (addrStr.startsWith("1") || addrStr.startsWith("m") || addrStr.startsWith("n")) {
            version = ADDRESS_VERSION.P2PKH;
            address = bs58check.decode(addrStr).slice(1); // remove prefix
        } else if (addrStr.startsWith("3") || addrStr.startsWith("2")) {
            version = ADDRESS_VERSION.P2SH;
            address = bs58check.decode(addrStr).slice(1); // remove prefix
        } else if (addrStr.startsWith("bc1") || addrStr.startsWith("tb1")) {
            const words = bech32.decode(addrStr).words;
            version = words[0];
            address = bech32.fromWords(words.slice(1));
        }
        if (Array.isArray(address)) address = Buffer.from(address);
        this.fields.push({ type: FIELD_TYPE.FALLBACK_ADDRESS, value: { version, address } });
    }

    /**
     * Gets the list of routes that are specified in the invoice.
     * Route information is necessary to route payments to private
     * nodes.
     */
    public get routes(): Route[] {
        return this.fields.filter(p => p.type === FIELD_TYPE.ROUTE).map(p => p.value);
    }

    /**
     * Adds a collection of routes to the invoice. A route entry must
     * be provided by private nodes so that a public addressible node
     * can be found by the recipient.
     *
     * Multiple route fields can be added to an invoice in according
     * with BOLT 11 to give the routing options.
     */
    public addRoute(routes: Route[]) {
        for (const route of routes) {
            if (typeof route.pubkey === "string") route.pubkey = Buffer.from(route.pubkey, "hex");
            if (typeof route.short_channel_id === "string") {
                route.short_channel_id = Buffer.from(route.short_channel_id, "hex");
            }
        }
        this.fields.push({ type: FIELD_TYPE.ROUTE, value: routes });
    }

    ///////////////////////////////////////////////////////////////////

    /**
     * Gets the value of thee first matching field that matches the field
     * type. If no result is found, the default value will be used.
     */
    private _getFieldValue<T>(type: FIELD_TYPE, def?: T): T {
        const field = this.fields.find(p => p.type === type);
        return (field ? field.value : def) as T;
    }

    /**
     * Sets the field value for the first matching field. If no
     * field exists it will insert a new field with the type and value
     * supplied.
     */
    private _setFieldValue<T>(type: FIELD_TYPE, value: T) {
        const field = this.fields.find(p => p.type === type);
        if (field) field.value = value;
        else this.fields.push({ type, value });
    }

    /**
     * Removes the fields that match the supplied type.
     */
    private _removeFieldByType(type: FIELD_TYPE) {
        this.fields = this.fields.filter(p => p.type !== type);
    }
}
