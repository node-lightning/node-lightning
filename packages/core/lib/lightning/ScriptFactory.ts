import { OpCode, Script } from "@node-lightning/bitcoin";

export class ScriptFactory {
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
}
