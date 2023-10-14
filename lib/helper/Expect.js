const chai = require('chai');
const output = require('../output');

const { expect } = chai;

chai.use(require('chai-string'));
// @ts-ignore
chai.use(require('chai-exclude'));
chai.use(require('chai-match-pattern'));

/**
 * This helper allows performing assertions based on Chai.
 *
 * ### Examples
 *
 * Zero-configuration when paired with other helpers like REST, Playwright:
 *
 * ```js
 * // inside codecept.conf.js
 *{
 *   helpers: {
 *     Playwright: {...},
 *     ExpectHelper: {},
 *   }
 *}
 * ```
 *
 * ## Methods
 */
class ExpectHelper {
  /**
     *
     * @param {*} actualValue
     * @param {*} expectedValue
     * @param {*} customErrorMsg
     */
  expectEqual(actualValue, expectedValue, customErrorMsg = '') {
    // @ts-ignore
    output.step(`I expect "${JSON.stringify(actualValue)}" to equal "${JSON.stringify(expectedValue)}"`);
    return expect(actualValue, customErrorMsg).to.equal(expectedValue);
  }

  /**
     *
     * @param {*} actualValue
     * @param {*} expectedValue
     * @param {*} customErrorMsg
     */
  expectNotEqual(actualValue, expectedValue, customErrorMsg = '') {
    // @ts-ignore
    output.step(`I expect "${JSON.stringify(actualValue)}" to not equal "${JSON.stringify(expectedValue)}"`);
    return expect(actualValue, customErrorMsg).not.to.equal(expectedValue);
  }

  /**
     *
     * @param {*} actualValue
     * @param {*} expectedValue
     * @param {*} customErrorMsg

     */
  expectDeepEqual(actualValue, expectedValue, customErrorMsg = '') {
    // @ts-ignore
    output.step(`I expect "${JSON.stringify(actualValue)}" to deep equal "${JSON.stringify(expectedValue)}"`);
    return expect(actualValue, customErrorMsg).to.deep.equal(expectedValue);
  }

  /**
     *
     * @param {*} actualValue
     * @param {*} expectedValue
     * @param {*} customErrorMsg
     */
  expectNotDeepEqual(actualValue, expectedValue, customErrorMsg = '') {
    // @ts-ignore
    output.step(`I expect "${JSON.stringify(actualValue)}" to not deep equal "${JSON.stringify(expectedValue)}"`);
    return expect(actualValue, customErrorMsg).to.not.deep.equal(expectedValue);
  }

  /**
     *
     * @param {*} actualValue
     * @param {*} expectedValueToContain
     * @param {*} customErrorMsg
     */
  expectContain(actualValue, expectedValueToContain, customErrorMsg = '') {
    // @ts-ignore
    output.step(`I expect "${JSON.stringify(actualValue)}" to contain "${JSON.stringify(expectedValueToContain)}"`);
    return expect(actualValue, customErrorMsg).to.contain(
      expectedValueToContain,
    );
  }

  /**
     *
     * @param {*} actualValue
     * @param {*} expectedValueToNotContain
     * @param {*} customErrorMsg
     */
  expectNotContain(
    actualValue,
    expectedValueToNotContain,
    customErrorMsg = '',
  ) {
    // @ts-ignore
    output.step(`I expect "${JSON.stringify(actualValue)}" to not contain "${JSON.stringify(expectedValueToNotContain)}"`);
    return expect(actualValue, customErrorMsg).not.to.contain(
      expectedValueToNotContain,
    );
  }

  /**
     *
     * @param {*} actualValue
     * @param {*} expectedValueToStartWith
     * @param {*} customErrorMsg
     */
  expectStartsWith(actualValue, expectedValueToStartWith, customErrorMsg = '') {
    // @ts-ignore
    output.step(`I expect "${JSON.stringify(actualValue)}" to start with "${JSON.stringify(expectedValueToStartWith)}"`);
    return expect(actualValue, customErrorMsg).to.startsWith(
      expectedValueToStartWith,
    );
  }

  /**
     *
     * @param {*} actualValue
     * @param {*} expectedValueToNotStartWith
     * @param {*} customErrorMsg
     */
  expectNotStartsWith(
    actualValue,
    expectedValueToNotStartWith,
    customErrorMsg = '',
  ) {
    // @ts-ignore
    output.step(`I expect "${JSON.stringify(actualValue)}" to not start with "${JSON.stringify(expectedValueToNotStartWith)}"`);
    return expect(actualValue, customErrorMsg).not.to.startsWith(
      expectedValueToNotStartWith,
    );
  }

  /**
     * @param {*} actualValue
     * @param {*} expectedValueToEndWith
     * @param {*} customErrorMsg
     */
  expectEndsWith(actualValue, expectedValueToEndWith, customErrorMsg = '') {
    // @ts-ignore
    output.step(`I expect "${JSON.stringify(actualValue)}" to end with "${JSON.stringify(expectedValueToEndWith)}"`);
    return expect(actualValue, customErrorMsg).to.endsWith(
      expectedValueToEndWith,
    );
  }

