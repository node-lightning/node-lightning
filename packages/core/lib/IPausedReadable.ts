/**
 * Interface for any readable stream that is in paused mode. This stream
 * signals data is available via the "readable" event. Read should be
 * called until it returns `undefined`.
 */
export type IPausedReadable<T> = {
    on(event: "readable", cb: () => void);
    read(): T;
};
