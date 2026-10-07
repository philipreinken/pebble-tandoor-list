const Logger = require('./logger');
const Constants = require('./constants');
const TandoorClient = require('./tandoor');

const Clay = require('@rebble/clay');
const clayConfig = require('./config');

module.exports = class Application {
  /**
   * @param {Pebble} pebble
   */
  constructor(pebble) {
    this.pebble = pebble;

    this.logger = new Logger('APP');
    this.clay = new Clay(clayConfig);
    this.tandoor = new TandoorClient(this.getBaseURL(), this.getApiToken(), new Logger('TNDR'));

    this.listeners = new Map([
      ['ready', this.onReady.bind(this)],
      ['appmessage', this.onMessageReceived.bind(this)],
      ['showConfiguration', this.onShowConfiguration.bind(this)],
      ['webviewclosed', this.onWebViewClosed.bind(this)],
    ]);
  }

  getShoppingListCallback(err, res) {
    if (err !== null) {
      this.logger.error('getShoppingList', err);
    } else {
      if (res.results) {
        this.logger.debug('retrieved shopping list', res.results);

        const items = res.results
          .filter(i => !i.checked)
          .map(i => {
            return {
              id: i.id,
              name: i.food.name,
              checked: i.checked
            }
          });

        this.sendSequentially(Constants.MSG_KEY_SHOPPING_LIST_ITEM, items, 0);
      } else {
        this.logger.warn('shopping list response is empty');

        return;
      }
    }
  }

  onReady() {
    try {
      this.tandoor.getShoppingList(this.getShoppingListCallback.bind(this));
    } catch (err) {
      this.logger.error('onReady', err);
    }
  }

  toggleEntryCallback(err, res) {
    if (err) {
      this.logger.error('error toggling entry', err);
    } else {
      this.logger.info('entry toggled', res);

      this.onReady();
    }
  }

  /**
   * @param {Event} event
   */
  onMessageReceived(event) {
    const checkedPayload = event.payload[Constants.MSG_KEY_SHOPPING_LIST_ITEM];

    if (checkedPayload) {
      try {
        const item = JSON.parse(checkedPayload);

        this.tandoor.toggleEntry(item.id, item.checked, this.toggleEntryCallback.bind(this));
      } catch (err) {
        this.logger.error(err);
      }
    }
  }

  /**
   * @param {Event} event
   */
  onShowConfiguration(event) {
    this.logger.debug('showConfiguration');

    const url = clay.generateUrl();

    this.pebble.openURL(url);
  }

  /**
   * @param {Event} event
   */
  onWebViewClosed(event) {
    this.logger.debug('webviewclosed', event.response);

    var options = {};
    try {
      options = JSON.parse(decodeURIComponent(event.response));

      this.logger.info('parsed options', options);
    } catch (err) {
      this.logger.error('Error parsing configuration response', err);
    }

    if (options[Constants.MSG_KEY_BASE_URL]) {
      localStorage.setItem(Constants.MSG_KEY_BASE_URL, options[Constants.MSG_KEY_BASE_URL].value);
    } else {
      this.logger.warn(`${Constants.MSG_KEY_BASE_URL} not defined in options.`);
    }

    if (options[Constants.MSG_KEY_API_TOKEN]) {
      localStorage.setItem(Constants.MSG_KEY_API_TOKEN, options[Constants.MSG_KEY_API_TOKEN].value);
    } else {
      this.logger.warn(`${Constants.MSG_KEY_API_TOKEN} not defined in options.`);
    }
  }

  /**
   * @param {Pebble} pebble
   */
  registerListeners(pebble) {
    this.listeners.forEach((callback, event) => {
      pebble.addEventListener(event, callback);
    });
  }

  /**
   * @param {string} key
   * @returns string
   * @throws Error
   */
  getConfig(key) {
    const val = localStorage.getItem(key);

    this.logger.debug('getConfig', val);

    if (val) {
      return val;
    } else {
      throw new Error(`${key} not set! Please specify it in the settings.`)
    }
  }

  getBaseURL() {
    return this.getConfig(Constants.MSG_KEY_BASE_URL);
  }

  getApiToken() {
    return this.getConfig(Constants.MSG_KEY_API_TOKEN);
  }

  /**
   * @param {string} msgKey
   * @param {Array<any>} items
   * @param {number} i
   * @returns
   */
  sendSequentially(msgKey, items, i) {
    if (i >= items.length) {
      this.logger.debug('done sending');
      return;
    }

    this.logger.info('sending', msgKey, items[i]);

    const successCallback = function () {
      this.sendSequentially(msgKey, items, i + 1);
    }

    const errorCallback = function (err) {
      this.logger.error('failed', i, err);
    }

    this.pebble.sendAppMessage({
        [msgKey]: JSON.stringify(items[i])
      },
      successCallback.bind(this),
      errorCallback.bind(this)
    );
  }
}
