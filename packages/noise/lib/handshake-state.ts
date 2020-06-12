/**
 * States that the handshake process can be in. States depend on
 * whether the socket is the connection Initiator or Responder.
 *
 * Initiator:
 *   1.  create and send Iniatitor act1 and transition to
 *       AWAITING_RESPONDER_REPLY
 *   2.  process the Responder's reply as act2
 *   3.  create Initiator act3 reply to complete the handshake
 *       and transitions to READY
 *
 * Responder:
 *   1.  begins in AWAITING_INITIATOR waiting to receive act1
 *   2.  processes act1 and creates a reply as act2 and transitions
 *       to AWAITING_INITIATOR_REPLY
 *   3.  processes the Initiator's reply to complete the handshake
 *       and transition to READY
 */
export enum HANDSHAKE_STATE {
    /**
     * Initial state for the Initiator. Initiator will transition to
     * AWAITING_RESPONDER_REPLY once act1 is completed and sent.
     */
    INITIATOR_INITIATING = 0,

    /**
     * Responders begin in this state and wait for the Intiator to begin
     * the handshake. Sockets originating from the NoiseServer will
     * begin in this state.
     */
    AWAITING_INITIATOR = 1,

    /**
     * Initiator has sent act1 and is awaiting the reply from the responder.
     * Once received, the intiator will create the reply
     */
    AWAITING_RESPONDER_REPLY = 2,

    /**
     * Responder has  sent a reply to the inititator, the Responder will be
     * waiting for the final stage of the handshake sent by the Initiator.
     */
    AWAITING_INITIATOR_REPLY = 3,

    /**
     * Responder/Initiator have completed the handshake and we're ready to
     * start sending and receiving over the socket.
     */
    READY = 100,
}
