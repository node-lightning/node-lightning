// @ts-check

const { LogManager } = require('./log-manager');

const { Logger } = require('./logger');
const { ConsoleTransport } = require('./transports/console-transport');
const { FileTransport } = require('./transports/file-transport');

const manager = new LogManager();
manager.transports.push(new ConsoleTransport(console));
manager.transports.push(new FileTransport('lntools.log'));

exports.Logger = Logger;
exports.LogManager = LogManager;
exports.ConsoleTransport = ConsoleTransport;
exports.FileTransport = FileTransport;
exports.manager = manager;
