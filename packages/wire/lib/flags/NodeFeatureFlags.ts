export enum NodeFeatureFlags {
    optionDataLossProtectRequired = 0,
    optionDataLossProtectOptional = 1,

    optionUpfrontShutdownScriptRequired = 4,
    optionUpfrontShutdownScriptOptional = 5,

    gossipQueriesRequired = 6,
    gossipQueriesOptional = 7,

    optionVarOptionOptinRequired = 8,
    optionVarOptionOptinOptional = 9,

    gossipQueriesExRequired = 10,
    gossipQueriesExOptional = 11,

    optionStaticRemoteKeyRequired = 12,
    optionStaticRemoteKeyOptional = 13,

    paymentSecretRequired = 14,
    paymentSecretOptional = 15,

    basicMppRequired = 16,
    basicMppOptional = 17,

    optionSupportLargeChannelRequired = 18,
    optionSupportLargeChannelOptional = 19,
}
