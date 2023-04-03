## Subroutine `createErrorMessage`

Construct an `error` message according to [BOLT 1](https://github.com/lightning/bolts/blob/master/01-messaging.md#the-error-and-warning-messages). Error messages are sent for protocol violations or there is an internal error that makes the channel unusable or that make further communication unusable.

Inputs:

-   `data`: `string`
-   `channel?`: `Channel`
-   `use_temp_id`: `boolean`

1. If channel is not supplied, the `channel_id` value must be set to all zeroes. This indicates that the error applies to all channels
1. Must use the `temporary_channel_id` when the `funder` and before sending `channel_created` or if the `fundee` and before sending `channel_signed`
1. May send an empty `data` field
1. If error is generated due to a failed signature check, should include the raw, hex-encoded transaction in reply to a `funding_created`, `funding_signed`, `closing_signed`, or `commitment_signed` message.
