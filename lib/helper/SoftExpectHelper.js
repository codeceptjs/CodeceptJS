const ExpectHelper = require('./ExpectHelper')

/**
 * SoftAssertHelper is a utility class for performing soft assertions.
 * Unlike traditional assertions that stop the execution on failure,
 * soft assertions allow the execution to continue and report all failures at the end.
 *
 * ### Examples
 *
 * Zero-configuration when paired with other helpers like REST, Playwright:
 *
 * ```js
 * // inside codecept.conf.js
 * {
 *   helpers: {
 *     Playwright: {...},
 *     SoftExpectHelper: {},
 *   }
 * }
 * ```
 *
 * ```js
 * // in scenario
 * I.softExpectEqual('a', 'b')
 * I.flushSoftAssertions() // Throws an error if any soft assertions have failed. The error message contains all the accumulated failures.
 * ```
 *
 * ## Methods
 */
class SoftAssertHelper extends ExpectHelper {
  constructor() {
    super()
    this.errors = []
  }

  /**
   * Performs a soft assertion by executing the provided assertion function.
   * If the assertion fails, the error is caught and stored without halting the execution.
   *
   * @param {Function} assertionFn - The assertion function to execute.
   * @param {string} [customErrorMsg=''] - A custom error message to display if the assertion fails.
   */
  softAssert(assertionFn, customErrorMsg = '') {
    try {
      assertionFn()
    } catch (error) {
      this.errors.push({ customErrorMsg, error })
    }
  }

  /**
   * Throws an error if any soft assertions have failed.
   * The error message contains all the accumulated failures.
   *
   * @throws {Error} If there are any soft assertion failures.
   */
  flushSoftAssertions() {
    if (this.errors.length > 0) {
      let errorMessage = 'Soft assertions failed:\n'
      this.errors.forEach((err, index) => {
        errorMessage += `\n[${index + 1}] ${err.customErrorMsg}\n${err.error.message}\n`
      })
      this.errors = []
      throw new Error(errorMessage)
    }
  }

  /**
   * Softly asserts that two values are equal.
   *
   * @param {*} actualValue - The actual value.
   * @param {*} expectedValue - The expected value.
   * @param {string} [customErrorMsg=''] - A custom error message to display if the assertion fails.
   */
  softExpectEqual(actualValue, expectedValue, customErrorMsg = '') {
    this.softAssert(() => this.expectEqual(actualValue, expectedValue, customErrorMsg), customErrorMsg)
  }

  /**
   * Softly asserts that two values are not equal.
   *
   * @param {*} actualValue - The actual value.
   * @param {*} expectedValue - The expected value.
   * @param {string} [customErrorMsg=''] - A custom error message to display if the assertion fails.
   */
  softExpectNotEqual(actualValue, expectedValue, customErrorMsg = '') {
    this.softAssert(() => this.expectNotEqual(actualValue, expectedValue, customErrorMsg), customErrorMsg)
  }

  /**
   * Softly asserts that two values are deeply equal.
   *
   * @param {*} actualValue - The actual value.
   * @param {*} expectedValue - The expected value.
   * @param {string} [customErrorMsg=''] - A custom error message to display if the assertion fails.
   */
  softExpectDeepEqual(actualValue, expectedValue, customErrorMsg = '') {
    this.softAssert(() => this.expectDeepEqual(actualValue, expectedValue, customErrorMsg), customErrorMsg)
  }

  /**
   * Softly asserts that two values are not deeply equal.
   *
   * @param {*} actualValue - The actual value.
   * @param {*} expectedValue - The expected value.
   * @param {string} [customErrorMsg=''] - A custom error message to display if the assertion fails.
   */
  softExpectNotDeepEqual(actualValue, expectedValue, customErrorMsg = '') {
    this.softAssert(() => this.expectNotDeepEqual(actualValue, expectedValue, customErrorMsg), customErrorMsg)
  }

