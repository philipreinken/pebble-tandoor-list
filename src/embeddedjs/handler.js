import Logger from "./logger";

class Handler {
  constructor(name) {
    this.name = name;
    this.handlers = new Map();
    this.logger = new Logger(`${this.name}-handler`);
  }

  register(e, fn, thisArg) {
    this.handlers.set(e, (!!thisArg) ? fn.bind(thisArg) : fn);
  }

  call(e, ...args) {
    const callback = this.handlers.get(e);

    if (typeof callback === 'function') {
      this.logger.info('calling handler for event', e, ...args);
      callback(e, ...args);
    } else {
      this.logger.info('no handler registered for event', e);
    }
  }

  events() {
    return this.handlers.keys();
  }
}

export default Handler;
