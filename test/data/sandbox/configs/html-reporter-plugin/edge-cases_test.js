Feature('HTML Reporter Edge Cases')

Scenario('test with special characters <>&"\'', ({ I }) => {
  I.amInPath('.')
  I.seeFile('package.json')
})

Scenario('test with very long name that should be handled properly without breaking the layout or causing any rendering issues in the HTML report', ({ I }) => {
  I.amInPath('.')
  I.seeFile('codecept.conf.js')
})

Scenario('test with unicode characters 测试 🎉 ñoño', ({ I }) => {
  I.amInPath('.')
  I.seeFile('package.json')
})

Scenario('@tag1 @tag2 @critical test with multiple tags', ({ I }) => {
  I.amInPath('.')
  I.seeFile('codecept.conf.js')
})

Scenario('test with metadata', ({ I }) => {
  I.amInPath('.')
  I.seeFile('package.json')
}).tag('@smoke').tag('@regression')

Scenario('test that takes longer to execute', async ({ I }) => {
  I.amInPath('.')
  await new Promise(resolve => setTimeout(resolve, 500))
  I.seeFile('package.json')
})

Scenario('test with nested error', ({ I }) => {
  I.amInPath('.')
  try {
    throw new Error('Nested error with <html> tags & special chars')
  } catch (e) {
    // This will fail
    I.seeFile('non-existent-file-with-error.txt')
  }
})
