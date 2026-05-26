import Helper from '@codeceptjs/helper'
import assert from 'assert'

class CustomHelper extends Helper {
  // Basic assertion methods
  assertEqual(actual, expected, message) {
    assert.strictEqual(actual, expected, message || `Expected ${actual} to equal ${expected}`)
  }

  assertNotEqual(actual, expected, message) {
    assert.notStrictEqual(actual, expected, message || `Expected ${actual} to not equal ${expected}`)
  }

  assertTrue(value, message) {
    assert.strictEqual(value, true, message || `Expected ${value} to be true`)
  }

  assertFalse(value, message) {
    assert.strictEqual(value, false, message || `Expected ${value} to be false`)
  }

  assertExists(value, message) {
    assert.ok(value, message || `Expected ${value} to exist`)
  }

  assertNotExists(value, message) {
    assert.ok(!value, message || `Expected ${value} to not exist`)
  }

  assertContains(haystack, needle, message) {
    if (Array.isArray(haystack)) {
      assert.ok(haystack.includes(needle), message || `Expected ${JSON.stringify(haystack)} to contain ${needle}`)
    } else if (typeof haystack === 'string') {
      assert.ok(haystack.includes(needle), message || `Expected "${haystack}" to contain "${needle}"`)
    } else {
      throw new Error('assertContains requires array or string as first argument')
    }
  }

  assertNotContains(haystack, needle, message) {
    if (Array.isArray(haystack)) {
      assert.ok(!haystack.includes(needle), message || `Expected ${JSON.stringify(haystack)} to not contain ${needle}`)
    } else if (typeof haystack === 'string') {
      assert.ok(!haystack.includes(needle), message || `Expected "${haystack}" to not contain "${needle}"`)
    } else {
      throw new Error('assertNotContains requires array or string as first argument')
    }
  }

  assertGreaterThan(actual, expected, message) {
    assert.ok(actual > expected, message || `Expected ${actual} to be greater than ${expected}`)
  }

  assertLessThan(actual, expected, message) {
    assert.ok(actual < expected, message || `Expected ${actual} to be less than ${expected}`)
  }

  assertThrows(fn, message) {
    assert.throws(fn, message || 'Expected function to throw')
  }

  assertDoesNotThrow(fn, message) {
    assert.doesNotThrow(fn, message || 'Expected function to not throw')
  }

  // Utility methods
  log(message) {
    console.log(`[CustomHelper] ${message}`)
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  getCurrentTimestamp() {
    return new Date().toISOString()
  }

  generateRandomString(length = 10) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }
}

export default CustomHelper
