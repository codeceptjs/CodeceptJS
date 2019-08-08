const path = require('path');
const requireg = require('requireg');
const Helper = require('../helper');
const GraphQL = require('./Graphql');

/**
 * Helper for managing remote data using GraphQL queries.
 * Uses data generators like [rosie](https://github.com/rosiejs/rosie) or factory girl to create new record.
 *
 * By defining a factory you set the rules of how data is generated.
 * This data will be saved on server via GraphQL queries and deleted in the end of a test.
 *
 * ## Use Case
 *
 * Acceptance tests interact with a websites using UI and real browser.
 * There is no way to create data for a specific test other than from user interface.
 * That makes tests slow and fragile. Instead of testing a single feature you need to follow all creation/removal process.
 *
 * This helper solves this problem.
 * If a web application has GraphQL support, it can be used to create and delete test records.
 * By combining GraphQL with Factories you can easily create records for tests:
 *
 * ```js
 * I.mutate('user', { login: 'davert', email: 'davert@mail.com' });
 * let id = await I.mutate('post', { title: 'My first post'});
 * I.mutateMultiple('comment', 3, {post_id: id});
 * ```
 *
 * To make this work you need
 *
 * 1. GraphQL endpoint which allows to perform create / delete requests and
 * 2. define data generation rules
 *
 * ### Setup
 *
 * Install [Rosie](https://github.com/rosiejs/rosie) and [Faker](https://www.npmjs.com/package/faker) libraries.
 *
 * ```sh
 * npm i rosie faker --save-dev
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
 *    // no need to set id, it will be set by GraphQL resolver
 *    .attr('author', () => faker.name.findName())
 *    .attr('title', () => faker.lorem.sentence())
 *    .attr('body', () => faker.lorem.paragraph());
 * ```
 * For more options see [rosie documentation](https://github.com/rosiejs/rosie).
 *
 * Then configure GraphQLDataHelper to match factories and GraphQL schema:

 * ### Configuration
 *
 * GraphQLDataFactory has following config options:
 *
 * * `endpoint`: base URL for the GraphQL server.
 * * `cleanup` (default: true): should inserted records be deleted up after tests
 * * `factories`: list of defined factories
 * * `returnId` (default: false): return id instead of a complete response when creating items.
 * * `headers`: list of headers
 * * `GraphQL`: configuration for GraphQL requests.
 *
 *
 * See the example:
 *
 * ```js
 *  GraphQLDataFactory: {
 *    endpoint: "http://user.com/graphql",
 *    cleanup: true,
 *    headers: {
 *      'Content-Type': 'application/json',
 *      'Accept': 'application/json',
 *    },
 *    factories: {
 *      createUser: { // should always return an id
 *        query: 'mutation createUser($input: UserInput!) { createUser(input: $input) { id name }}',
 *        factory: './factories/post',
 *        revert: (data) => ({
 *          query: ''mutation deleteUser($id: ID!) { deleteUser(id: $id) }',
 *          variables: { id : data.id},
 *        }),
 *      },
 *    }
 * }
 * ```

 * It is required to set GraphQL `endpoint` which is the baseURL to which all the queries go to.
 * Factory file is expected to be passed via `factory` option.
 *
 * This Helper uses [GraphQL](http://codecept.io/helpers/GraphQL/) helper and accepts its configuration in "GraphQL" section.
 * For instance, to set timeout you should add:
 *
 * ```js
 * "GraphQLDataFactory": {
 *    "GraphQL": {
 *      "timeout": "100000",
 *   }
 * }
 * ```
 *
 * ### Factory
 *
 * A factory should contain the following:
 *
 * * `operations`: This must include both `create` and `delete` operation.
 * * `factory`: The path of the module containing the factory.
 *
 * Further, each operation must have the following:
 *
 * * `query`: this is the mutation to be made. Should be a string.
 * * `operationName`: the name of the operation in the `query` above.
 * * `variablesObjectGenerator`: a function that takes the data generated and creates and object
 *      that can be passed as the `variables` for the given query. The data passed in case of delete
 *      is an object with only one field: id, i.e, `{ id }`.
 *
 * ### Requests
 *
 * Requests can be updated on the fly by using `onRequest` function. For instance, you can pass in current session from a cookie.
 *
 * ```js
 *  onRequest: async (request) => {
 *     // using global codeceptjs instance
 *     let cookie = await codeceptjs.container.helpers('WebDriver').grabCookie('session');
 *     request.headers = { Cookie: `session=${cookie.value}` };
 *   }
 * ```
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
 *
 * ## Methods
 */
