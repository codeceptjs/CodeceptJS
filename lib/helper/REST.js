const axios = require('axios').default;
const expect = require('chai').expect;

const Helper = require('../helper');

/**
 * REST helper allows to send additional requests to the REST API during acceptance tests.
 * [Axios](https://github.com/axios/axios) library is used to perform requests.
 *
 * ## Configuration
 *
 * * endpoint: API base URL
 * * timeout: timeout for requests in milliseconds. 10000ms by default
 * * defaultHeaders: a list of default headers
 * * onRequest: a async function which can update request object.
 *
 * ## Example
 *
 * ```js
 *{
 *   helpers: {
 *     REST: {
 *       endpoint: 'http://site.com/api',
 *       onRequest: (request) => {
 *       request.headers.auth = '123';
 *     }
 *   }
 *}
 * ```
 *
 * ## Access From Helpers
 *
 * Send REST requests by accessing `_executeRequest` method:
 *
 * ```js
 * this.helpers['REST']._executeRequest({
 *    url,
 *    data,
 * });
 * ```
 *
 * ## Methods
 */
class REST extends Helper {
  constructor(config) {
    super(config);
    this.options = {
      timeout: 10000,
      defaultHeaders: {},
      endpoint: '',
    };
    this.options = Object.assign(this.options, config);
    this.headers = { ...this.options.defaultHeaders };
    axios.defaults.headers = this.options.defaultHeaders;
  }

  static _checkRequirements() {
    try {
      require('axios');
    } catch (e) {
      return ['axios'];
    }
  }

  /**
   * Executes axios request
   *
   * @param {*} request
   */
  async _executeRequest(request) {
    axios.defaults.timeout = request.timeout || this.options.timeout;

    if (this.headers && this.headers.auth) {
      request.auth = this.headers.auth;
    }

    if ((typeof request.data) === 'string') {
      if (!request.headers || !request.headers['Content-Type']) {
        request.headers = { ...request.headers, ...{ 'Content-Type': 'application/x-www-form-urlencoded' } };
      }
    }

    if (this.config.onRequest) {
      await this.config.onRequest(request);
    }

    this.debugSection('Request', JSON.stringify(request));

    try {
      this.response = await axios(request);
    } catch (err) {
      if (!err.response) throw err;
      this.debugSection('Response', `Response error. Status code: ${err.response.status}`);
      this.response = err.response;
    }
    this.debugSection('Response', JSON.stringify(this.response.data));
    return this.response;
  }

  /**
   * Generates url based on format sent (takes endpoint + url if latter lacks 'http')
   *
   * @param {*} url
   */
  _url(url) {
    return /^\w+\:\/\//.test(url) ? url : this.options.endpoint + url;
  }

  /**
   * Set timeout for the request
   *
   * ```js
   * I.setRequestTimeout(10000); // In milliseconds
   * ```
   *
   */
  setRequestTimeout(newTimeout) {
    this.options.timeout = newTimeout;
  }

  /**
   * Send GET request to REST API
   *
   * ```js
   * I.sendGetRequest('/api/users.json');
   * ```
   *
   * @param {*} url
   * @param {object} [headers={}] - the headers object to be sent. By default it is sent as an empty object
   */
  async sendGetRequest(url, headers = {}) {
    const request = {
      baseURL: this._url(url),
      headers,
    };
    return this._executeRequest(request);
  }

  /**
   * Sends POST request to API.
   *
   * ```js
   * I.sendPostRequest('/api/users.json', { "email": "user@user.com" });
   * ```
   *
   * @param {*} url
   * @param {*} [payload={}] - the payload to be sent. By default it is sent as an empty object
   * @param {object} [headers={}] - the headers object to be sent. By default it is sent as an empty object
   */
  async sendPostRequest(url, payload = {}, headers = {}) {
    const request = {
      baseURL: this._url(url),
      method: 'POST',
      data: payload,
      headers,
    };

    return this._executeRequest(request);
  }

