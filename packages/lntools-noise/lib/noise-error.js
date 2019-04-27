// @ts-check

module.exports;

class NoiseError extends Error {
  constructor(args) {
    super(args);
    this.module = 'noise';
  }
}

module.exports = NoiseError;
