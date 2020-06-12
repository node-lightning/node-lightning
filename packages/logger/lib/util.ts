import { LogLevel } from "./log-level";

/**
 * Helper function to determine if a log message is at the appropraite
 * level to be included in the logs
 * @param myLevel
 * @param msgLevel
 */
export function shouldLog(myLevel: LogLevel, msgLevel: LogLevel): boolean {
    switch (myLevel) {
        case LogLevel.Trace:
            return true;
        case LogLevel.Debug:
            return (
                msgLevel === LogLevel.Debug ||
                msgLevel === LogLevel.Info ||
                msgLevel === LogLevel.Warn ||
                msgLevel === LogLevel.Error
            );
        case LogLevel.Info:
            return (
                msgLevel === LogLevel.Info ||
                msgLevel === LogLevel.Warn ||
                msgLevel === LogLevel.Error
            );
        case LogLevel.Warn:
            return msgLevel === LogLevel.Warn || msgLevel === LogLevel.Error;
        case LogLevel.Error:
            return msgLevel === LogLevel.Error;
    }
}
