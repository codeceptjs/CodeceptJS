---
permalink: /api
title: API Testing
---

## API Testing

CodeceptJS provides a way to write tests in declarative manner for REST and GraphQL APIs. 

Take a look:

```js
I.sendGetRequest('/users/1');
// returns { "user": { "name": "jon" }, "projects": [] }
I.seeResponseCodeIsSuccessful();
I.seeResponseContainsKeys(['user', 'projects']);
I.seeResponseContainsJson({ user: { name: 'jon' } });
I.seeResponseMatchesJsonSchema($ => {
  return $.object(
    user: $.object({
      name: $.string(),
    }),
    projects: $.array()
  )
});
```
In this code we checked API request for:

* status code
* data inclusion
* data structure

These are the things you should generally test your APIs for.

> 🤓 It is recommended to check only invariable parts of responses. Check for required fields and only values you control. For instance, it is not recommended to check id fields, date fields, as they can be frequently changed.

## Installation

Install CodeceptJS if it is not installed yet.

```
npm i codeceptjs --save-dev
```

Initialize CodeceptJS and select REST or GraphQL helper when asked for a helper:

```
npx codeceptjs init
```

## Configuration

Ensure that inside `codecept.conf.js` in helpers section `REST` or `GraphQL` helpers are enabled.

* If you use `REST` helper add `JSONResponse` helper below with no extra config:

```js
// inside codecept.conf.js
// ...
  helpers: {
    REST: {
      endpoint: 'http://localhost:3000/api'
    },
    // .. add JSONResponse helper here
    JSONResponse: {}
  }
```
* If you use `GraphQL` helper add `JSONResponse` helper, configuring it to use GraphQL for requests:

```js
  helpers: {
    GraphQL: {
      endpoint: 'http://localhost:3000/graphql'
    },
    // .. add JSONResponse helper here
    JSONResponse: {
      requestHelper: 'GraphQL',
    }
  }
```

Originally, REST and GraphQL helpers were not designed for API testing. 
They were used to perform API requests for browser tests. As so, they lack assertion methods to API responses.

[`JSONResponse`](/helpers/JSONResponse/) helper adds response assertions. 

> 💡 In CodeceptJS assertions start with `see` prefix. Learn more about assertions by [opening reference for JSONResponse](/helpers/JSONResponse/) helper.

Generate TypeScript definitions to get auto-completions for JSONResponse:

```
npx codeceptjs def
```

After helpers were configured and typings were generated, you can start writing first API test. By default, CodeceptJS saves tests in `tests` directory and uses `*_test.js` suffix. The `init` command created the first test for you to start.

