const assert = require('assert')

Feature('store-test-and-suite suite')

BeforeSuite(({ suite, test }) => {
  assert.strictEqual(suite.title, 'store-test-and-suite suite')
  assert(!test)
})

Before(({ test }) => {
  assert.strictEqual(test.title, 'test store-test-and-suite test')
  test.artifacts.screenshot = 'screenshot'
})

Scenario('test store-test-and-suite test', ({ test }) => {
  assert.strictEqual(test.title, 'test store-test-and-suite test')
  assert(test.artifacts)
  assert(test.meta)
  assert.strictEqual(test.artifacts.screenshot, 'screenshot')
  test.meta.browser = 'chrome'
})

After(({ test }) => {
  assert.strictEqual(test.meta.browser, 'chrome')
})