  /**
   * Sends PATCH request to API.
   *
   * ```js
   * I.sendPatchRequest('/api/users.json', { "email": "user@user.com" });
   * ```
   *
   * @param {string} url
   * @param {*} [payload={}] - the payload to be sent. By default it is sent as an empty object
   * @param {object} [headers={}] - the headers object to be sent. By default it is sent as an empty object
   */
  async sendPatchRequest(url, payload = {}, headers = {}) {
    const request = {
      baseURL: this._url(url),
      method: 'PATCH',
      data: payload,
      headers,
    };

    return this._executeRequest(request);
  }

  /**
   * Sends PUT request to API.
   *
   * ```js
   * I.sendPutRequest('/api/users.json', { "email": "user@user.com" });
   * ```
   *
   * @param {string} url
   * @param {*} [payload={}] - the payload to be sent. By default it is sent as an empty object
   * @param {object} [headers={}] - the headers object to be sent. By default it is sent as an empty object
   */
  async sendPutRequest(url, payload = {}, headers = {}) {
    const request = {
      baseURL: this._url(url),
      method: 'PUT',
      data: payload,
      headers,
    };

    return this._executeRequest(request);
  }

  /**
   * Sends DELETE request to API.
   *
   * ```js
   * I.sendDeleteRequest('/api/users/1');
   * ```
   *
   * @param {*} url
   * @param {object} [headers={}] - the headers object to be sent. By default it is sent as an empty object
   */
  async sendDeleteRequest(url, headers = {}) {
    const request = {
      baseURL: this._url(url),
      method: 'DELETE',
      headers,
    };

    return this._executeRequest(request);
  }


  /**
 * Checks if the response code is equal to what was provided
 *
 * ```js
 * I.seeResponseCode(200);
 * ```
 *
 * @param {string|number} statusCode
 */
  seeResponseCode(statusCode) {
    expect(this.response.status).to.equal(statusCode, `Status code ${this.response.status} of response is not equal to ${statusCode}`);
  }

  /**
   * Checks if the response code is not equal to what was provided
   *
   * ```js
   * I.dontSeeRepsonseCode(200);
   * ```
   *
   * @param {string|number} statusCode
   */
  dontSeeRepsonseCode(statusCode) {
    expect(this.response.status).to.not.equal(statusCode, `Status code ${this.response.status} of response is equal to ${statusCode}`);
  }

  /**
   * Checks if the response code is equal to Continue status code
   *
   * ```js
   * I.seeResponseCodeContinue();
   * ```
   */
  seeResponseCodeContinue() {
    expect(this.response.status).to.equal(100, 'Status code of response is not equal to 100');
  }

  /**
   * Checks if the response code is equal to Switching Protocol status code
   *
   * ```js
   * I.seeResponseCodeSwitchingProtocol();
   * ```
   */
  seeResponseCodeSwitchingProtocol() {
    expect(this.response.status).to.equal(101, 'Status code of response is not equal to 101');
  }

  /**
   * Checks if the response code is equal to Processing status code
   *
   * ```js
   * I.seeResponseCodeProcessing();
   * ```
   */
  seeResponseCodeProcessing() {
    expect(this.response.status).to.equal(102, 'Status code of response is not equal to 102');
  }

  /**
   * Checks if the response code is equal to Early Hints status code
   *
   * ```js
   * I.seeResponseCodeEarlyHints();
   * ```
   */
  seeResponseCodeEarlyHints() {
    expect(this.response.status).to.equal(103, 'Status code of response is not equal to 103');
  }

  /**
   * Checks if the response code is equal to OK status code
   *
   * ```js
   * I.seeResponseCodeOK();
   * ```
   */
  seeResponseCodeOK() {
    expect(this.response.status).to.equal(200, 'Status code of response is not equal to 200');
  }

  /**
   * Checks if the response code is equal to Created status code
   *
   * ```js
   * I.seeResponseCodeCreated();
   * ```
   */
  seeResponseCodeCreated() {
    expect(this.response.status).to.equal(201, 'Status code of response is not equal to 201');
  }

