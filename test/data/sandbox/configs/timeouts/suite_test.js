const step = require('codeceptjs/steps')

Feature('no timeout')

Scenario('no timeout test #first', ({ I }) => {
  I.waitForSleep(1000)
})

Scenario('timeout test in 0.5 #second', { timeout: 0.5 }, ({ I }) => {
  I.waitForSleep(1000)
})

Scenario('timeout step in 0.5', ({ I }) => {
  I.limitTime(0.2).waitForSleep(100)
  I.limitTime(0.2).waitForSleep(3000)
})

Scenario('timeout step in 0.5 new syntax', ({ I }) => {
  I.waitForSleep(100, step.timeout(0.2))
  I.waitForSleep(3000, step.timeout(0.2))
})
