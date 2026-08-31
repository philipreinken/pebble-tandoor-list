var Clay = require('@rebble/clay');
var clayConfig = require('./config');
var clay = new Clay(clayConfig);

var moddableProxy = require('@moddable/pebbleproxy');

const BASE_URL_KEY = 'baseUrl';
const API_TOKEN_KEY = 'apiToken';

function log(msg) {
  console.log('PKJS: ' + msg);
}

function loadSettings() {
  var baseUrl = localStorage.getItem(BASE_URL_KEY) || '';
  var apiToken = localStorage.getItem(API_TOKEN_KEY) || '';

  try {
    var claySettings = clay.getSettings();
    baseUrl = String(claySettings.baseUrl || '');
    apiToken = String(claySettings.apiToken || '');
  } catch (e) {
    log('Clay settings error: ' + e.message);
  }

  return {
    baseUrl: baseUrl.replace(/\/$/, ''),
    apiToken: apiToken
  };
}

function saveSettings(baseUrl, apiToken) {
  baseUrl = String(baseUrl || '').replace(/\/$/, '');
  apiToken = String(apiToken || '');
  localStorage.setItem(BASE_URL_KEY, baseUrl);
  localStorage.setItem(API_TOKEN_KEY, apiToken);
  log('Saved baseUrl=' + baseUrl);
}

function sendToWatch(type, payload) {
  payload = payload || {};
  payload.type = type;
  log('sendToWatch: ' + type + ' ' + JSON.stringify(payload));
  if (Pebble) {
    Pebble.sendAppMessage(payload);
  }
}

function fetchList(url, accumulated) {
  var settings = loadSettings();
  log('fetchList settings baseUrl=' + settings.baseUrl + ' token=' + (settings.apiToken ? 'yes' : 'no'));

  if (!settings.baseUrl || !settings.apiToken) {
    sendToWatch('error', { name: 'Not configured' });
    return;
  }

  var listUrl = url || settings.baseUrl + '/api/shopping-list-entry/';
  log('fetchList URL: ' + listUrl);

  fetch(listUrl, {
    method: 'GET',
    headers: {
      Authorization: 'Bearer ' + settings.apiToken,
      Accept: 'application/json'
    }
  })
    .then(function(response) {
      log('fetchList status: ' + response.status);
      if (!response.ok) {
        throw new Error('HTTP ' + response.status);
      }
      return response.text();
    })
    .then(function(text) {
      log('fetchList response: ' + text.substring(0, 500));
      var data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error('JSON parse failed: ' + e.message);
      }

      var results = data.results || data;
      var next = data.next || null;
      var all = (accumulated || []).concat(results);
      log('fetchList results count: ' + results.length + ' total: ' + all.length);

      if (next) {
        log('fetchList next: ' + next);
        fetchList(next, all);
      } else {
        sendToWatch('clear');
        all.forEach(function(entry, i) {
          log('entry ' + i + ': ' + JSON.stringify(entry));
          sendToWatch('entry', {
            id: entry.id,
            name: entry.food_name || (entry.food && entry.food.name) || 'Unknown',
            amount: String(entry.amount || ''),
            unit: String(entry.unit_name || (entry.unit && entry.unit.name) || ''),
            checked: entry.checked ? 1 : 0,
            index: i
          });
        });
      }
    })
    .catch(function(err) {
      log('fetchList error: ' + err.message);
      sendToWatch('error', { name: err.message || String(err) });
    });
}

function toggleEntry(id, checked) {
  var settings = loadSettings();

  fetch(settings.baseUrl + '/api/shopping-list-entry/' + id + '/', {
    method: 'PATCH',
    headers: {
      Authorization: 'Bearer ' + settings.apiToken,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ checked: checked })
  })
    .then(function(response) {
      if (!response.ok) throw new Error('HTTP ' + response.status);
      return response.json();
    })
    .then(function(updated) {
      sendToWatch('updated', {
        id: updated.id,
        checked: updated.checked ? 1 : 0
      });
    })
    .catch(function(err) {
      sendToWatch('error', { name: err.message || String(err) });
    });
}

Pebble.addEventListener('ready', function(e) {
  moddableProxy.readyReceived(e);
  sendToWatch('clear');
  fetchList();
});

Pebble.addEventListener('appmessage', function(e) {
  if (moddableProxy.appMessageReceived(e)) return;

  var dict = e.payload;
  var type = dict.type;

  if (type === 'refresh') {
    fetchList();
  } else if (type === 'toggle') {
    toggleEntry(dict.id, dict.checked === 1);
  }
});

Pebble.addEventListener('showConfiguration', function() {
  var url = clay.generateUrl();
  Pebble.openURL(url);
});

Pebble.addEventListener('webviewclosed', function(e) {
  if (moddableProxy.webviewClosedReceived) {
    moddableProxy.webviewClosedReceived(e);
  }

  var options = {};
  try {
    options = JSON.parse(decodeURIComponent(e.response));
  } catch (err) {
    return;
  }

  saveSettings(options.baseUrl.value, options.apiToken.value);
  fetchList();
});