  /**
   * Checks if the response code is equal to Accepted status code
   *
   * ```js
   * I.seeResponseCodeAccepted();
   * ```
   */
  seeResponseCodeAccepted() {
    expect(this.response.status).to.equal(202, 'Status code of response is not equal to 202');
  }

  /**
   * Checks if the response code is equal to Non-Authoritative Information status code
   *
   * ```js
   * I.seeResponseCodeNonAuthoritativeInformation();
   * ```
   */
  seeResponseCodeNonAuthoritativeInformation() {
    expect(this.response.status).to.equal(203, 'Status code of response is not equal to 203');
  }

  /**
   * Checks if the response code is equal to No Content status code
   *
   * ```js
   * I.seeResponseCodeNoContent();
   * ```
   */
  seeResponseCodeNoContent() {
    expect(this.response.status).to.equal(204, 'Status code of response is not equal to 204');
  }

  /**
   * Checks if the response code is equal to No Content status code
   *
   * ```js
   * I.seeResponseCodeNoContent();
   * ```
   */
  seeResponseCodeResetContent() {
    expect(this.response.status).to.equal(205, 'Status code of response is not equal to 205');
  }

  /**
   * Checks if the response code is equal to Partial Content status code
   *
   * ```js
   * I.seeResponseCodePartialContent();
   * ```
   */
  seeResponseCodePartialContent() {
    expect(this.response.status).to.equal(206, 'Status code of response is not equal to 206');
  }

  /**
   * Checks if the response code is equal to Multi Status status code
   *
   * ```js
   * I.seeResponseCodeMultiStatus();
   * ```
   */
  seeResponseCodeMultiStatus() {
    expect(this.response.status).to.equal(207, 'Status code of response is not equal to 207');
  }

  /**
   * Checks if the response code is equal to Already Reported status code
   *
   * ```js
   * I.seeResponseCodeAlreadyReported();
   * ```
   */
  seeResponseCodeAlreadyReported() {
    expect(this.response.status).to.equal(208, 'Status code of response is not equal to 208');
  }

  /**
   * Checks if the response code is equal to I'm Used status code
   *
   * ```js
   * I.seeResponseCodeImUsed();
   * ```
   */
  seeResponseCodeImUsed() {
    expect(this.response.status).to.equal(226, 'Status code of response is not equal to 226');
  }

  /**
   * Checks if the response code is equal to Multiple Choices status code
   *
   * ```js
   * I.seeResponseCodeMultipleChoices();
   * ```
   */
  seeResponseCodeMultipleChoices() {
    expect(this.response.status).to.equal(300, 'Status code of response is not equal to 300');
  }

  /**
   * Checks if the response code is equal to Moved Permanelty status code
   *
   * ```js
   * I.seeResponseCodeMovedPermanelty();
   * ```
   */
  seeResponseCodeMovedPermanelty() {
    expect(this.response.status).to.equal(301, 'Status code of response is not equal to 301');
  }

  /**
   * Checks if the response code is equal to Found status code
   *
   * ```js
   * I.seeResponseCodeFound();
   * ```
   */
  seeResponseCodeFound() {
    expect(this.response.status).to.equal(302, 'Status code of response is not equal to 302');
  }

  /**
   * Checks if the response code is equal to See Other status code
   *
   * ```js
   * I.seeResponseCodeSeeOther();
   * ```
   */
  seeResponseCodeSeeOther() {
    expect(this.response.status).to.equal(303, 'Status code of response is not equal to 303');
  }

  /**
   * Checks if the response code is equal to Not Modified status code
   *
   * ```js
   * I.seeResponseCodeNotModified();
   * ```
   */
  seeResponseCodeNotModified() {
    expect(this.response.status).to.equal(304, 'Status code of response is not equal to 304');
  }

  /**
   * Checks if the response code is equal to Use Proxy status code
   *
   * ```js
   * I.seeResponseCodeUseProxy();
   * ```
   */
  seeResponseCodeUseProxy() {
    expect(this.response.status).to.equal(305, 'Status code of response is not equal to 305');
  }

