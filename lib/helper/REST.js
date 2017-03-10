'user strict';
const Helper = require('../helper');
const requireg = require('requireg');
let unirest = requireg('unirest');

/**
 * REST helper
 * --------
 *
 * Gives **CodeceptJs** the ability to execute RESTful API calls, helps to create web service tests also to combine API calls with WebDriverIO / SeleniumWebDriver tests.
 * Currently this is under development phase.
 * Please visit our [demo repo](https://github.com/DigitalOnUs/codeceptjs-poc/tree/master/tests/REST#using-rest-api-on-codeceptjs) to know how to use this Helper.
 *
 *
 * ### Configuration:
 *
 * To configure this wrapper you can use the endpoint property on codecept configuration file.
 *
 * #### Endpoint config:
 *
 * For this you need to specify on the module configuration the endpoint is going to be used.
 * This is an optional property.
 * ```javascript
 * "REST": {
 *   "endpoint": "http://api.mysite.com/v1"
 *   }
 * ```
 *
 * Then use the Codecept wrapper at Scenario level
 * ```javascript
 * let Request = yield I.generateRequest('GET','/users')
 * // This generate a Request object which is able to do a GET call to "http://api.mysite.com/v1/users"
 * ```
 *
 * #### No Endpoint but Absolute URL:
 * ```javascript
 * let Request = yield I.generateRequest('GET','http://hostname/user/1')
 * ```
 *
 *
 * We are using [UNIREST](http://unirest.io/nodejs.html#request) library to execute API calls, so a `Request` object is returned, check out the documentation
 * to get more details on how it works.
 *
 * ### Usage:
 * #### Example using chainable unirest methods.
 *
 * This example comes from unirest library but we adapted to allow you to check the behavior using Codecept.
 *
 * ```javascript
 * let Request = yield I.generateRequest('POST','http://mockbin.com/request')
 *
 * Request
 * .headers({'Accept': 'application/json', 'Content-Type': 'application/json'})
 * .send({ "parameter": 23, "foo": "bar" });
 *
 * let Response = yield I.executeRequest(Request);
 * ```
 *
 * ##### I.executeRequest(Request) method:
 *
 * Returns a Response object from UNIREST library, this help us to avoid asyncronism and let us handle better Request objects (also from UNIREST).
 *
 * ```
 * let response = yield I.executeRequest(Request);
 * assert.equal(response.status, 200);
 * ```
 *
 *
 * ### Available methods:
 *
 * GET, HEAD, POST, PUT, PATCH, DELETE.
 */
class REST extends Helper {

  constructor(config) {
    super(config);
    unirest = requireg('unirest');
    this.options = {
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

  generateRequest(method, url) {
    let request;
    let absoluteUrl = this.options.endpoint + url;
    method = method.toUpperCase();

    switch (method) {
      case 'GET':
        request = unirest.get(absoluteUrl);
        break;
      case 'HEAD':
        request = unirest.head(absoluteUrl);
        break;
      case 'PUT':
        request = unirest.put(absoluteUrl);
        break;
      case 'POST':
        request = unirest.post(absoluteUrl);
        break;
      case 'PATCH':
        request = unirest.patch(absoluteUrl);
        break;
      case 'DELETE':
        request = unirest.delete(absoluteUrl);
        break;
      default:
        new Exception(`${method} is not a valid option for REST module`);
    }
    return request;
  }

  executeRequest(request) {
    return new Promise((resolve, reject) => {
      request
        .end((response) => {
          if (response.code >= 400) {
            return reject(response);
          }
          return resolve(response);
        });
    });
  }

}
module.exports = REST;