  /**
     * @param {*} actualValue
     * @param {*} expectedValueToNotEndWith
     * @param {*} customErrorMsg
     */
  expectNotEndsWith(
    actualValue,
    expectedValueToNotEndWith,
    customErrorMsg = '',
  ) {
    // @ts-ignore
    output.step(`I expect "${JSON.stringify(actualValue)}" to not end with "${JSON.stringify(expectedValueToNotEndWith)}"`);
    return expect(actualValue, customErrorMsg).not.to.endsWith(
      expectedValueToNotEndWith,
    );
  }

  /**
     * @param {*} targetData
     * @param {*} jsonSchema
     * @param {*} customErrorMsg
     */
  expectJsonSchema(targetData, jsonSchema, customErrorMsg = '') {
    // @ts-ignore
    output.step(`I expect "${JSON.stringify(targetData)}" to match this JSON schema "${JSON.stringify(jsonSchema)}"`);
    chai.use(require('chai-json-schema'));
    return expect(targetData, customErrorMsg).to.be.jsonSchema(jsonSchema);
  }

  /**
     * @param {*} targetData
     * @param {*} jsonSchema
     * @param {*} customErrorMsg
     * @param {*} ajvOptions Pass AJV options
     */
  expectJsonSchemaUsingAJV(
    targetData,
    jsonSchema,
    customErrorMsg = '',
    ajvOptions = { allErrors: true },
  ) {
    // @ts-ignore
    output.step(`I expect "${JSON.stringify(targetData)}" to match this JSON schema using AJV "${JSON.stringify(jsonSchema)}"`);
    chai.use(require('chai-json-schema-ajv').create(ajvOptions));
    return expect(targetData, customErrorMsg).to.be.jsonSchema(jsonSchema);
  }

  /**
     * @param {*} targetData
     * @param {*} propertyName
     * @param {*} customErrorMsg
     */
  expectHasProperty(targetData, propertyName, customErrorMsg = '') {
    // @ts-ignore
    output.step(`I expect "${JSON.stringify(targetData)}" to have property: "${JSON.stringify(propertyName)}"`);
    return expect(targetData, customErrorMsg).to.have.property(propertyName);
  }

  /**
     * @param {*} targetData
     * @param {*} propertyName
     * @param {*} customErrorMsg
     */
  expectHasAProperty(targetData, propertyName, customErrorMsg = '') {
    // @ts-ignore
    output.step(`I expect "${JSON.stringify(targetData)}" to have a property: "${JSON.stringify(propertyName)}"`);
    return expect(targetData, customErrorMsg).to.have.a.property(propertyName);
  }

  /**
     * @param {*} targetData
     * @param {*} type
     * @param {*} customErrorMsg
     */
  expectToBeA(targetData, type, customErrorMsg = '') {
    // @ts-ignore
    output.step(`I expect "${JSON.stringify(targetData)}" to be a "${JSON.stringify(type)}"`);
    return expect(targetData, customErrorMsg).to.be.a(type);
  }

  /**
     * @param {*} targetData
     * @param {*} type
     * @param {*} customErrorMsg
     */
  expectToBeAn(targetData, type, customErrorMsg = '') {
    // @ts-ignore
    output.step(`I expect "${JSON.stringify(targetData)}" to be an "${JSON.stringify(type)}"`);
    return expect(targetData, customErrorMsg).to.be.an(type);
  }

  /**
     * @param {*} targetData
     * @param {*} regex
     * @param {*} customErrorMsg
     */
  expectMatchRegex(targetData, regex, customErrorMsg = '') {
    // @ts-ignore
    output.step(`I expect "${JSON.stringify(targetData)}" to match the regex "${JSON.stringify(regex)}"`);
    return expect(targetData, customErrorMsg).to.match(regex);
  }

  /**
     * @param {*} targetData
     * @param {*} length
     * @param {*} customErrorMsg
     */
  expectLengthOf(targetData, length, customErrorMsg = '') {
    // @ts-ignore
    output.step(`I expect "${JSON.stringify(targetData)}" to have length of "${JSON.stringify(length)}"`);
    return expect(targetData, customErrorMsg).to.have.lengthOf(length);
  }

  /**
     * @param {*} targetData
     * @param {*} customErrorMsg
     */
  expectEmpty(targetData, customErrorMsg = '') {
    // @ts-ignore
    output.step(`I expect "${JSON.stringify(targetData)}" to be empty`);
    return expect(targetData, customErrorMsg).to.be.empty;
  }

  /**
     * @param {*} targetData
     * @param {*} customErrorMsg
     */
  expectTrue(targetData, customErrorMsg = '') {
    // @ts-ignore
    output.step(`I expect "${JSON.stringify(targetData)}" to be true`);
    return expect(targetData, customErrorMsg).to.be.true;
  }

