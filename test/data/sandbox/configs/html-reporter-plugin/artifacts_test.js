Feature('HTML Reporter with Artifacts Test')

Scenario('test with artifacts', async ({ I }) => {
  I.amInPath('.')
  I.seeFile('codecept.conf.js')
  
  // Simulate adding test artifacts
  const currentTest = global.codecept_dir ? require('../../../../lib/container').get('mocha') : null
  if (currentTest && currentTest.currentTest) {
    currentTest.currentTest.artifacts = currentTest.currentTest.artifacts || []
    currentTest.currentTest.artifacts.push('fake-screenshot-1.png')
    currentTest.currentTest.artifacts.push('fake-screenshot-2.png')
  }
})