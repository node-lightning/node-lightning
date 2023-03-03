## Pseudocode for Channel Reestablish

```typescript
const expected_revocation_secret = get_revocation_secret(next_revocation_number - 1);
const expected_commitment_number = my_last_commitment_number + 1;
const expected_revocation_number = my_last_revocation_number + 1 || 0;

// TODO: conditions on rebroadcast channel_ready

// This section has to take precedence, otherwise the spec will cause
// you to broadcast with the "!= expected" clauses below
if (option_static_remotekey) {
    if (
        next_revocation_number > expected_revocation_number &&
        your_last_per_commitment_secret == expected_revocation_secret
    ) {
        // must not broadcast commitment
        // send error
    } else if (your_last_per_commitment_secret != expected_revocation_secret) {
        // send error
        // fail channel
    }
} else if (option_dataloss_protect) {
    if (
        next_revocation_number > expected_revocation_number &&
        your_last_per_commitment_secret == expected_commitment_number
    ) {
        // must not broadcast
        // capture point
        // send error
    } else if (your_last_per_commitment_secret != expected_revocation_secret) {
        // send error
        // fail channel
    } else if (!isValidPoint(my_current_per_commitment_point)) {
        // send error
        // fail channel
    }
}

if ((next_commitment_number = last_used_commitment_number)) {
    // flag commitment_signed
} else {
    if (next_commitment_number !== expected_commitment_number) {
        // send error message
        // fail the channel => this is the point of discussion surrounding waiting for a peer to send an error message
    }

    if (!sent_commitment_signed && next_commitment_number != 1) {
        // send error
        // fail the channel => subject to change
    }
}

if (next_revocation_number == last_revoke_number && !received_closing_signed) {
    // flag resend revoke_and_ack

    // these need to be in the right order
    if (resend_commitment_signed) {
        // send commitment_signed
    } else {
        // send revoke_and_ack
    }
} else {
    if (next_Revocation_number != expected_revocation_number) {
        // send error
        // fail the channel
    }

    if (!sent_revoke_and_ack && next_revocation_number != 0) {
        // send error
        // fail the channel
    }
}
```
