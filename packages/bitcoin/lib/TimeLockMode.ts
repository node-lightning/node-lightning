/**
 * Specifies what a time lock is based on. Currently this can either be
 * a block-based or timestamp-based time lock and is used for absolute
 * time locks (nLocktime) or relative time locks (nSequence).
 */
export enum TimeLockMode {
    /**
     * Block height based time lock
     */
    Block,

    /**
     * Unix timestamps based time lock
     */
    Time,
}
