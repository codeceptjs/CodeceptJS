const path = require('path')

const Helper = require('@codeceptjs/helper')
const GraphQL = require('./GraphQL')

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
 * I.mutateData('createUser', { name: 'davert', email: 'davert@mail.com' });
 * let user = await I.mutateData('createUser', { name: 'davert'});
 * I.mutateMultiple('createPost', 3, {post_id: user.id});
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
 * npm i rosie @faker-js/faker --save-dev
 * ```
 *
 * Create a factory file for a resource.
 *
 * See the example for Users factories:
 *
 * ```js
 * // tests/factories/users.js
 *
 * const { Factory } = require('rosie').Factory;
 * const { faker } = require('@faker-js/faker');
 *
 * // Used with a constructor function passed to Factory, so that the final build
 * // object matches the necessary pattern to be sent as the variables object.
 * module.exports = new Factory((buildObj) => ({
 *    input: { ...buildObj },
 * }))
 *    // 'attr'-id can be left out depending on the GraphQl resolvers
 *    .attr('name', () => faker.person.findName())
 *    .attr('email', () => faker.interact.email())
 * ```
 * For more options see [rosie documentation](https://github.com/rosiejs/rosie).
 *
 * Then configure GraphQLDataHelper to match factories and GraphQL schema:

 * ### Configuration
 *
 * GraphQLDataFactory has following config options:
 *
 * * `endpoint`: URL for the GraphQL server.
 * * `cleanup` (default: true): should inserted records be deleted up after tests
 * * `factories`: list of defined factories
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
 *      createUser: {
 *        query: 'mutation createUser($input: UserInput!) { createUser(input: $input) { id name }}',
 *        factory: './factories/users',
 *        revert: (data) => ({
 *          query: 'mutation deleteUser($id: ID!) { deleteUser(id: $id) }',
 *          variables: { id : data.id},
 *        }),
 *      },
 *    }
 * }
 * ```

 * It is required to set GraphQL `endpoint` which is the URL to which all the queries go to.
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
 * Factory contains operations -
 *
 * * `operation`: The operation/mutation that needs to be performed for creating a record in the backend.
 *
 * Each operation must have the following:
 *
 * * `query`: The mutation(query) string. It is expected to use variables to send data with the query.
 * * `factory`: The path to factory file. The object built by the factory in this file will be passed
 *    as the 'variables' object to go along with the mutation.
 * * `revert`: A function called with the data returned when an item is created. The object returned by
 *    this function is will be used to later delete the items created. So, make sure RELEVANT DATA IS RETURNED
 *    when a record is created by a mutation.
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
 * By default `I.mutateData()` returns a promise with created data as specified in operation query string:
 *
 * ```js
 * let client = await I.mutateData('createClient');
 * ```
 *
 * Data of created records are collected and used in the end of a test for the cleanup.
 *
 * ## Methods
 */
class GraphQLDataFactory extends Helper {
  constructor(config) {
    super(config)

    const defaultConfig = {
      cleanup: true,
      GraphQL: {},
      factories: {},
    }
    this.config = Object.assign(defaultConfig, this.config)

    if (this.config.headers) {
      this.config.GraphQL.defaultHeaders = this.config.headers
    }
    if (this.config.onRequest) {
      this.config.GraphQL.onRequest = this.config.onRequest
    }
    this.graphqlHelper = new GraphQL(Object.assign(this.config.GraphQL, { endpoint: this.config.endpoint }))
    this.factories = this.config.factories

    this.created = {}
    Object.keys(this.factories).forEach(f => (this.created[f] = []))
  }

  static _checkRequirements() {
    try {
      require('axios')
      require('rosie')
    } catch (e) {
      return ['axios', 'rosie']
    }
  }

  _after() {
    if (!this.config.cleanup) {
      return Promise.resolve()
    }
    const promises = []
    // clean up all created items
    for (const mutationName in this.created) {
      const createdItems = this.created[mutationName]
      if (!createdItems.length) continue
      this.debug(`Deleting ${createdItems.length} ${mutationName}(s)`)
      for (const itemData of createdItems) {
        promises.push(this._requestDelete(mutationName, itemData))
      }
    }
    return Promise.all(promises)
  }

  /**
   * Generates a new record using factory, sends a GraphQL mutation to store it.
   *
   * ```js
   * // create a user
   * I.mutateData('createUser');
   * // create user with defined email
   * // and receive it when inside async function
   * const user = await I.mutateData('createUser', { email: 'user@user.com'});
   * ```
   *
   * @param {string} operation to be performed
   * @param {*} params predefined parameters
   */
  mutateData(operation, params) {
    const variables = this._createItem(operation, params)
    this.debug(`Creating ${operation} ${JSON.stringify(variables)}`)
    return this._requestCreate(operation, variables)
  }

  /**
   * Generates bunch of records and sends multiple GraphQL mutation requests to store them.
   *
   * ```js
   * // create 3 users
   * I.mutateMultiple('createUser', 3);
   *
   * // create 3 users of same age
   * I.mutateMultiple('createUser', 3, { age: 25 });
   * ```
   *
   * @param {string} operation
   * @param {number} times
   * @param {*} params
   */
  mutateMultiple(operation, times, params) {
    const promises = []
    for (let i = 0; i < times; i++) {
      promises.push(this.mutateData(operation, params))
    }
    return Promise.all(promises)
  }

  _createItem(operation, data) {
    if (!this.factories[operation]) {
      throw new Error(`Mutation ${operation} is not defined in config.factories`)
    }
    let modulePath = this.factories[operation].factory
    try {
      try {
        require.resolve(modulePath)
      } catch (e) {
        modulePath = path.join(global.codecept_dir, modulePath)
      }
      const builder = require(modulePath)
      return builder.build(data)
    } catch (err) {
      throw new Error(`Couldn't load factory file from ${modulePath}, check that

          "factories": {
            "${operation}": {
              "factory": "./path/to/factory"

        points to valid factory file.
        Factory file should export an object with build method.

        Current file error: ${err.message}`)
    }
  }

  /**
   * Executes request to create a record to the GraphQL endpoint.
   * Can be replaced from a custom helper.
   *
   * @param {string} operation
   * @param {*} variables to be sent along with the query
   */
  _requestCreate(operation, variables) {
    const { query } = this.factories[operation]
    return this.graphqlHelper.sendMutation(query, variables).then(response => {
      const data = response.data.data[operation]
      this.created[operation].push(data)
      this.debugSection('Created', `record: ${data}`)
      return data
    })
  }

  /**
   * Executes request to delete a record to the GraphQL endpoint.
   * Can be replaced from a custom helper.
   *
   * @param {string} operation
   * @param {*} data of the record to be deleted.
   */
  _requestDelete(operation, data) {
    const deleteOperation = this.factories[operation].revert(data)
    const { query, variables } = deleteOperation

    return this.graphqlHelper.sendMutation(query, variables).then(response => {
      const idx = this.created[operation].indexOf(data)
      this.debugSection('Deleted', `record: ${response.data.data}`)
      this.created[operation].splice(idx, 1)
    })
  }
}

module.exports = GraphQLDataFactory