  /**
   * Checks if the response code is equal to Temporary Redirect status code
   *
   * ```js
   * I.seeResponseCodeTemporaryRedirect();
   * ```
   */
  seeResponseCodeTemporaryRedirect() {
    expect(this.response.status).to.equal(307, 'Status code of response is not equal to 307');
  }

  /**
   * Checks if the response code is equal to Permanent Redirect status code
   *
   * ```js
   * I.seeResponseCodePermanentRedirect();
   * ```
   */
  seeResponseCodePermanentRedirect() {
    expect(this.response.status).to.equal(308, 'Status code of response is not equal to 308');
  }

  /**
   * Checks if the response code is equal to Bad Request status code
   *
   * ```js
   * I.seeResponseCodeBadRequest();
   * ```
   */
  seeResponseCodeBadRequest() {
    expect(this.response.status).to.equal(400, 'Status code of response is not equal to 400');
  }

  /**
   * Checks if the response code is equal to Unauthorized status code
   *
   * ```js
   * I.seeResponseCodeUnauthorized();
   * ```
   */
  seeResponseCodeUnauthorized() {
    expect(this.response.status).to.equal(401, 'Status code of response is not equal to 401');
  }

  /**
   * Checks if the response code is equal to Payment Required status code
   *
   * ```js
   * I.seeResponseCodePaymentRequired();
   * ```
   */
  seeResponseCodePaymentRequired() {
    expect(this.response.status).to.equal(402, 'Status code of response is not equal to 402');
  }

  /**
   * Checks if the response code is equal to Forbidden status code
   *
   * ```js
   * I.seeResponseCodeForbidden();
   * ```
   */
  seeResponseCodeForbidden() {
    expect(this.response.status).to.equal(403, 'Status code of response is not equal to 403');
  }

  /**
   * Checks if the response code is equal to Not Found status code
   *
   * ```js
   * I.seeResponseCodeNotFound();
   * ```
   */
  seeResponseCodeNotFound() {
    expect(this.response.status).to.equal(404, 'Status code of response is not equal to 404');
  }

  /**
   * Checks if the response code is equal to Method Not Allowed status code
   *
   * ```js
   * I.seeResponseCodeMethodNotAllowed();
   * ```
   */
  seeResponseCodeMethodNotAllowed() {
    expect(this.response.status).to.equal(405, 'Status code of response is not equal to 405');
  }

  /**
   * Checks if the response code is equal to Not Acceptable status code
   *
   * ```js
   * I.seeResponseCodeNotAcceptable();
   * ```
   */
  seeResponseCodeNotAcceptable() {
    expect(this.response.status).to.equal(406, 'Status code of response is not equal to 406');
  }

  /**
   * Checks if the response code is equal to Proxy Authentication Required status code
   *
   * ```js
   * I.seeResponseCodeProxyAuthenticationRequired();
   * ```
   */
  seeResponseCodeProxyAuthenticationRequired() {
    expect(this.response.status).to.equal(407, 'Status code of response is not equal to 407');
  }

  /**
   * Checks if the response code is equal to Request Timeout status code
   *
   * ```js
   * I.seeResponseCodeRequestTimeout();
   * ```
   */
  seeResponseCodeRequestTimeout() {
    expect(this.response.status).to.equal(408, 'Status code of response is not equal to 408');
  }

  /**
   * Checks if the response code is equal to Conflict status code
   *
   * ```js
   * I.seeResponseCodeConflict();
   * ```
   */
  seeResponseCodeConflict() {
    expect(this.response.status).to.equal(409, 'Status code of response is not equal to 409');
  }

  /**
   * Checks if the response code is equal to Gone status code
   *
   * ```js
   * I.seeResponseCodeGone();
   * ```
   */
  seeResponseCodeGone() {
    expect(this.response.status).to.equal(410, 'Status code of response is not equal to 410');
  }

  /**
   * Checks if the response code is equal to Length Required status code
   *
   * ```js
   * I.seeResponseCodeLengthRequired();
   * ```
   */
  seeResponseCodeLengthRequired() {
    expect(this.response.status).to.equal(411, 'Status code of response is not equal to 411');
  }

