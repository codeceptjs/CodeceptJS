Feature('Timeout')

BeforeSuite(() => {
  // No stuff needed here to reproduce the issue
})

Scenario('enforce global timeout with BeforeSuite', ({ I }) => {
  I.waitForSleep(4 * 1000)
})
