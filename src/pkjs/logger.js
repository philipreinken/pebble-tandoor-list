module.exports = class Logger {
  constructor(prefix = '') {
    this.prefix = prefix;
  }

  log(level, ...message) {
    const messages = [...message].map((msg) => {
      if (typeof msg === 'object') {
        return JSON.stringify(msg);
      } else {
        return msg;
      }
    });

    console.log(`[${this.prefix}][${level}] `, ...messages);
  }

  info(...message) {
    this.log('INFO', ...message);
  }

  warn(...message) {
    this.log('WARN', ...message);
  }

  error(...message) {
    this.log('ERROR', ...message);
  }
}
