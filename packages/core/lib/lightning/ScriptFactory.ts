import { OpCode, Script } from "@node-lightning/bitcoin";
import { hash160, ripemd160 } from "@node-lightning/crypto";

export class ScriptFactory {
    /**
     * Constructs the P2MS commit script used in in the funding transaction
     * as defined in BOLT3. The pubkeys must be sorted in lexicographical
     * order.
     *
     * @param openPubKey funding_pubkey sent in open_channel
     * @param acceptPubKey funding_pubkey sent in accept_channel
     */
    public static fundingScript(openPubKey: Buffer, acceptPubKey: Buffer): Script {
        const pubkeys = [openPubKey, acceptPubKey].sort((a, b) => a.compare(b));
        return Script.p2msLock(2, ...pubkeys);
    }

    /**
     * Constructs an revocable sequence maturing contract using the
     * provided keys and delay. This script is used in the `to_local`
     * output of the commmitment transaction as well as the secondary
     * HTLC-Success and HTLC-Timeout transactions.
     *
     * @param revocationPubKey the revocation pubkey that has the ability
     * to perform a penalty transaction should a revoked version of this
     * output be spend.
     * @param delayedPubKey the delayed pubkey spendable after the
     * sequence delay
     * @param toSelfDelay the sequence delay in blocks
     */
    public static toLocalScript(
        revocationPubKey: Buffer,
        delayedPubKey: Buffer,
        toSelfDelay: number,
    ): Script {
        return new Script(
            OpCode.OP_IF,
                revocationPubKey,
            OpCode.OP_ELSE,
                Script.number(toSelfDelay),
                OpCode.OP_CHECKSEQUENCEVERIFY,
                OpCode.OP_DROP,
                delayedPubKey,
            OpCode.OP_ENDIF,
            OpCode.OP_CHECKSIG,
        ); // prettier-ignore
    }

    /**
     * Constructs the script for an offered HTLC output of a  commitment
     * transaction as defined in BOLT3. This enables on-chain resolution
     * of an HTLC to the local node via the secondary HTLC-Timeout
     * transaction. This secondary transaction is both sequence delayed
     * and timelocked and requires signatures by both parties to prevent
     * premature spending. The remote node can immediately resolve the
     * transaction wit knowledge of the preimage.
     *
     * Revocable with witness:
     * [revocationSig, revocationPubKey]
     *
     * Pay to local via the HTLC-Timeout transaction by using witness
     * [0, remoteHtlcSig, localHtlcSig, <>]
     *
     * Pay to remote counterparty without delay using witness
     * [remoteHtlcSig, preimage]
     *
     * @param paymentHash
     * @param revocationPubKey
     * @param localHtlcPubKey
     * @param remoteHtlcPubKey
     */
    public static offeredHtlcScript(
        paymentHash: Buffer,
        revocationPubKey: Buffer,
        localHtlcPubKey: Buffer,
        remoteHtlcPubKey: Buffer,
    ): Script {
        return new Script(
            // to remote with revocation key
            OpCode.OP_DUP, OpCode.OP_HASH160, hash160(revocationPubKey), OpCode.OP_EQUAL,
            OpCode.OP_IF,
                OpCode.OP_CHECKSIG,
            OpCode.OP_ELSE,
                remoteHtlcPubKey, OpCode.OP_SWAP, OpCode.OP_SIZE, Script.number(32), OpCode.OP_EQUAL,
                OpCode.OP_NOTIF,
                    // to local via HTLC-Timeout transaction (timelocked)
                    OpCode.OP_DROP, OpCode.OP_2, OpCode.OP_SWAP, localHtlcPubKey, OpCode.OP_2, OpCode.OP_CHECKMULTISIG,
                OpCode.OP_ELSE,
                    // to remote with preimage and signature
                    OpCode.OP_HASH160, ripemd160(paymentHash), OpCode.OP_EQUALVERIFY,
                    OpCode.OP_CHECKSIG,
                OpCode.OP_ENDIF,
            OpCode.OP_ENDIF,
        ); // prettier-ignore
    }

    /**
     * Constructs the script for a received HTLC output of a commitment
     * transaction as defined in BOLT3. This enables on-chain resolution
     * of an HTLC to the local node via the secondary HTLC-Success
     * transaction. This secondary transaction is sequence delayed and
     * thus local spends require both parties signatures. The remote
     * node can perform a timeout of this output after the timelock
     * expires.
     *
     * Revocable with witness:
     * [revocationSig, revocationPubKey]
     *
     * Pay to local via the HTLC-Success transaction by using witness
     * [0, remoteHtlcSig, localHtlcSig, preimage]
     *
     * Pay to remote counterparty after the CLTV expiry using witness
     * [remoteHtlcSig, <>]
     *
     * @param paymentHash
     * @param cltvExpiry
     * @param revocationPubKey
     * @param localHtlcPubKey
     * @param remoteHtlcPubKey
     */
    public static receivedHtlcScript(
        paymentHash: Buffer,
        cltvExpiry: number,
        revocationPubKey: Buffer,
        localHtlcPubKey: Buffer,
        remoteHtlcPubKey: Buffer,
    ): Script {
        return new Script(
            // to remote with revocation key
            OpCode.OP_DUP, OpCode.OP_HASH160, hash160(revocationPubKey), OpCode.OP_EQUAL,
            OpCode.OP_IF,
                OpCode.OP_CHECKSIG,
            OpCode.OP_ELSE,
                remoteHtlcPubKey, OpCode.OP_SWAP, OpCode.OP_SIZE, Script.number(32), OpCode.OP_EQUAL,
                OpCode.OP_IF,
                    // to local via HTLC-Success transaction
                    OpCode.OP_HASH160, ripemd160(paymentHash), OpCode.OP_EQUALVERIFY,
                    OpCode.OP_2, OpCode.OP_SWAP, localHtlcPubKey, OpCode.OP_2, OpCode.OP_CHECKMULTISIG,
                OpCode.OP_ELSE,
                    // to remote after cltv expiry with signature
                    OpCode.OP_DROP, Script.number(cltvExpiry), OpCode.OP_CHECKLOCKTIMEVERIFY, OpCode.OP_DROP,
                    OpCode.OP_CHECKSIG,
                OpCode.OP_ENDIF,
            OpCode.OP_ENDIF,
        ); // prettier-ignore
    }
}
