import _ from "./constants";
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

/**
 * @param application PiuApplication
 * @returns Handler
 */
function BuildMessageHandler(application) {
  const h = new Handler('message');

  for (const e of [_.MSG_KEY_BASE_URL, _.MSG_KEY_API_TOKEN, _.MSG_KEY_SHOPPING_LIST, _.MSG_KEY_SHOPPING_LIST_ITEM, _.MSG_KEY_SHOPPING_LIST_ITEM_CHECKED]) {
    h.register(e, null);
  }

  h.register(_.MSG_KEY_SHOPPING_LIST_ITEM, function (item) {
    application.distribute(_.E_ON_SHOPPING_LIST_ITEM_RECEIVED, JSON.parse(item))
  });

  return h;
}

/**
 * @param application PiuApplication
 * @returns Handler
 */
function BuildButtonHandler(application) {
  const h = new Handler('button');

  h.register('select', function (down) {
    application.distribute((down > 0) ? _.E_ON_SELECT_BUTTON : _.E_ON_SELECT_BUTTON_UP);
  });

  h.register('up', function (down) {
    application.distribute((down > 0) ? _.E_ON_UP_BUTTON : _.E_ON_UP_BUTTON_UP);
  });

  h.register('down', function (down) {
    application.distribute((down > 0) ? _.E_ON_DOWN_BUTTON : _.E_ON_DOWN_BUTTON_UP);
  });

  h.register('back', function (down) {
    application.distribute((down > 0) ? _.E_ON_BACK_BUTTON : _.E_ON_BACK_BUTTON_UP);
  });

  return h;
}

export {
  BuildMessageHandler,
  BuildButtonHandler
}

export default Handler;