  /**
   * Softly asserts that a value contains the expected value.
   *
   * @param {*} actualValue - The actual value.
   * @param {*} expectedValueToContain - The value that should be contained within the actual value.
   * @param {string} [customErrorMsg=''] - A custom error message to display if the assertion fails.
   */
  softExpectContain(actualValue, expectedValueToContain, customErrorMsg = '') {
    this.softAssert(() => this.expectContain(actualValue, expectedValueToContain, customErrorMsg), customErrorMsg)
  }

  /**
   * Softly asserts that a value does not contain the expected value.
   *
   * @param {*} actualValue - The actual value.
   * @param {*} expectedValueToNotContain - The value that should not be contained within the actual value.
   * @param {string} [customErrorMsg=''] - A custom error message to display if the assertion fails.
   */
  softExpectNotContain(actualValue, expectedValueToNotContain, customErrorMsg = '') {
    this.softAssert(() => this.expectNotContain(actualValue, expectedValueToNotContain, customErrorMsg), customErrorMsg)
  }

  /**
   * Softly asserts that a value starts with the expected value.
   *
   * @param {*} actualValue - The actual value.
   * @param {*} expectedValueToStartWith - The value that the actual value should start with.
   * @param {string} [customErrorMsg=''] - A custom error message to display if the assertion fails.
   */
  softExpectStartsWith(actualValue, expectedValueToStartWith, customErrorMsg = '') {
    this.softAssert(() => this.expectStartsWith(actualValue, expectedValueToStartWith, customErrorMsg), customErrorMsg)
  }

  /**
   * Softly asserts that a value does not start with the expected value.
   *
   * @param {*} actualValue - The actual value.
   * @param {*} expectedValueToNotStartWith - The value that the actual value should not start with.
   * @param {string} [customErrorMsg=''] - A custom error message to display if the assertion fails.
   */
  softExpectNotStartsWith(actualValue, expectedValueToNotStartWith, customErrorMsg = '') {
    this.softAssert(
      () => this.expectNotStartsWith(actualValue, expectedValueToNotStartWith, customErrorMsg),
      customErrorMsg,
    )
  }

  /**
   * Softly asserts that a value ends with the expected value.
   *
   * @param {*} actualValue - The actual value.
   * @param {*} expectedValueToEndWith - The value that the actual value should end with.
   * @param {string} [customErrorMsg=''] - A custom error message to display if the assertion fails.
   */
  softExpectEndsWith(actualValue, expectedValueToEndWith, customErrorMsg = '') {
    this.softAssert(() => this.expectEndsWith(actualValue, expectedValueToEndWith, customErrorMsg), customErrorMsg)
  }

  /**
   * Softly asserts that a value does not end with the expected value.
   *
   * @param {*} actualValue - The actual value.
   * @param {*} expectedValueToNotEndWith - The value that the actual value should not end with.
   * @param {string} [customErrorMsg=''] - A custom error message to display if the assertion fails.
   */
  softExpectNotEndsWith(actualValue, expectedValueToNotEndWith, customErrorMsg = '') {
    this.softAssert(
      () => this.expectNotEndsWith(actualValue, expectedValueToNotEndWith, customErrorMsg),
      customErrorMsg,
    )
  }

  /**
   * Softly asserts that the target data matches the given JSON schema.
   *
   * @param {*} targetData - The data to validate.
   * @param {Object} jsonSchema - The JSON schema to validate against.
   * @param {string} [customErrorMsg=''] - A custom error message to display if the assertion fails.
   */
  softExpectJsonSchema(targetData, jsonSchema, customErrorMsg = '') {
    this.softAssert(() => this.expectJsonSchema(targetData, jsonSchema, customErrorMsg), customErrorMsg)
  }

  /**
   * Softly asserts that the target data matches the given JSON schema using AJV.
   *
   * @param {*} targetData - The data to validate.
   * @param {Object} jsonSchema - The JSON schema to validate against.
   * @param {string} [customErrorMsg=''] - A custom error message to display if the assertion fails.
   * @param {Object} [ajvOptions={ allErrors: true }] - Options to pass to AJV.
   */
  softExpectJsonSchemaUsingAJV(targetData, jsonSchema, customErrorMsg = '', ajvOptions = { allErrors: true }) {
    this.softAssert(
      () => this.expectJsonSchemaUsingAJV(targetData, jsonSchema, customErrorMsg, ajvOptions),
      customErrorMsg,
    )
  }

