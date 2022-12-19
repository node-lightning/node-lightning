# Channel Update States

The internal channel state can be a bit complex. Initially the channel starts in a weird state where we are trying to establish the first valid commitment transaction. Eventually as it moves towards normal operation we will move towards a normal pattern:

1. When sending `open_channel` message to the peer containing our `first_per_commitment_point=A` for our commitment_txs

    - `our.commitment=undefined`
    - `our.commitmentPt=undefined`
    - `our.commitmentSig=undefined`
    - `our.nextCommitment=0`
    - `our.nextCommitmentPt=A`
    - `our.nextCommitmentSig=undefined`

1. After receiving the `accept_channel` message from the peer containing `first_per_commitment_point=B` for use in their first commitment transaction:

    - `their.commitment=undefined`
    - `their.commitmentPt=undefined`
    - `their.commitmentSig=undefined`
    - `their.nextCommitment=0`
    - `their.nextCommitmentPt=X`
    - `their.nextCommitmentSig=undefined`

1. Whens ending `funding_created` we provide the signature for the peer's commitment first commitment transaction. We can capture this signature though we are capable of regenerating it at any time.

    - `their.commitment=undefined`
    - `their.commitmentPt=undefined`
    - `their.commitmentSig=undefined`
    - `their.nextCommitment=0`
    - `their.nextCommitmentPt=X`
    - `their.nextCommitmentSig=sig(0)`

1. After receiving `funding_signed` from the peer containing their signature for our first commitment transaction, we are capable of spending the first commitment transaction.

    - `our.commitment=undefined`
    - `our.commitmentPt=undefined`
    - `our.commitmentSig=undefined`
    - `our.nextCommitment=0`
    - `our.nextCommitmentPt=A`
    - `our.nextCommitmentSig=sig(0)`

1. When we send `channel_ready` we provide the next `per_commitment_point` for use in our version of the commitment transaction. We will rotate the `next_*` fields on our side of the channel.

    - `our.commitment=0`
    - `our.commitmentPt=A`
    - `our.commitmentSig=sig(0)`
    - `our.nextCommitment=1`
    - `our.nextCommitmentPt=B`
    - `our.nextCommitmentSig=undefined`

1. When we receive our peer's `channel_ready` it provides their next `per_commitment_point` for use in their next commitment transaction. We will rotate the `next_*` fields on their side of the channel. The channel is now fully in the `normal` operation mode.

    - `their.commitment=0`
    - `their.commitmentPt=X`
    - `their.commitmentSig=sig(0)`
    - `their.nextCommitment=1`
    - `their.nextCommitmentPt=Y`
    - `their.nextCommitmentSig=undefined`

1. Next our peer sends us an HTLC via `update_add_htlc`. Since they sent the update, they'll send us a sig for our next commitment transaction. So that we can then revoke the prior commitment transaction.

1. Our peer now sends us a `commitment_signed` message which signs our version of the next commitment using point `B`. Our node now has the ability to broadcast either version=0 or version=1 of our commitment transactions since we have valid sigs for both of those commitment transactions and haven't yet revoked 0.

    - `our.commitment=0`
    - `our.commitmentPt=A`
    - `our.commitmentSig=sig(0)`
    - `our.nextCommitment=1`
    - `our.nextCommitmentPt=B`
    - `our.nextCommitmentSig=sig(1)`

1. We will now irrevocably commit to the HTLC by sending a `revoke_and_ack` message containing our next per-commitment point `C`. At this point our commitment `0` is revoked and no longer valid. We discard that and move along.

    - `our.commitment=1`
    - `our.commitmentPt=B`
    - `our.commitmentSig=sig(1)`
    - `our.nextCommitment=2`
    - `our.nextCommitmentPt=C`
    - `our.nextCommitmentSig=undefined`

1. Since we are irrevocably committed to the HTLC we will now send an `commitment_signed` to our peer so they have it in their commitment transaction. We use their point `Y` and sign their version of `1`. Once sent we should expect our to peer to use either version of their commitment transaction.

    - `their.commitment=0`
    - `their.commitmentPt=X`
    - `their.commitmentSig=sig(0)`
    - `their.nextCommitment=1`
    - `their.nextCommitmentPt=Y`
    - `their.nextCommitmentSig=sig(1)`

1. The peer will now send `revoke_and_ack` to move the channel forward and irrevocably commit to the HTLC. We will capture and store the `per_commitment_secret=x` that they revealed and rotate away their commitment `0`. They will allow the channel to move forward by providing the per-commitment point `Z`

    - `their.commitment=1`
    - `their.commitmentPt=Y`
    - `their.commitmentSig=sig(1)`
    - `their.nextCommitment=2`
    - `their.nextCommitmentPt=Z`
    - `their.nextCommitmentSig=undefined`
    - `their.oldKeys=[x]`