  /**
     * @param {*} targetData
     * @param {*} customErrorMsg
     */
  expectFalse(targetData, customErrorMsg = '') {
    // @ts-ignore
    output.step(`I expect "${JSON.stringify(targetData)}" to be false`);
    return expect(targetData, customErrorMsg).to.be.false;
  }

  /**
     * @param {*} targetData
     * @param {*} aboveThan number | Date
     * @param {*} customErrorMsg
     */
  expectAbove(targetData, aboveThan, customErrorMsg = '') {
    // @ts-ignore
    output.step(`I expect "${JSON.stringify(targetData)}" to be above ${JSON.stringify(aboveThan)}`);
    return expect(targetData, customErrorMsg).to.be.above(aboveThan);
  }

  /**
     * @param {*} targetData
     * @param {*} belowThan number | Date
     * @param {*} customErrorMsg
     */
  expectBelow(targetData, belowThan, customErrorMsg = '') {
    // @ts-ignore
    output.step(`I expect "${JSON.stringify(targetData)}" to be below ${JSON.stringify(belowThan)}`);
    return expect(targetData, customErrorMsg).to.be.below(belowThan);
  }

  /**
     * @param {*} targetData
     * @param {*} lengthAboveThan
     * @param {*} customErrorMsg
     */
  expectLengthAboveThan(targetData, lengthAboveThan, customErrorMsg = '') {
    // @ts-ignore
    output.step(`I expect "${JSON.stringify(targetData)}" to have length of above ${JSON.stringify(lengthAboveThan)}`);
    return expect(targetData, customErrorMsg).to.have.lengthOf.above(
      lengthAboveThan,
    );
  }

  /**
     * @param {*} targetData
     * @param {*} lengthBelowThan
     * @param {*} customErrorMsg
     */
  expectLengthBelowThan(targetData, lengthBelowThan, customErrorMsg = '') {
    // @ts-ignore
    output.step(`I expect "${JSON.stringify(targetData)}" to have length of below ${JSON.stringify(lengthBelowThan)}`);
    return expect(targetData, customErrorMsg).to.have.lengthOf.below(
      lengthBelowThan,
    );
  }

  /**
     * @param {*} actualValue
     * @param {*} expectedValue
     * @param {*} customErrorMsg
     */
  expectEqualIgnoreCase(actualValue, expectedValue, customErrorMsg = '') {
    // @ts-ignore
    output.step(`I expect and ingore case "${JSON.stringify(actualValue)}" to equal "${JSON.stringify(expectedValue)}"`);
    return expect(actualValue, customErrorMsg).to.equalIgnoreCase(
      expectedValue,
    );
  }

  /**
     * expects members of two arrays are deeply equal
     * @param {*} actualValue
     * @param {*} expectedValue
     * @param {*} customErrorMsg
     */
  expectDeepMembers(actualValue, expectedValue, customErrorMsg = '') {
    // @ts-ignore
    output.step(`I expect members of "${JSON.stringify(actualValue)}" and "${JSON.stringify(expectedValue)}" arrays are deeply equal`);
    return expect(actualValue, customErrorMsg).to.have.deep.members(
      expectedValue,
    );
  }

  /**
     * expects an array to be a superset of another array
     * @param {*} superset
     * @param {*} set
     * @param {*} customErrorMsg
     */
  expectDeepIncludeMembers(superset, set, customErrorMsg = '') {
    // @ts-ignore
    output.step(`I expect "${JSON.stringify(superset)}" array to be a superset of "${JSON.stringify(set)}" array`);
    return expect(superset, customErrorMsg).to.deep.include.members(
      set,
    );
  }

  /**
     * expects members of two JSON objects are deeply equal excluding some properties
     * @param {*} actualValue
     * @param {*} expectedValue
     * @param {*} fieldsToExclude
     * @param {*} customErrorMsg
     */
  expectDeepEqualExcluding(
    actualValue,
    expectedValue,
    fieldsToExclude,
    customErrorMsg = '',
  ) {
    // @ts-ignore
    output.step(`I expect members of "${JSON.stringify(actualValue)}" and "${JSON.stringify(expectedValue)}" JSON objects are deeply equal excluding properties: ${JSON.stringify(fieldsToExclude)}`);
    return expect(actualValue, customErrorMsg)
      .excludingEvery(fieldsToExclude)
      .to.deep.equal(expectedValue);
  }

  /**
     * expects a JSON object matches a provided pattern
     * @param {*} actualValue
     * @param {*} expectedPattern
     * @param {*} customErrorMsg
     */
  expectMatchesPattern(actualValue, expectedPattern, customErrorMsg = '') {
    // @ts-ignore
    output.step(`I expect "${JSON.stringify(actualValue)}" to match the ${JSON.stringify(expectedPattern)} pattern`);
    return expect(actualValue, customErrorMsg).to.matchPattern(expectedPattern);
  }
}

module.exports = ExpectHelper;
