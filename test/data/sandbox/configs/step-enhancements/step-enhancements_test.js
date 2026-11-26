import step from 'codeceptjs/steps';
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

Scenario('test step custom message', ({ I }) => {
  I.failWithDetails(step.customMessage('Checkout never loaded'))
})

Scenario('test assertion custom message', ({ I }) => {
  I.seeFile('codecept.conf.js')
  I.seeInThisFile('Paid', step.customMessage('Order never reached paid'))
})
