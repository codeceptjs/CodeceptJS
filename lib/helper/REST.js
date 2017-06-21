'user strict';
const Helper = require('../helper');
const requireg = require('requireg');
const co = require('co');
let unirest = requireg('unirest');
let headers = '';
let payload = '';
let request;

class REST extends Helper {

  constructor(config) {
    super(config);
    unirest = requireg('unirest');

    this.options = {
      timeout: 10000,
      reset_headers: false,
      endpoint: ''
    };
    Object.assign(this.options, config);
  }

  static _checkRequirements() {
    try {
      requireg("unirest");
    } catch (e) {
      return ["unirest"];
    }
  }

  setRestTimeout(newTimeout) {
    this.options.timeout = newTimeout;
  }

  haveRequestHeaders(customHeaders) {
    if (!customHeaders) {
      throw new Error('Cannot send empty headers.');
    }
    headers = customHeaders;
  }

  _cleanRequestHeaders() {
    if (this.options.reset_headers) {
      this.headers = {};
    }
  }
  _url(url) {
    return this.options.endpoint + url;
  }

  sendGet(url) {
    request = unirest.get(this._url(url));
    return this._executeRequest(request);
  }

  sendPost(url, payload = {}) {
    request = unirest.post(this._url(url), payload);
    return this._executeRequest(request);
  }

  _executeRequest(request) {
    if (headers && 'auth' in headers) {
      request.auth(headers.auth);
    }
    request.timeout(this.options.timeout);

    return co(executeRequest(request)).then((response) => {
      this._cleanRequestHeaders();
      return response;
    });
  }
}
module.exports = REST;

function* executeRequest(request) {
  return new Promise(function (resolve, reject) {
    request
      .headers(headers)
      .send(payload)
      .end(function (response) {
        return resolve(response) || reject(response);
      });
  });
}
