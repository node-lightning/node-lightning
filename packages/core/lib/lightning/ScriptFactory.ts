import { OpCode, Script } from "@node-lightning/bitcoin";
import { hash160 } from "@node-lightning/crypto";

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
                    OpCode.OP_HASH160, hash160(paymentHash), OpCode.OP_EQUALVERIFY,
                    OpCode.OP_CHECKSIG,
                OpCode.OP_ENDIF,
            OpCode.OP_ENDIF,
        ); // prettier-ignore
    }

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
                    OpCode.OP_HASH160, hash160(paymentHash), OpCode.OP_EQUALVERIFY,
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