class GraphQLDataFactory extends Helper {
  constructor(config) {
    super(config);

    const defaultConfig = {
      cleanup: true,
      GraphQL: {},
      factories: {},
      returnId: false,
    };
    this.config = Object.assign(defaultConfig, this.config);

    if (this.config.headers) {
      this.config.GraphQL.defaultHeaders = this.config.headers;
    }
    if (this.config.onRequest) {
      this.config.GraphQL.onRequest = this.config.onRequest;
    }
    this.graphqlHelper = new GraphQL(Object.assign(this.config.GraphQL, { endpoint: this.config.endpoint }));
    this.factories = this.config.factories;

    this.created = {};
    Object.keys(this.factories).forEach(f => (this.created[f] = []));
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
    for (const mutationName in this.created) {
      const createdItems = this.created[mutationName];
      if (!createdItems.length) continue;
      this.debug(`Deleting ${createdItems.length} ${mutationName}(s)`);
      for (const itemData of createdItems) {
        promises.push(this._requestDelete(mutationName, itemData));
      }
    }
    return Promise.all(promises);
  }

  /**
   * Generates a new record using factory sends a GraphQL mutation to store it.
   *
   * ```js
   * // create a user
   * I.mutate('createUser');
   * // create user with defined email
   * // and receive it when inside async function
   * const user = await I.mutate('createUser', { email: 'user@user.com'});
   * ```
   *
   * @param {*} operation to be performed
   * @param {*} params predefined parameters
   */
  mutate(operation, params) {
    const variables = this._createItem(operation, params);
    this.debug(`Creating ${operation} ${JSON.stringify(variables)}`);
    return this._requestCreate(operation, variables);
  }

  /**
   * Generates bunch of records and saves multiple GraphQL mutation requests to store them.
   *
   * ```js
   * // create 3 users
   * I.mutateMultiple('user', 3);
   *
   * // create 3 users by one name
   * I.mutateMultiple('user', 3, { author: 'davert' });
   * ```
   *
   * @param {*} operation
   * @param {*} times
   * @param {*} params
   */
  mutateMultiple(operation, times, params) {
    const promises = [];
    for (let i = 0; i < times; i++) {
      promises.push(this.mutate(operation, params));
    }
    return Promise.all(promises);
  }

  _createItem(operation, data) {
    if (!this.factories[operation]) {
      throw new Error(`Mutation ${operation} is not defined in config.factories`);
    }
    let modulePath = this.factories[operation].factory;
    try {
      try {
        require.resolve(modulePath);
      } catch (e) {
        modulePath = path.join(global.codecept_dir, modulePath);
      }
      const builder = require(modulePath);
      return builder.build(data);
    } catch (err) {
      throw new Error(`Couldn't load factory file from ${modulePath}, check that

          "factories": {
            "${operation}": {
              "factory": "./path/to/factory"

        points to valid factory file.
        Factory file should export an object with build method.

        Current file error: ${err.message}`);
    }
  }

  /**
   * Returns the id of the data item saved.
   *
   * @param {object} body data object that stores the returned data.
   * @param {*} factory factory to use
   * @param {*} op operation being performed, i.e, create, delete etc.
   */
  _fetchId(body, factory, op) {
    const { operationName } = this.factories[factory].operations[op];
    if (!operationName) {
      throw new Error(`operationName undefined for ${factory}.operations.${op}`);
    }
    const data = body[operationName];
    if (!data) {
      throw new Error(`No data found under ${operationName}, pls check if "operationName" matches the name in query`);
    }
    if (data.id) return data.id;
    if (data._id) return data._id;
    return null;
  }

  /**
   * Executes request to create a record to the GraphQL endpoint.
   * Can be replaced from a custom helper.
   *
   * @param {*} operation
   * @param {*} variables to be sent along with the query
   */
  _requestCreate(operation, variables) {
    const { query } = this.factories[operation];
    return this.graphqlHelper.sendMutation(query, variables).then((response) => {
      // const id = this._fetchId(response.data.data, factory, 'create');
      const data = response.data.data[operation];
      this.created[operation].push(data);
      this.debugSection('Created', `Id: ${data.id || data._id}`);
      return data;
    });
  }

  /**
   * Executes request to delete a record to the GraphQL endpoint.
   * Can be replaced from a custom helper.
   *
   * @param {*} operation
   * @param {*} data of the record to be deleted.
   */
  _requestDelete(operation, data) {
    const deleteOperation = this.factories[operation].revert(data);
    const { query, variables } = deleteOperation;

    return this.graphqlHelper.sendMutation(query, variables)
      .then((response) => {
        const idx = this.created[operation].indexOf(data);
        this.debugSection('Deleted Id', `Id: ${data.id || data._id}`);
        this.created[operation].splice(idx, 1);
      });
  }
}

module.exports = GraphQLDataFactory;