  /**
   * Checks if the response code is equal to Precondition Failed status code
   *
   * ```js
   * I.seeResponseCodePreconditionFailed();
   * ```
   */
  seeResponseCodePreconditionFailed() {
    expect(this.response.status).to.equal(412, 'Status code of response is not equal to 412');
  }

  /**
   * Checks if the response code is equal to Payload Too Large status code
   *
   * ```js
   * I.seeResponseCodePayloadTooLarge();
   * ```
   */
  seeResponseCodePayloadTooLarge() {
    expect(this.response.status).to.equal(413, 'Status code of response is not equal to 413');
  }

  /**
   * Checks if the response code is equal to URI Too Long status code
   *
   * ```js
   * I.seeResponseCodeURITooLong();
   * ```
   */
  seeResponseCodeURITooLong() {
    expect(this.response.status).to.equal(414, 'Status code of response is not equal to 414');
  }

  /**
   * Checks if the response code is equal to Unsupported Media Type status code
   *
   * ```js
   * I.seeResponseCodeUnsupportedMediaType();
   * ```
   */
  seeResponseCodeUnsupportedMediaType() {
    expect(this.response.status).to.equal(415, 'Status code of response is not equal to 415');
  }

  /**
   * Checks if the response code is equal to Range Not Satisfiable status code
   *
   * ```js
   * I.seeResponseCodeRangeNotSatisfiable();
   * ```
   */
  seeResponseCodeRangeNotSatisfiable() {
    expect(this.response.status).to.equal(416, 'Status code of response is not equal to 416');
  }

  /**
   * Checks if the response code is equal to Expectation Failed status code
   *
   * ```js
   * I.seeResponseCodeExpectationFailed();
   * ```
   */
  seeResponseCodeExpectationFailed() {
    expect(this.response.status).to.equal(417, 'Status code of response is not equal to 417');
  }

  /**
   * Checks if the response code is equal to I'm a Teapot status code
   *
   * ```js
   * I.seeResponseCodeImATeapot();
   * ```
   */
  seeResponseCodeImATeapot() {
    expect(this.response.status).to.equal(418, 'Status code of response is not equal to 418');
  }

  /**
   * Checks if the response code is equal to Misdirected Request status code
   *
   * ```js
   * I.seeResponseMisdirectedRequest();
   * ```
   */
  seeResponseMisdirectedRequest() {
    expect(this.response.status).to.equal(421, 'Status code of response is not equal to 421');
  }

  /**
   * Checks if the response code is equal to Unprocessable Entity status code
   *
   * ```js
   * I.seeResponseCodeUnprocessableEntity();
   * ```
   */
  seeResponseCodeUnprocessableEntity() {
    expect(this.response.status).to.equal(422, 'Status code of response is not equal to 422');
  }

  /**
   * Checks if the response code is equal to Locked status code
   *
   * ```js
   * I.seeResponseCodeLocked();
   * ```
   */
  seeResponseCodeLocked() {
    expect(this.response.status).to.equal(423, 'Status code of response is not equal to 423');
  }

  /**
   * Checks if the response code is equal to Failed Dependency status code
   *
   * ```js
   * I.seeResponseCodeFailedDependency();
   * ```
   */
  seeResponseCodeFailedDependency() {
    expect(this.response.status).to.equal(424, 'Status code of response is not equal to 424');
  }

  /**
   * Checks if the response code is equal to Too Early status code
   *
   * ```js
   * I.seeResponseCodeTooEarly();
   * ```
   */
  seeResponseCodeTooEarly() {
    expect(this.response.status).to.equal(425, 'Status code of response is not equal to 425');
  }

  /**
   * Checks if the response code is equal to Upgrade Required status code
   *
   * ```js
   * I.seeResponseCodeUpgradeRequired();
   * ```
   */
  seeResponseCodeUpgradeRequired() {
    expect(this.response.status).to.equal(426, 'Status code of response is not equal to 426');
  }