  /**
   * Softly asserts that the target data has the specified property.
   *
   * @param {*} targetData - The data to check.
   * @param {string} propertyName - The property name to check for.
   * @param {string} [customErrorMsg=''] - A custom error message to display if the assertion
   fails. */ softExpectHasProperty(targetData, propertyName, customErrorMsg = '') {
    this.softAssert(() => this.expectHasProperty(targetData, propertyName, customErrorMsg), customErrorMsg)
  }

  /**
   Softly asserts that the target data has a property with the specified name.
   @param {*} targetData - The data to check.
   @param {string} propertyName - The property name to check for.
   @param {string} [customErrorMsg=''] - A custom error message to display if the assertion fails.
   */
  softExpectHasAProperty(targetData, propertyName, customErrorMsg = '') {
    this.softAssert(() => this.expectHasAProperty(targetData, propertyName, customErrorMsg), customErrorMsg)
  }

  /**
   Softly asserts that the target data is of a specific type.
   @param {*} targetData - The data to check.
   @param {string} type - The expected type (e.g., 'string', 'number').
   @param {string} [customErrorMsg=''] - A custom error message to display if the assertion fails. */
  softExpectToBeA(targetData, type, customErrorMsg = '') {
    this.softAssert(() => this.expectToBeA(targetData, type, customErrorMsg), customErrorMsg)
  }

  /**
   Softly asserts that the target data is of a specific type (alternative for articles).
   @param {*} targetData - The data to check.
   @param {string} type - The expected type (e.g., 'string', 'number').
   @param {string} [customErrorMsg=''] - A custom error message to display if the assertion fails. */
  softExpectToBeAn(targetData, type, customErrorMsg = '') {
    this.softAssert(() => this.expectToBeAn(targetData, type, customErrorMsg), customErrorMsg)
  }

  /*
   Softly asserts that the target data matches the specified regular expression.
   @param {*} targetData - The data to check.
   @param {RegExp} regex - The regular expression to match.
   @param {string} [customErrorMsg=''] - A custom error message to display if the assertion fails. */
  softExpectMatchRegex(targetData, regex, customErrorMsg = '') {
    this.softAssert(() => this.expectMatchRegex(targetData, regex, customErrorMsg), customErrorMsg)
  }

  /**
   Softly asserts that the target data has a specified length.
   @param {*} targetData - The data to check.
   @param {number} length - The expected length.
   @param {string} [customErrorMsg=''] - A custom error message to display if the assertion fails. */
  softExpectLengthOf(targetData, length, customErrorMsg = '') {
    this.softAssert(() => this.expectLengthOf(targetData, length, customErrorMsg), customErrorMsg)
  }

  /**

   Softly asserts that the target data is empty.
   @param {*} targetData - The data to check.
   @param {string} [customErrorMsg=''] - A custom error message to display if the assertion fails. */
  softExpectEmpty(targetData, customErrorMsg = '') {
    this.softAssert(() => this.expectEmpty(targetData, customErrorMsg), customErrorMsg)
  }

  /**

   Softly asserts that the target data is true.
   @param {*} targetData - The data to check.
   @param {string} [customErrorMsg=''] - A custom error message to display if the assertion fails. */
  softExpectTrue(targetData, customErrorMsg = '') {
    this.softAssert(() => this.expectTrue(targetData, customErrorMsg), customErrorMsg)
  }

  /**

   Softly asserts that the target data is false.
   @param {*} targetData - The data to check.
   @param {string} [customErrorMsg=''] - A custom error message to display if the assertion fails. */
  softExpectFalse(targetData, customErrorMsg = '') {
    this.softAssert(() => this.expectFalse(targetData, customErrorMsg), customErrorMsg)
  }

  /**

   Softly asserts that the target data is above a specified value.
   @param {*} targetData - The data to check.
   @param {*} aboveThan - The value that the target data should be above.
   @param {string} [customErrorMsg=''] - A custom error message to display if the assertion fails. */
  softExpectAbove(targetData, aboveThan, customErrorMsg = '') {
    this.softAssert(() => this.expectAbove(targetData, aboveThan, customErrorMsg), customErrorMsg)
  }

