export enum InitFeatureFlags {
    /**
     * option_data_loss_protect local flag is set. This flag enables / requires
     * the support of the extra channel_reestablish fields defined in BOLT #2.
     */
    optionDataLossProtectRequired = 0,

    /**
     * option_data_loss_protect local flag is set. This flag enables / requires
     * the support of the extra channel_reestablish fields defined in BOLT #2.
     */
    optionDataLossProtectOptional = 1,

    /**
     * initial_routing_sync asks the remote node to send a complete routing
     * information dump. The initial_routing_sync feature is overridden (and
     * should be considered equal to 0) by the gossip_queries feature if the
     * latter is negotiated via init.
     */
    initialRoutingSyncOptional = 3,

    /**
     * option_upfront_shutdown_script flag asks to commit to a shutdown
     * scriptpubkey when opening a channel as defined in BOLT #2.
     */
    optionUpfrontShutdownScriptRequired = 4,

    /**
     * option_upfront_shutdown_script flag asks to commit to a shutdown
     * scriptpubkey when opening a channel as defined in BOLT #2.
     */
    optionUpfrontShutdownScriptOptional = 5,

    /**
     * gossip_queries flag signals that the node wishes to use more advanced
     * gossip control. When negotiated, this flag will override the
     * initial_routing_sync flag. Advanced querying is defined in BOLT #7.
     */
    gossipQueriesRequired = 6,

    /**
     * gossip_queries flag signals that the node wishes to use more advanced
     * gossip control. When negotiated, this flag will override the
     * initial_routing_sync flag. Advanced querying is defined in BOLT #7.
     */
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
