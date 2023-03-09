## Options

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
