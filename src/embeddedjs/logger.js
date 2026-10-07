class Logger {
  constructor(prefix = 'GENERIC', threshold = 'INFO') {
    this.prefix = prefix;
    this.threshold = threshold;

    this.levels = new Map([
      ['DEBUG', 0],
      ['INFO', 1],
      ['WARNING', 2],
      ['ERROR', 3]
    ]);
  }

  log(level, ...message) {
    const messages = [...message].map((msg) => {
      if (msg instanceof Error) {
        return msg.toString();
      } else if (typeof msg !== 'string') {
        return JSON.stringify(msg);
      } else {
        return msg;
      }
    });

    if (this.levels.get(level) < this.levels.get(this.threshold)) {
      return;
    }

    console.log(`[${this.prefix}][${level}] `, ...messages);
  }

  debug(...message) {
    this.log('DEBUG', ...message);
  }

  info(...message) {
    this.log('INFO', ...message);
  }

  warn(...message) {
    this.log('WARNING', ...message);
  }

  error(...message) {
    this.log('ERROR', ...message);
  }
}

export default Logger;
