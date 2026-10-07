const Logger = require('./logger');
const Constants = require('./constants');
const TandoorClient = require('./tandoor');

const Clay = require('@rebble/clay');
const clayConfig = require('./config');

const clay = new Clay(clayConfig);

const log = new Logger('PKJS');

log.info('init');

log.info(JSON.stringify(Constants));

Pebble.addEventListener('ready', function (e) {
  log.info('PebbleKit JS ready');

  Pebble.sendAppMessage({
    shoppingList: []
  });
});

Pebble.addEventListener('appmessage', function (e) {
  log.info('Message received from watch', JSON.stringify(e.payload));
});

Pebble.addEventListener('showConfiguration', function () {
  log.info('Show configuration');

  var url = clay.generateUrl();
  Pebble.openURL(url);
});

Pebble.addEventListener('webviewclosed', function (e) {
  log.info('Webview closed', JSON.stringify(e.response));

  if (webviewClosedReceived) {
    webviewClosedReceived(e);
  }

  var options = {};
  try {
    options = JSON.parse(decodeURIComponent(e.response));
  } catch (err) {
    log.error('Error parsing configuration response', err);
  }

  if (options[Constants.MSG_KEY_BASE_URL]) {
    localStorage.setItem(Constants.MSG_KEY_BASE_URL, options[Constants.MSG_KEY_BASE_URL]);
  } else {
    log.warn(`${Constants.MSG_KEY_BASE_URL} not defined in options.`);
  }

  if (options[Constants.MSG_KEY_API_TOKEN]) {
    localStorage.setItem(Constants.MSG_KEY_API_TOKEN, options[Constants.MSG_KEY_API_TOKEN]);
  } else {
    log.warn(`${Constants.MSG_KEY_API_TOKEN} not defined in options.`);
  }
});

function getConfig(key) {
  const val = localStorage.getItem(key);

  if (val) {
    return val;
  } else {
    throw new Error(`${key} not set! Please specify it in the settings.`)
  }
}

const getBaseURL = getConfig.bind(this, Constants.MSG_KEY_BASE_URL);
const getApiToken = getConfig.bind(this, Constants.MSG_KEY_API_TOKEN);

/*
try {
  const tandoorClient = new TandoorClient(getBaseURL(), getApiToken())

  tandoorClient.getShoppingList(function (err, res) {
    if (err) {
      log.error(err)
    }

    log.info(res)
  })
} catch (e) {
  log.error(e)
}
*/
