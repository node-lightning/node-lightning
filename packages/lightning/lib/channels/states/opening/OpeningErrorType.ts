export enum OpeningErrorType {
    PeerNotReady,
    FundsNotAvailable,
    FundingAmountTooLow,
    FundingAmountTooHigh,
    PushAmountTooHigh,
    DustLimitTooLow,
    ChannelReserveTooLow,
    ChannelReserveUnreachable,
    MaxAcceptedHtlcsTooHigh,
}
