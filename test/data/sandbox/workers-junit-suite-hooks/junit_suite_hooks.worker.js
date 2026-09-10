Feature('JunitWorkerSuiteHooks')

BeforeSuite(async () => {
  throw new Error('BeforeSuite worker failure')
})

Scenario('should not be executed either', ({ I }) => {
  I.say('unreachable')
})

AfterSuite(async () => {
  throw new Error('AfterSuite worker failure')
})
