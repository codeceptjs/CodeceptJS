const step = require('codeceptjs/steps')
Feature('step-enhancements')

Scenario('test step opts', ({ I }) => {
  I.printOption(step.opts({ text: 'Hello' }))
})

Scenario('test step timeouts', ({ I }) => {
  I.wait(1000, step.timeout(0.1))
})

Scenario('test step retry', ({ I }) => {
  I.retryFewTimesAndPass(3, step.retry(4))
})
