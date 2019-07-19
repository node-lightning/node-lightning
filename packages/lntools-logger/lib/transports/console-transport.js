// @ts-check

class ConsoleTransport {
  constructor(console) {
    this.console = console;
  }

  write(line) {
    this.console.log(line);
  }
}

exports.ConsoleTransport = ConsoleTransport;
