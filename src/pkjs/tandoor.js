module.exports = class TandoorClient {
  constructor(baseUrl, apiKey, logger) {
    if (!baseUrl) {
      throw new Error("baseUrl not provided!");
    }

    if (!apiKey || !(typeof apiKey === 'string') || !apiKey.startsWith('tda_')) {
      throw new Error("apiKey not provided or incorrect!");
    }

    if (!logger) {
      throw new Error("logger not provided!");
    }

    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    this.log = logger;

    this.log.debug('instantiated', baseUrl, apiKey);
  }

  authenticateRequest(xhr) {
    const headers = new Map([
      ['Authorization', 'Bearer ' + this.apiKey],
      ['Accept', 'application/json'],
      ['Content-Type', 'application/json']
    ]);

    const callback = function (val, key) {
      this.log.debug('setting', key, val);
      xhr.setRequestHeader(key, val);
    };

    headers.forEach(callback.bind(this));
  }

  getRequest(url, callback) {
    const xhr = new XMLHttpRequest();

    xhr.open('GET', url);
    this.authenticateRequest(xhr);
    xhr.withCredentials = false;
    xhr.onload = function() {
      if (xhr.status >= 200 && xhr.status < 300) {
        callback(null, JSON.parse(xhr.responseText));
      } else {
        callback(new Error('HTTP ' + xhr.status + ' ' + xhr.responseText));
      }
    };
    xhr.onerror = function() {
      callback(new Error('Network error'));
    };

    this.log.debug('GET', url);

    xhr.send();
  }

  patchRequest(url, data, callback) {
    const xhr = new XMLHttpRequest();

    xhr.open('PATCH', url);
    this.authenticateRequest(xhr);
    xhr.withCredentials = false;
    xhr.onload = function() {
      if (xhr.status >= 200 && xhr.status < 300) {
        callback(null, JSON.parse(xhr.responseText));
      } else {
        callback(new Error('HTTP ' + xhr.status + ' ' + xhr.responseText));
      }
    };
    xhr.onerror = function() {
      callback(new Error('Network error'));
    };

    this.log.debug('PATCH', url, data);

    xhr.send(JSON.stringify(data));
  }

  getShoppingList(callback) {
    this.getRequest(this.baseUrl + '/api/shopping-list-entry/', callback);
  }

  toggleEntry(id, checked, callback) {
    this.patchRequest(this.baseUrl + '/api/shopping-list-entry/' + id + '/', { checked: checked }, callback);
  }
}
