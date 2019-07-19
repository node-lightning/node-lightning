const fs = require('fs');

class FileTransport {
  constructor(filepath) {
    this.filePath = filepath;
    this.fileDescriptor = fs.openSync(filepath, 'a', 0o666);
  }

  write(line) {
    fs.write(this.fileDescriptor, line + '\n', () => {});
  }
}

exports.FileTransport = FileTransport;
