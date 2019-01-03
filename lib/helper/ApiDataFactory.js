const path = require('path');
const requireg = require('requireg');
const Helper = require('../helper');
const REST = require('./REST');

/**
 * Helper for managing remote data using REST API.
 * Uses data generators like [rosie](https://github.com/rosiejs/rosie) or factory girl to create new record.
 *
 * By defining a factory you set the rules of how data is generated.
 * This data will be saved on server via REST API and deleted in the end of a test.
 *
 * ## Use Case
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
 * let id = await I.have('post', { title: 'My first post'});
 * I.haveMultiple('comment', 3, {post_id: id});
 * ```
 *
 * To make this work you need
 *
 * 1. REST API endpoint which allows to perform create / delete requests and
 * 2. define data generation rules
 *
 * ### Setup
 *
 * Install [Rosie](https://github.com/rosiejs/rosie) and [Faker](https://www.npmjs.com/package/faker) libraries.
 *
 * ```sh
 * npm i rosie faker --save-dev`
 * ```
 *
 * Create a factory file for a resource.
 *
 * See the example for Posts factories:
 *
 * ```js
 * // tests/factories/posts.js
 *
 * var Factory = require('rosie').Factory;
 * var faker = require('faker');
 *
 * module.exports = new Factory()
 *    // no need to set id, it will be set by REST API
 *    .attr('author', () => faker.name.findName())
 *    .attr('title', () => faker.lorem.sentence())
 *    .attr('body', () => faker.lorem.paragraph());
 * ```
 * For more options see [rosie documentation](https://github.com/rosiejs/rosie).
 *
 * Then configure ApiDataHelper to match factories and REST API:

 * ### Configuration
 *
 * ApiDataFactory has following config options:
 *
 * * `endpoint`: base URL for the API to send requests to.
 * * `cleanup` (default: true): should inserted records be deleted up after tests
 * * `factories`: list of defined factories
 * * `returnId` (default: false): return id instead of a complete response when creating items.
 * * `REST`: configuration for REST requests
 *
 * See the example:
 *
 * ```js
 *  ApiDataFactory: {
 *    endpoint: "http://user.com/api",
 *    cleanup: true,
 *    factories: {
 *      post: {
 *        uri: "/posts",
 *        factory: "./factories/post",
 *      },
 *      comment: {
 *        factory: "./factories/comment",
 *        create: { post: "/comments/create" },
 *        delete: { post: "/comments/delete/{id}" },
 *        fetchId: (data) => data.result.id
 *      }
 *    }
 * }
 * ```

 * It is required to set REST API `endpoint` which is the baseURL for all API requests.
 * Factory file is expected to be passed via `factory` option.
 *
 * This Helper uses [REST](http://codecept.io/helpers/REST/) helper and accepts its configuration in "REST" section.
 * So, in order to set default headers or timeout you should add:
 *
 * ```js
 * "ApiDataFactory": {
 *    "REST": {
 *      "timeout": "100000",
 *      "defaultHeaders": {
 *        "auth": "111111"
 *      }
 *   }
 * }
 * ```
 *
 * ### Requests
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
 * This behavior can be configured with following options:
 *
 * * `uri`: set different resource uri. Example: `uri: account` => `http://app.com/api/account`.
 * * `create`: override create options. Expected format: `{ method: uri }`. Example: `{ "post": "/users/create" }`
 * * `delete`: override delete options. Expected format: `{ method: uri }`. Example: `{ "post": "/users/delete/{id}" }`
 *
 * ### Responses
 *
 * By default `I.have()` returns a promise with a created data:
 *
 * ```js
 * let client = await I.have('client');
 * ```
 *
 * Ids of created records are collected and used in the end of a test for the cleanup.
 * If you need to receive `id` instead of full response enable `returnId` in a helper config:
 *
 * ```js
 * // returnId: false
 * let clientId = await I.have('client');
 * // clientId == 1
 *
 * // returnId: true
 * let clientId = await I.have('client');
 * // client == { name: 'John', email: 'john@snow.com' }
 * ```
 *
 * By default `id` property of response is taken. This behavior can be changed by setting `fetchId` function in a factory config.
 *
 *
 * ```js
 *    factories: {
 *      post: {
 *        uri: "/posts",
 *        factory: "./factories/post",
 *        fetchId: (data) => data.result.posts[0].id
 *      }
 *    }
 * ```
 *
 *
 * ## Methods
 */
