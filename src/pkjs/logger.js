module.exports = class Logger {
  constructor(prefix = '') {
    this.prefix = prefix;
  }

  log(level, ...message) {
    console.log(`[${this.prefix}][${level}] `, ...message);
  }

  info(message) {
    this.log('INFO', message);
  }

  warn(message) {
    this.log('WARN', message);
  }

  error(message) {
    this.log('ERROR', message);
  }
}
