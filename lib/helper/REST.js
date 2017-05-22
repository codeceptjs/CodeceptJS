'user strict';
const Helper = require('../helper');
const requireg = require('requireg');
let unirest = requireg('unirest');

/**
*REST helper
*--------
*
*Gives **CodeceptJs** the ability to execute RESTful API calls, helps to create web service tests also to combine API calls with WebDriverIO / SeleniumWebDriver tests.
*Currently under development phase.
*Please visit our [demo repo](https://github.com/DigitalOnUs/codeceptjs-poc/tree/master/tests/REST#using-rest-api-on-codeceptjs) to know how to use this Helper.
*
*
*### GET:
*
*There are two ways to use this wrapper, by setting an endpoint or giving an absolute URL.
*
*#### Absolute URL:
*```javascript
*let Request = I.sendRequest('GET','http://hostname/user/1')
*```
*
*#### Endpoint hit:
*
*For this you need to specify on the module configuration the endpoint is going to be used.
*```javascript
*"REST": {
*  "endpoint": "http://api.mysite.com/v1"
*  }
*```
*
*Then use the Codecept wrapper
*```javascript
*let Request = I.sendRequest('GET','/users')
*```
*
*We are using [UNIREST](http://unirest.io/nodejs.html#request) library to execute API calls, so a `Request` object is returned, check out the documentation
*to get more details on how it works.
*
*#### Example using chainable unirest methods.
*
*This example comes from unirest library but we adapted to allow you to check the behavior using Codecept.
*
*```javascript
*let Request = I.sendRequest('POST','http://mockbin.com/request')
*Request
*.headers({'Accept': 'application/json', 'Content-Type': 'application/json'})
*.send({ "parameter": 23, "foo": "bar" })
*.end(function (response) {
*  console.log(response.body);
*});
*```
*
*### Available methods:
*
*GET, HEAD, POST, PUT, PATCH, DELETE.
*
*Extra funcionality Cookie Jar, [read unirest doc about it](https://github.com/Mashape/unirest-nodejs#unirestjar)
*```javascript
*let cookie = I.createACookieJar('http://mockbin.com/request', 'key=value', '/');
*```
**/

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

  sendRequest(method, url){
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

  createACookieJar(url, pathname, cookie){
    let cookieJar = unirest.jar();
    CookieJar.add(cookie, pathname); // Cookie string, pathname / url
    return unirest.get(url).jar(cookieJar);
  }
}
module.exports = REST;
