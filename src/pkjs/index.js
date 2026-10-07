const Logger = require('./logger');
const Constants = require('./constants');
const TandoorClient = require('./tandoor');

const Clay = require('@rebble/clay');
const clayConfig = require('./config');

const clay = new Clay(clayConfig);

const log = new Logger('PKJS');

log.info('init');

log.info(Constants);

Pebble.addEventListener('ready', function (e) {
  log.info('ready');

  onReady(e);
});

Pebble.addEventListener('appmessage', function (e) {
  log.info('appmessage', e.payload);
});

Pebble.addEventListener('showConfiguration', function () {
  log.info('showConfiguration');

  var url = clay.generateUrl();
  Pebble.openURL(url);
});

Pebble.addEventListener('webviewclosed', function (e) {
  log.info('webviewclosed', e.response);

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

function sendSequentially(msgKey, items, i) {
  if (i >= items.length) {
    return;
  }

  log.info('sending', msgKey, items[i])
  Pebble.sendAppMessage({
      [msgKey]: JSON.stringify(items[i])
    },
    function () {
      sendSequentially(msgKey, items, i + 1);
    },
    function (e) {
      log.error('failed', i, e);
    }
  );
}

function onReady(e) {
  try {
    log.info('instantiating tandoor client...');
    const tandoorClient = new TandoorClient(getBaseURL(), getApiToken())

    tandoorClient.getShoppingList(function (err, res) {
      if (err) {
        log.error(err);
      } else {
        const msg = {};

        if (res.results) {
          log.info('retrieved shopping list', res.results);

          const items = res.results
            //.filter(i => !i.checked)
            .map(i => {
              return {
                id: i.id,
                name: i.food.name,
                checked: i.checked
              }
            });

          sendSequentially(Constants.MSG_KEY_SHOPPING_LIST_ITEM, items, 0);
        } else {
          log.warn('results is empty');

          return;
        }
      }
    });
  } catch (e) {
    log.error(e);
  }
}
