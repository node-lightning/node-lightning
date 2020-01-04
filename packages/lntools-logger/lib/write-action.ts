import { LogLevel } from "./loglevel";

export type WriteAction = (level: LogLevel, area: string, instance: string, msg: string) => void;
