// @ts-check

const { Logger } = require('./logger');
const { ConsoleTransport } = require('./transports/console-transport');
const { FileTransport } = require('./transports/file-transport');

const logger = new Logger();
logger.transports.push(new ConsoleTransport(console));
logger.transports.push(new FileTransport('lntools.log'));

exports.Logger = Logger;
exports.ConsoleTransport = ConsoleTransport;
exports.logger = logger;