  /**
   * Checks if the response code is equal to Precondition Required status code
   *
   * ```js
   * I.seeResponseCodePreconditionRequired();
   * ```
   */
  seeResponseCodePreconditionRequired() {
    expect(this.response.status).to.equal(428, 'Status code of response is not equal to 428');
  }

  /**
   * Checks if the response code is equal to Too Many Requests status code
   *
   * ```js
   * I.seeResponseCodeTooManyRequests();
   * ```
   */
  seeResponseCodeTooManyRequests() {
    expect(this.response.status).to.equal(429, 'Status code of response is not equal to 429');
  }

  /**
   * Checks if the response code is equal to Request Header Fields Too Large status code
   *
   * ```js
   * I.seeResponseCodeRequestHeaderFieldsTooLarge();
   * ```
   */
  seeResponseCodeRequestHeaderFieldsTooLarge() {
    expect(this.response.status).to.equal(431, 'Status code of response is not equal to 431');
  }

  /**
   * Checks if the response code is equal to Unavailable For Legal Reasons status code
   *
   * ```js
   * I.seeResponseCodeUnavailableForLegalReasons();
   * ```
   */
  seeResponseCodeUnavailableForLegalReasons() {
    expect(this.response.status).to.equal(451, 'Status code of response is not equal to 451');
  }

  /**
   * Checks if the response code is equal to Internal Server Error status code
   *
   * ```js
   * I.seeResponseCodeInternalServerError();
   * ```
   */
  seeResponseCodeInternalServerError() {
    expect(this.response.status).to.equal(500, 'Status code of response is not equal to 500');
  }

  /**
   * Checks if the response code is equal to Not Implemented status code
   *
   * ```js
   * I.seeResponseCodeNotImplemented();
   * ```
   */
  seeResponseCodeNotImplemented() {
    expect(this.response.status).to.equal(501, 'Status code of response is not equal to 501');
  }

  /**
   * Checks if the response code is equal to Bad Gateway status code
   *
   * ```js
   * I.seeResponseCodeBadGateway();
   * ```
   */
  seeResponseCodeBadGateway() {
    expect(this.response.status).to.equal(502, 'Status code of response is not equal to 502');
  }

  /**
   * Checks if the response code is equal to Service Unavailable status code
   *
   * ```js
   * I.seeResponseCodeServiceUnavailable();
   * ```
   */
  seeResponseCodeServiceUnavailable() {
    expect(this.response.status).to.equal(503, 'Status code of response is not equal to 503');
  }

  /**
   * Checks if the response code is equal to Gateway Timeout status code
   *
   * ```js
   * I.seeResponseCodeGatewayTimeout();
   * ```
   */
  seeResponseCodeGatewayTimeout() {
    expect(this.response.status).to.equal(504, 'Status code of response is not equal to 504');
  }

  /**
   * Checks if the response code is equal to HTTP Version Not Supported status code
   *
   * ```js
   * I.seeResponseCodeHTTPVersionNotSupported();
   * ```
   */
  seeResponseCodeHTTPVersionNotSupported() {
    expect(this.response.status).to.equal(505, 'Status code of response is not equal to 505');
  }

  /**
   * Checks if the response code is equal to Variant Also Negotiates status code
   *
   * ```js
   * I.seeResponseCodeVariantAlsoNegotiates();
   * ```
   */
  seeResponseCodeVariantAlsoNegotiates() {
    expect(this.response.status).to.equal(506, 'Status code of response is not equal to 506');
  }

  /**
   * Checks if the response code is equal to Insufficient Storage status code
   *
   * ```js
   * I.seeResponseCodeInsufficientStorage();
   * ```
   */
  seeResponseCodeInsufficientStorage() {
    expect(this.response.status).to.equal(507, 'Status code of response is not equal to 507');
  }

  /**
   * Checks if the response code is equal to Loop Detected status code
   *
   * ```js
   * I.seeResponseCodeLoopDetected();
   * ```
   */
  seeResponseCodeLoopDetected() {
    expect(this.response.status).to.equal(508, 'Status code of response is not equal to 508');
  }

