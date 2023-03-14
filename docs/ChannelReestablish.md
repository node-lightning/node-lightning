## Stages

1.  Prior to Use: This stage occurs before we've sent `commitment_signed` and before we've received `commitment_signed`. This stage exists during channel opening prior to `channel_ready` messages being exchanged or after we have already exchanged `channel_ready` but have not started using the channel. Using the channel will be indicated by one side pushing a new commitment to the other side via a `commitment_signed` message. Once either side has done this we will progress to the next stage. During this stage however, IF we have reached a point in channel creation where it is acceptable to send `channel_ready` (funder: anytime after broadcasting the funding transaction; fundee: after funding depth has been reached on confirmation of the funding transaction) the nodes should rebroadcast the `channel_ready` message to each other. Upon receipt of duplicate `channel_ready` we can just ignore it.

1a. Prior to sending `commitment_signed`, we should expect to receive `next_commitment_number` of 1.
1b. Prior to sending `revoke_and_ack`, we should expect to receive `next_revocation_number` of 0.

2.  Normal Operation: When not in the other two stages we need to properly account for the loss of `commitment_signed` or `revoke_and_ack` messages.

3.  Pending Close: This stage means that we have progressed past the close out HTLC phase of channel closure and we are not expecting to get any further updates to the channel. At this point, we expect that there will be no further commitment numbers or revocation numbers.

## Options

-   `option_dataloss_protect`: adds two new values to the `channel_reestablish`. The goal of this change is to allow you to detect that you are out of date if a peer sends you values above where you think you are. `your_last_per_commitment_secret` is the per-commitment secret sent in the last `revoke_and_ack` message that you sent to the peer. By sending this value, your peer can prove that you have previously revoked `next_revocation_number` - 1. In the event that you have data loss, you can also recover the `to_remote` funds of your peer's commitment transaction by using the `my_per_commitment_point` value that is sent as part of the `channel_reestablishment` message. This value combined with your `payment_public` key allow you to derive the `to_remote` key and extract the value of that output.
-   `option_static_remotekey`: fixes the the remote key to be the payment public key from open/accept message. In the event of dataloss, this allows you to recover the funds from the remote output of the commitment transaction without relying on the counterparty to send the `per_commitment_point`. As a result, the `per_commitment_point` can be sent to any valid point in the `channel_reestablish` message.

## Pseudocode for Channel Reestablish

```typescript
const expected_revocation_secret = get_revocation_secret(recv_next_revocation_number - 1);
const expected_commitment_number = my_last_commitment_number + 1;
const expected_revocation_number = my_last_revocation_number + 1 || 0;

// Initial condition, resend channel_ready
if (sent_next_commitment_number == 1 && recv_next_commitment_number == 1) {
    // resend channel_ready
}

// This section has to take precedence, otherwise the spec will cause
// you to broadcast with the "!= expected" clauses below
if (option_static_remotekey) {
    if (
        recv_next_revocation_number > expected_revocation_number &&
        recv_your_last_per_commitment_secret == expected_revocation_secret
    ) {
        // must not broadcast commitment
        // send error
    } else if (recv_your_last_per_commitment_secret != expected_revocation_secret) {
        // send error
        // fail channel
    }
} else if (option_dataloss_protect) {
    if (
        recv_next_revocation_number > expected_revocation_number &&
        recv_your_last_per_commitment_secret == expected_commitment_number
    ) {
        // must not broadcast
        // capture point
        // send error
    } else if (recv_your_last_per_commitment_secret != expected_revocation_secret) {
        // send error
        // fail channel
    } else if (!isValidPoint(recv_my_current_per_commitment_point)) {
        // send error
        // fail channel
    }
}

if ((recv_next_commitment_number = my_last_commitment_number)) {
    // flag resend commitment_signed
} else {
    if (recv_next_commitment_number !== expected_commitment_number) {
        // send error message
        // fail the channel => this is the point of discussion surrounding waiting for a peer to send an error message
    }

    if (!has_sent_commitment_signed && recv_next_commitment_number != 1) {
        // send error
        // fail the channel => subject to change
    }
}

if (recv_next_revocation_number == my_last_revocation_number && !has_recv_closing_signed) {
    // flag resend revoke_and_ack
} else {
    if (recv_next_Revocation_number != expected_revocation_number) {
        // send error
        // fail the channel
    }

    if (!has_sent_revoke_and_ack && recv_next_revocation_number != 0) {
        // send error
        // fail the channel
    }
}

// if flagged for send, these need to be in the right order
// send commitment_signed
// send revoke_and_ack
```

## Refactored

```typescript
const expected_revocation_secret = get_revocation_secret(recv_next_revocation_number - 1);
const expected_commitment_number = has_sent_commitment_signed ? 1 : my_last_commitment_number + 1;
const expected_revocation_number = has_sent_revoke_and_ack ? 0 : my_last_revocation_number + 1;

// Resend channel_ready if ok to do so
if (is_channel_ready && sent_next_commitment_number == 1 && recv_next_commitment_number == 1) {
    // resend channel_ready
}

if (option_static_remotekey || option_dataloss_protected) {
    if (recv_your_last_per_commitment_secret != expected_revocation_secret) {
        // send error
        // fail channel
    }

    if (!isValidPoint(recv_my_current_per_commitment_point)) {
        // send error
        // fail channel
    }
}

// This section has to take precedence, otherwise the spec will cause
// you to broadcast with the "!= expected" clauses below
if (recv_next_revocation_number > expected_revocation_number) {
    if (option_static_remotekey) {
        // must not broadcast commitment
        // send error
    } else if (option_dataloss_protect) {
        // must not broadcast commitment
        // capture point
        // send error
    }
}

if ((recv_next_commitment_number = my_last_commitment_number)) {
    // flag resend commitment_signed
} else {
    // peer has data loss
    if (recv_next_commitment_number !== expected_commitment_number) {
        // send error message
        // wait for error from peer before failing
    }
}

if (recv_next_revocation_number == my_last_revocation_number && !has_recv_closing_signed) {
    // flag resend revoke_and_ack
} else {
    if (recv_next_Revocation_number != expected_revocation_number) {
        // send error
        // wait for error from peer before failing
    }
}

// if flagged for send, these need to be in the right order
// send commitment_signed
// send revoke_and_ack
```
