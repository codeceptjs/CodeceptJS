const Helper = require('../helper');
const requireg = require('requireg');

const axios = requireg('axios');
let headers = {};

class Graphql extends Helper {
  constructor(config) {
    super(config);
    this.options = {
      timeout: 10000,
      defaultHeaders: {},
      endpoint: '',
    };
    this.options = Object.assign(this.options, config);
    headers = Object.assign({}, this.options.defaultHeaders);
    axios.defaults.headers = this.options.defaultHeaders;
  }

  static _checkRequirements() {
    try {
      requireg('axios');
    } catch (e) {
      return ['axios'];
    }
  }

  _url(url) {
    return /^\w+\:\/\//.test(url) ? url : this.options.endpoint + url;
  }

  async _executeRequest(request) {
    if (headers && headers.auth) {
      request.auth = headers.auth;
    }
    request.headers = Object.assign(request.headers, { 'Content-Type': 'application/json' });
    this.debugSection('Request', JSON.stringify(request));

    let response;
    try {
      response = await axios(request);
    } catch (err) {
      if (!err.response) throw err;
      this.debugSection('Response', `Response error. Status code: ${err.response.status}`);
      response = err.response;
    }
    this.debugSection('Response', JSON.stringify(response.data));
    return response;
  }

  async sendQuery(url, operation, headers) {
    const request = {
      baseURL: this._url(url),
      method: 'POST',
      data: operation,
      headers,
    };

    return this._executeRequest(request);
  }
}
module.exports = Graphql;
