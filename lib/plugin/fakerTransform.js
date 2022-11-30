const { faker } = require('@faker-js/faker');
const transform = require('../transform');

/**
 * Use the [faker.js](https://www.npmjs.com/package/faker) package to generate fake data inside examples on your gherkin tests
 *
 * ![Faker.js](https://raw.githubusercontent.com/Marak/faker.js/master/logo.png)
 *
 * #### Usage
 *
 * To start please install `faker.js` package
 *
 * ```
 * npm install -D faker
 * ```
 *
 * ```
 * yarn add -D faker
 * ```
 *
 * Add this plugin to config file:
 *
 * ```js
 * plugins: {
 *    fakerTransform: {
 *      enabled: true
 *    }
 * }
 * ```
 *
 * Add the faker API using a mustache string format inside examples tables in your gherkin scenario outline
 *
 * ```feature
 * Scenario Outline: ...
 *             Given ...
 *              When ...
 *              Then ...
 *         Examples:
 *   | productName          | customer              | email              | anythingMore |
 *   | {{commerce.product}} | Dr. {{name.findName}} | {{internet.email}} | staticData   |
 * ```
 *
 */
module.exports = function (config) {
  transform.addTransformerBeforeAll('gherkin.examples', (value) => {
    if (typeof value === 'string' && value.length > 0) {
      return faker.helpers.fake(value);
    }
    return value;
  });
};