  /**

   Softly asserts that the target data is below a specified value.
   @param {*} targetData - The data to check.
   @param {*} belowThan - The value that the target data should be below.
   @param {string} [customErrorMsg=''] - A custom error message to display if the assertion fails. */
  softExpectBelow(targetData, belowThan, customErrorMsg = '') {
    this.softAssert(() => this.expectBelow(targetData, belowThan, customErrorMsg), customErrorMsg)
  }

  /**

   Softly asserts that the length of the target data is above a specified value.
   @param {*} targetData - The data to check.
   @param {number} lengthAboveThan - The length that the target data should be above.
   @param {string} [customErrorMsg=''] - A custom error message to display if the assertion fails. */
  softExpectLengthAboveThan(targetData, lengthAboveThan, customErrorMsg = '') {
    this.softAssert(() => this.expectLengthAboveThan(targetData, lengthAboveThan, customErrorMsg), customErrorMsg)
  }

  /**
   Softly asserts that the length of the target data is below a specified value.
   @param {*} targetData - The data to check.
   @param {number} lengthBelowThan - The length that the target data should be below.
   @param {string} [customErrorMsg=''] - A custom error message to display if the assertion fails. */
  softExpectLengthBelowThan(targetData, lengthBelowThan, customErrorMsg = '') {
    this.softAssert(() => this.expectLengthBelowThan(targetData, lengthBelowThan, customErrorMsg), customErrorMsg)
  }

  /**
   Softly asserts that two values are equal, ignoring case.
   @param {string} actualValue - The actual string value.
   @param {string} expectedValue - The expected string value.
   @param {string} [customErrorMsg=''] - A custom error message to display if the assertion fails. */
  softExpectEqualIgnoreCase(actualValue, expectedValue, customErrorMsg = '') {
    this.softAssert(() => this.expectEqualIgnoreCase(actualValue, expectedValue, customErrorMsg), customErrorMsg)
  }

  /**
   Softly asserts that two arrays have deep equality, considering members in any order.
   @param {Array} actualValue - The actual array.
   @param {Array} expectedValue - The expected array.
   @param {string} [customErrorMsg=''] - A custom error message to display if the assertion fails. */
  softExpectDeepMembers(actualValue, expectedValue, customErrorMsg = '') {
    this.softAssert(() => this.expectDeepMembers(actualValue, expectedValue, customErrorMsg), customErrorMsg)
  }

  /**
   Softly asserts that an array (superset) deeply includes all members of another array (set).
   @param {Array} superset - The array that should contain the expected members.
   @param {Array} set - The array with members that should be included.
   @param {string} [customErrorMsg=''] - A custom error message to display if the assertion fails. */
  softExpectDeepIncludeMembers(superset, set, customErrorMsg = '') {
    this.softAssert(() => this.expectDeepIncludeMembers(superset, set, customErrorMsg), customErrorMsg)
  }

  /**
   Softly asserts that two objects are deeply equal, excluding specified fields.
   @param {Object} actualValue - The actual object.
   @param {Object} expectedValue - The expected object.
   @param {Array<string>} fieldsToExclude - The fields to exclude from the comparison.
   @param {string} [customErrorMsg=''] - A custom error message to display if the assertion fails. */
  softExpectDeepEqualExcluding(actualValue, expectedValue, fieldsToExclude, customErrorMsg = '') {
    this.softAssert(
      () => this.expectDeepEqualExcluding(actualValue, expectedValue, fieldsToExclude, customErrorMsg),
      customErrorMsg,
    )
  }

  /**
   Softly asserts that a value matches the expected pattern.
   @param {*} actualValue - The actual value.
   @param {*} expectedPattern - The pattern the value should match.
   @param {string} [customErrorMsg=''] - A custom error message to display if the assertion fails. */
  softExpectMatchesPattern(actualValue, expectedPattern, customErrorMsg = '') {
    this.softAssert(() => this.expectMatchesPattern(actualValue, expectedPattern, customErrorMsg), customErrorMsg)
  }
}
module.exports = SoftAssertHelper