> Check [API Examples](https://github.com/codeceptjs/api-examples) to see tests implementations.

## Requests

[REST](/helpers/REST/) or [GraphQL](/helpers/GraphQL/) helpers implement methods for making API requests.
Both helpers send requests via HTTP protocol from CodeceptJS process. 
For most cases, you will need to have authentication. It can be passed via headers, which can be added to helper's configuration in `codecept.conf.js`. 

```js
helpers: {
  REST: {
    defaultHeaders: {
      // use Bearer Authorization
      'Authorization': 'Bearer 11111',
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  }
}
```

Or you can use the browser cookies if you are running browser session.
In this case use `setSharedCookies()` from `@codeceptjs/configure` package:

```js
const { setSharedCookies } = require('@codeceptjs/configure');

// add this before exports.config
setSharedCookies();

exports.config = {
  // ...
  helpers: {  
    // also works with Playwright or Puppeteer
    WebDriver: {
      //... 
    },

    REST: { 
      // ...
    }
  }
}
```

### REST

REST helper can send GET/POST/PATCH/etc requests to REST API endpoint:

* [`I.sendGetRequest()`](/helpers/REST#sendGetRequest)
* [`I.sendPostRequest()`](/helpers/REST#sendPostRequest)
* [`I.sendPutRequest()`](/helpers/REST#sendPutRequest)
* [`I.sendPatchRequest()`](/helpers/REST#sendPatchRequest)
* [`I.sendDeleteRequest()`](/helpers/REST#sendDeleteRequest)
* ...

Authentication headers can be set in [helper's config](https://codecept.io/helpers/REST/#configuration) or per test with headers or special methods like `I.amBearerAuthenticated`.

Example:

```js
Feature('Users endpoint')

Scenario('create user', ({ I }) => {
    // this way we pass Bearer token
  I.amBearerAuthenticated(secret('token-is-here'));
  // for custom authorization with headers use
  // I.haveRequestHeaders method

  // here we send a POST request
  const response = await I.sendPostRequest('/users', {
    name: 'joe',
    email: 'joe@mail.com'
  });
  // usually we won't need direct access to response object for API testing 
  // but you can obtain it from request

  // check the last request was successful
  // this method introduced by JSONResponse helper
  I.seeResponseCodeIsSuccessful();
})
```

### GraphQL

GraphQL have request format different then in REST API, but the response format is the same.
It's plain old JSON. This why `JSONResponse` helper works for both API types.
Configure authorization headers in `codecept.conf.js` and make your first query:  

```js
Feature('Users endpoint')

Scenario('get user by query', ({ I }) => {
  // make GraphQL query or mutation
  const resp = await I.sendQuery('{ user(id: 0) { id name email }}');
  I.seeResponseCodeIsSuccessful();

  // GraphQL always returns key data as part of response
  I.seeResponseContainsKeys(['data']);

  // check data for partial inclusion
  I.seeResponseContainsJson({
    data: {
      user: {
        name: 'john doe',
        email: 'johnd@mutex.com',
      },
    },
  });
});
```

GraphQL helper has two methods available:

* [`I.sendQuery()`](/helpers/GraphQL#sendQuery)
* [`I.sendMutation()`](/helpers/GraphQL#sendMutation)

## Assertions

`JSONResponse` provides set of assertions for responses in JSON format. These assertions were designed to check only invariable parts of responses. So instead of checking that response equals to the one provided, we will check for data inclusion and structure matching.

For most of cases, you won't need to perform assertions by accessing `response` object directly. All assretions are performed under hood inside `JSONResponse` module. It is recommended to keep it that way, to keep tests readable and make test log to contain all assertions.

```js
Scenario('I make API call', ({ I }) => {
  // request was made by REST 
  // or by GraphQL helper

  // check that response code is 2xx
  I.seeResponseCodeIsSuccessful();

  // check that response contains keys
  I.seeResponseContainsKeys(['data', 'pages', 'meta']);
});
```

### Response Status Codes

[Response status codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status) can be checked to be equal to some value or to be in a specific range. 
To check that response code is `200` call `I.seeResponseCodeIs`:

```js
I.seeResponseCodeIs(200);
```
But because other response codes in 2xx range are also valid responses, you can use `seeResponseCodeIsSuccessful()` which will match 200 (OK), 201 (Created), 206 (Partial Content) and others. Methods to check 3xx, 4xx, 5xx response statuses also available.

```js
// matches 200, 201, 202, ... 206
I.seeResponseCodeIsSuccessful();

// matches 300...308
I.seeResponseCodeIsRedirection();

// matches 400..451
I.seeResponseCodeIsClientError();

// matches 500-511
I.seeResponseCodeIsServerError();
```

### Structure

The most basic thing to check in response is existence of keys in JSON object. Use [`I.seeResponseContainsKeys()`](/helpers/JSONResponse#seeResponseContainsKeys) method for it:

```js
// response is { "name": "joe", "email": "joe@joe.com" }
I.seeResponseContainsKeys(['name', 'email']);
```

However, this is a very naive approach. It won't work for arrays or nested objects.
To check complex JSON structures `JSONResponse` helper uses [`joi`](https://joi.dev) library. 
It has rich API to validate JSON by the schema defined using JavaScript. 

```js
// require joi library, 
// it is installed with CodeceptJS
const Joi = require('joi');

// create schema definition using Joi API
const schema = Joi.object().keys({
  email: Joi.string().email().required(),
  phone: Joi.string().regex(/^\d{3}-\d{3}-\d{4}$/).required(),
  birthday: Joi.date().max('1-1-2004').iso()
});

// check that response matches that schema
I.seeResponseMatchesJsonSchema(schema);
```

### Data Inclusion

To check that response contains expected data use `I.seeResponseContainsJson` method. 
It will check the response data for partial match. 

```js
I.seeResponseContainsJson({
  user: {
    email: 'user@user.com'
  }
})
```

To perform arbitrary assertions on a response object use `seeResponseValidByCallback`. 
It allows you to do any kind of assertions by using `expect` from [`chai`](https://www.chaijs.com) library.

```js
I.seeResponseValidByCallback({ data, status, expect } => {
  // we receive data and expect to combine them for good assertion
  expect(data.users.length).to.be.gte(10);
})
```

## Extending JSONResponse

To add more assertions it is recommended to create a custom helper.
Inside it you can get access to latest JSON response:

```js
// inside a custom helper
makeSomeCustomAssertion() {
  const response = this.helpers.JSONResponse.response;
}
```