module.exports = class TandoorClient {
  constructor(baseUrl, apiKey) {
    if (!baseUrl) {
      throw new Error("baseUrl not provided!");
    }

    if (!apiKey) {
      throw new Error("apiKey not provided!");
    }

    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  authenticateRequest(xhr) {
    xhr.setRequestHeader('Authorization', 'Bearer ' + this.apiKey);
    xhr.setRequestHeader('Content-Type', 'application/json');
  }

  getRequest(url, callback) {
    const xhr = new XMLHttpRequest();

    xhr.open('GET', url);
    this.authenticateRequest(xhr);
    xhr.onload = function() {
      if (xhr.status >= 200 && xhr.status < 300) {
        callback(null, JSON.parse(xhr.responseText));
      } else {
        callback(new Error('HTTP ' + xhr.status));
      }
    };
    xhr.onerror = function() {
      callback(new Error('Network error'));
    };
    xhr.send();
  }

  patchRequest(url, data, callback) {
    const xhr = new XMLHttpRequest();

    xhr.open('PATCH', url);
    this.authenticateRequest(xhr);
    xhr.onload = function() {
      if (xhr.status >= 200 && xhr.status < 300) {
        callback(null, JSON.parse(xhr.responseText));
      } else {
        callback(new Error('HTTP ' + xhr.status));
      }
    };
    xhr.onerror = function() {
      callback(new Error('Network error'));
    };
    xhr.send(JSON.stringify(data));
  }

  getShoppingList(callback) {
    this.getRequest(this.baseUrl + '/api/shopping-list-entry/', callback);
  }

  toggleEntry(id, checked, callback) {
    this.patchRequest(this.baseUrl + '/api/shopping-list-entry/' + id + '/', { checked: checked }, callback);
  }
}
