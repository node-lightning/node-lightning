export type Route = {
    pubkey: Buffer;
    short_channel_id: Buffer;
    fee_base_msat: number;
    fee_proportional_millionths: number;
    cltv_expiry_delta: number;
};