  /**
   * Checks if the response code is equal to Not Extended status code
   *
   * ```js
   * I.seeResponseCodeNotExtended();
   * ```
   */
  seeResponseCodeNotExtended() {
    expect(this.response.status).to.equal(510, 'Status code of response is not equal to 510');
  }

  /**
   * Checks if the response code is equal to Network Authentication Required status code
   *
   * ```js
   * I.seeResponseCodeNetworkAuthenticationRequired();
   * ```
   */
  seeResponseCodeNetworkAuthenticationRequired() {
    expect(this.response.status).to.equal(511, 'Status code of response is not equal to 511');
  }

  /**
   * Checks if the response code is an information response code by checking if its value is between 100-199
   *
   * ```js
   * I.seeInformationResponseCode();
   * ```
   */
  seeInformationResponseCode() {
    expect(this.response.status).to.be.above(99);
    expect(this.response.status).to.be.below(200);
  }

  /**
   * Checks if the response code is a sucessful response code by checking if its value is between 200-299
   *
   * ```js
   * I.seeSucessfulResponseCode();
   * ```
   */
  seeSucessfulResponseCode() {
    expect(this.response.status).to.be.above(199);
    expect(this.response.status).to.be.below(300);
  }

  /**
   * Checks if the response code is a redirect response code by checking if its value is between 300-399
   *
   * ```js
   * I.seeRedirectsResponseCode();
   * ```
   */
  seeRedirectsResponseCode() {
    expect(this.response.status).to.be.above(299);
    expect(this.response.status).to.be.below(400);
  }

  /**
   * Checks if the response code is an error response code by checking if its value is between 400-499
   *
   * ```js
   * I.seeClientErrorsStatusCode();
   * ```
   */
  seeClientErrorsStatusCode() {
    expect(this.response.status).to.be.above(399);
    expect(this.response.status).to.be.below(500);
  }

  /**
   * Checks if the response code is a server error response code by checking if its value is between 500-599
   *
   * ```js
   * I.seeClientErrorsStatusCode();
   * ```
   */
  seeServerErrorsResponseCode() {
    expect(this.response.status).to.be.above(499);
    expect(this.response.status).to.be.below(600);
  }

  /**
   * Checks if a header exists on the request and optionally checks the header's value
   *
   * ```js
   * I.seeHeader('Content-Type');
   * I.seeHeader('Content-Type', 'application/json');
   * ```
   *
   * @param {string} key
   * @param {string} [value=undefined]
   */
  seeHeader(key, value = undefined) {
    expect(this.response.headers).to.have.property(key);
    if (value) {
      expect(this.response.headers[key]).to.equal(value);
    }
  }

  /**
   * Checks if a header does not exist on the request
   *
   * ```js
   * I.dontSeeHeader('Content-Type');
   * ```
   *
   * @param {string} key
   */
  dontSeeHeader(key) {
    expect(this.response.headers).to.not.have.property(key);
  }

  /**
   * Returns the header from the request using the specified key
   *
   * ```js
   * I.grabHeader('Content-Type');
   * ```
   *
   * @param {string} key
   */
  grabHeader(key) {
    return this.headers[key];
  }

  /**
   * Sets an HTTP header on the request to be used in all subsequent requests
   *
   * ```js
   * I.setHeader('Content-Type', 'application/json');
   * ```
   *
   * @param {string} key
   */
  setHeader(key, value) {
    this.headers[key] = value;
  }

  /**
   * Removes an HTTP header from the request and will be removed for all subsequent requests
   *
   * ```js
   * I.removeHeader('Content-Type');
   * ```
   *
   * @param {string} key
   */
  removeHeader(key) {
    delete this.headers[key];
  }

  /**
   * Checks that the response body is equal to the provided object
   *
   * ```js
   * I.receivedCorrectResponseBody({a: 1, b: 2});
   * ```
   *
   * @param {string} obj
   */
  receivedCorrectResponseBody(obj) {
    expect(obj).to.deep.equal(this.response.data);
  }
}
module.exports = REST;
