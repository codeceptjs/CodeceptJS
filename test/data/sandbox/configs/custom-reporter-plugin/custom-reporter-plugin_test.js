Feature('custom-reporter-plugin')

BeforeSuite(({ I }) => {
  I.say('I print before suite hook')
})

Before(({ I }) => {
  I.say('I print before hook')
})

Scenario('test custom-reporter-plugin', ({ I }) => {
  I.amInPath('.')
  I.seeFile('this-file-should-not-exist.txt')
})

After(({ I }) => {
  I.say('I print after hook')
})

AfterSuite(({ I }) => {
  I.say('I print after suite hook')
})