class ApiDataFactory extends Helper {
  constructor(config) {
    super(config);

    const defaultConfig = {
      cleanup: true,
      REST: {},
      factories: {},
      returnId: false,
    };
    this.config = Object.assign(defaultConfig, this.config);

    this.restHelper = new REST(Object.assign(this.config.REST, { endpoint: this.config.endpoint }));
    this.factories = this.config.factories;

    for (const factory in this.factories) {
      const factoryConfig = this.factories[factory];
      if (!factoryConfig.uri && !factoryConfig.create) {
        throw new Error(`Uri for factory "${factory}" is not defined. Please set "uri" parameter:

    "factories": {
      "${factory}": {
        "uri": ...
`);
      }

      if (!factoryConfig.create) factoryConfig.create = { post: factoryConfig.uri };
      if (!factoryConfig.delete) factoryConfig.delete = { delete: `${factoryConfig.uri}/{id}` };

      this.factories[factory] = factoryConfig;
    }

    this.created = {};
    Object.keys(this.factories).forEach(f => this.created[f] = []);
  }

  static _checkRequirements() {
    try {
      requireg('axios');
      requireg('rosie');
    } catch (e) {
      return ['axios', 'rosie'];
    }
  }

  _after() {
    if (!this.config.cleanup) {
      return Promise.resolve();
    }
    const promises = [];

    // clean up all created items
    for (const factoryName in this.created) {
      const createdItems = this.created[factoryName];
      this.debug(`Deleting ${createdItems.length} ${factoryName}(s)`);
      for (const id in createdItems) {
        promises.push(this._requestDelete(factoryName, createdItems[id]));
      }
    }

    return Promise.all(promises);
  }

  /**
   * Generates a new record using factory and saves API request to store it.
   *
   * ```js
   * // create a user
   * I.have('user');
   * // create user with defined email
   * I.have('user', { email: 'user@user.com'});
   * ```
   *
   * @param {*} factory factory to use
   * @param {*} params predefined parameters
   */
  have(factory, params) {
    const item = this._createItem(factory, params);
    this.debug(`Creating ${factory} ${JSON.stringify(item)}`);
    return this._requestCreate(factory, item);
  }

  /**
   * Generates bunch of records and saves multiple API requests to store them.
   *
   * ```js
   * // create 3 posts
   * I.have('post', 3);
   *
   * // create 3 posts by one author
   * I.have('post', 3, { author: 'davert' });
   * ```
   *
   * @param {*} factory
   * @param {*} times
   * @param {*} params
   */
  haveMultiple(factory, times, params) {
    const promises = [];
    for (let i = 0; i < times; i++) {
      promises.push(this.have(factory, params));
    }
    return Promise.all(promises);
  }

  _createItem(model, data) {
    try {
      const path = this.factories[model].factory;
      const builder = require(path);
      return builder.build(data);
    } catch (err) {
      throw new Error(`Couldn't load factory file from ${path}, check that

  "factories": {
    "${model}": {
      "factory": "./path/to/factory"

points to valid factory file.
Factory file should export an object with build method.

Current file error: ${err.message}`);
    }
  }

  _fetchId(body, factory) {
    if (this.config.factories[factory].fetchId) {
      return this.config.factories[factory].fetchId(body);
    }
    if (body.id) return body.id;
    if (body[factory] && body[factory].id) return body[factory].id;
    return null;
  }

  /**
   * Executes request to create a record in API.
   * Can be replaced from a in custom helper.
   *
   * @param {*} factory
   * @param {*} data
   */
  _requestCreate(factory, data) {
    const method = Object.keys(this.factories[factory].create)[0];
    const url = this.factories[factory].create[method];
    const request = {
      baseURL: this.config.endpoint,
      method,
      url,
      data,
    };

    return this.restHelper._executeRequest(request).then((resp) => {
      const id = this._fetchId(resp.data, factory);
      this.created[factory].push(id);
      this.debugSection('Created', `Id: ${id}`);
      if (this.config.returnId) return id;
      return resp.data;
    });
  }

  /**
   * Executes request to delete a record in API
   * Can be replaced from a custom helper.
   *
   * @param {*} factory
   * @param {*} id
   */
  _requestDelete(factory, id) {
    const method = Object.keys(this.factories[factory].delete)[0];
    const url = this.factories[factory].delete[method].replace('{id}', id);
    const request = {
      baseURL: this.config.endpoint,
      method,
      url,
    };

    return this.restHelper._executeRequest(request).then(() => {
      const idx = this.created[factory].indexOf(id);
      this.debugSection('Deleted Id', `Id: ${id}`);
      this.created[factory].splice(idx, 1);
    });
  }
}

module.exports = ApiDataFactory;
