export type NoiseServerListenOptions = {
    /**
     * Optional port to listen on.  If port is omitted or is 0,
     * the operating system will assign an arbitrary unused port, which can be retrieved
     * by using server.address().port after the 'listening' event has been emitted.
     */
    port?: number;

    /**
     * Optional host to listen on. If host is omitted, the server
     * will accept connections on the unspecified IPv6 address (::) when IPv6 is available,
     * or the unspecified IPv4 address (0.0.0.0) otherwise. In most operating systems,
     * listening to the unspecified IPv6 address (::) may cause NoiseSocket to also
     * listen on the unspecified IPv4 address (0.0.0.0).
     */
    host?: string;

    /**
     * Optional value to specify the maximum length of the
     * queue of pending connections. The actual length will be determined by the OS through
     * sysctl settings such as tcp_max_syn_backlog and somaxconn on Linux. The default value
     * of this parameter is 511 (not 512).
     */
    backlog?: number;
};
