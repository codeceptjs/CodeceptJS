Feature('HTML Reporter with Artifacts Test')

Scenario('test with artifacts', async ({ I }) => {
  I.amInPath('.')
  I.seeFile('codecept.conf.js')

  // Simulate adding test artifacts
  const container = require('../../../../../lib/container')
  try {
    const currentTest = container.mocha().currentTest
    if (currentTest) {
      currentTest.artifacts = currentTest.artifacts || []
      currentTest.artifacts.push('fake-screenshot-1.png')
      currentTest.artifacts.push('fake-screenshot-2.png')
    }
  } catch (e) {
    // Ignore if container not available
  }
})
