// @ts-check

import { LogManager } from "./log-manager";
import { Logger } from "./logger";
import { ConsoleTransport } from "./transports/console-transport";
import { FileTransport } from "./transports/file-transport";

export * from "./logger";
export * from "./loglevel";
export * from "./log-manager";
export * from "./transports/console-transport";
export * from "./transports/file-transport";

const singleton = new LogManager();
singleton.transports.push(new ConsoleTransport(console));
singleton.transports.push(new FileTransport("lntools.log"));
export const manager = singleton;
