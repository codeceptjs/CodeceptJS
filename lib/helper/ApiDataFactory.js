'use strict';
let Helper = require('../helper');
let fileExists = require('../utils').fileExists;
let fileIncludes = require('../assert/include').fileIncludes;
let fileEquals = require('../assert/equal').fileEquals;
let assert = require('assert');
let path = require('path');
let fs = require('fs');

/**
 * Helper for managing remote data using REST API.
 * Uses data generators like [rosie](https://github.com/rosiejs/rosie) or factory girl to create new record.
 *
 * By defining a factory you set the rules of how data is generated.
 * This data will be saved on server via REST API and deleted in the end of a test.
 *
 * ### Use Case
 *
 * Acceptance tests interact with a websites using UI and real browser.
 * There is no way to create data for a specific test other than from user interface.
 * That makes tests slow and fragile. Instead of testing a single feature you need to follow all creation/removal process.
 *
 * This helper solves this problem.
 * Most of web application have API, and it can be used to create and delete test records.
 * By combining REST API with Factories you can easily create records for tests:
 *
 * ```js
 * I.have('user', { login: 'davert', email: 'davert@mail.com' });
 * let id = yield I.have('post', { title: 'My first post'});
 * I.haveMultiple('comment', 3, {post_id: id});
 * ```
 *
 * To make this work you need
 *
 * 1. REST API endpoint which allows to perform create / delete requests and
 * 2. define data generation rules
 *
 *
 * ### Setup
 *
 * 1. install [rosie](https://github.com/rosiejs/rosie)
 *
 * ```
 * npm i rosie --save-dev`
 * ```
 *
 * 2. create a factory file for a resource
 * 3. define a rules for a factory (follow rosie documentation).
 * 4. configure ApiDataFactory.
 *
 * ### Configuration
 *
 * ```js
 *  "ApiDataFactory": {
 *    "endpoint": "http://user.com/api",
 *    "factories": {
 *      "user": {
 *         "uri": "/user"
 *         "factory": "./factories/post"
 *      },
 *      "post": {
 *        "factory": "./factories/post"
 *      },
 *      "comment": {
 *        "factory": "./factories/comment"
 *      }
 *    }
 * }
 * ```
 *
 * It is required to set REST API `endpoint` which is the baseUrl for all API requests.
 * Factories are listed, factory file is expcted to be passed via `factory` option.
 *
 *
 * ### Api Requests
 *
 * By default to create a record ApiDataFactory will use endpoint and plural factory name:
 *
 * * create: `POST {endpoint}/{resource} data`
 * * delete: `DELETE {endpoint}/{resource}/id`
 *
 * Example (`endpoint`: `http://app.com/api`):
 *
 * * create: POST request to `http://app.com/api/users`
 * * delete: DELETE request to `http://app.com/api/users/1`
 *
 * However this behavior can be configured with following options:
 *
 * * `uri`: set different resource uri. Example: `uri: account` => `http://app.com/api/account`.
 * * `create`: override create options. Expected format: `{ method: uri }`. Example: `{ "post": "/users/create" }`
 * * `delete`: override delete options. Expected format: `{ method: uri }`. Example: `{ "post": "/users/delete" }`
 *
 */
class ApiDataFactory extends Helper {

  constructor(config) {
    super(config);

    if (!this.config.url || !this.config.browser) {
      throw new Error();
    }

    this.factories = config.factories;

    this.created = {}
    Object.keys(this.factories).forEach((f) => this.created[f] = []);
  }

  static _checkRequirements()
  {
    try {
      requireg("request");
    } catch(e) {
      return ["request"];
    }
  }

  _before() {

  }

  _after() {
    let promises = [];

    // clean up all created items
    for(let factoryName in this.created) {
      this.debug(`Deleting ${this.created[factoryName].length} ${factoryName}(s)`);
      this.created[factoryName].forEach((id) => promises.push(this.requestDelete(factoryName, id)));
    }

    return Promise.all(promises);
  }

  have(factory, params) {
    let item = this._createItem(factory, params);
    this.debug(`Creating ${factory} `+JSON.stringify(item));
    return this.requestCreate(factory, item);
  }

  haveMultiple(factory, times, params) {
    let promises = [];
    for (let i = 0; i < times; i++) {
      promises.push(this.have(factory, params));
    }
    return Promise.all(promises);
  }

  _createItem(model, data) {
    try {
      let path = this.factories[model].factory
      let builder = require(path);
      return builder.build(data);
    } catch (err) {
      throw new Error(
`Couldn't load factory file from ${path}, check that

  factories: {
    ${model}: {
      factory: "./path/to/factory"

points to valid factory file.
Factory file should export an object with build method`);
    }
  }

  _urlForFactory(factory) {
    if (!this.factories[factory].uri) {
      this.factories[factory].uri = '/' + pluralize(factory);
    }
    return this.factories[factory].uri
  }

  _fetchId(body, factory) {
    if (this.config.fetchFn) {
      if (typeof this.config.fetchFn == 'string') {
        return require(this.config.fetchFn)(body, factory);
      }
      if (typeof this.config.fetchFn == 'function') {
        return this.config.fetchFn(body, factory);
      }
    }
    data = JSON.parse(body);
    return data[factory].id;
  }

  _requestCreate(factory, data) {
    let method = 'post';
    let url = this._urlForFactory(factory)
    if (this.config[factory].create) {
      method = Object.keys(this.config[factory].create)[0];
      url = this.config[factory].create[method];
    }

    return new Promise((doneFn, errFn) => {
      request(Object.assign(this.config.request, {
        baseUrl: this.config.endpoint,
        method,
        url,
        json: data,
      }), (err, httpResponse, body) => {
        if (err) {
          return errFn(er);
        }
        let id = this._fetchId(body, factory);
        this.created[factory].push(id);
        doneFn(id);
      });
    });
  }

  _requestDelete(factory, id) {

    let method = 'delete';
    let url = this._urlForFactory(factory)
    if (this.config[factory].delete) {
      method = Object.keys(this.config[factory].delete)[0];
      url = this.config[factory].delete[method];
    }

    return new Promise((doneFn, errFn) => {
      request(Object.assign(this.config.request, {
        baseUrl: this.config.endpoint,
        method,
        url: `${url}/${id}`,
        json: data,
      }), (err, httpResponse) => {
        if (err) {
          return errFn(er);
        }

        // remove from index
        let idx = this.created[factory].indexOf(id);
        this.created[factory].splice(idx, 1);
        doneFn();
      });
    });
  }
}

module.exports = ApiDataFactory;