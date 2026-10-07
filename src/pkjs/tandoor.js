module.exports = class TandoorClient {
  constructor(baseUrl, apiKey) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  authenticatedRequest() {
    const xhr = new XMLHttpRequest();

    xhr.setRequestHeader('Authorization', 'Bearer ' + this.apiKey);
    xhr.setRequestHeader('Content-Type', 'application/json');

    return xhr;
  }

  getRequest(url, callback) {
    const xhr = this.authenticatedRequest();
    xhr.open('GET', url);
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
    const xhr = this.authenticatedRequest();
    xhr.open('PATCH', url);
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
