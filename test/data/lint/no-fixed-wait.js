Feature('waits')

Scenario('fixed wait', ({ I }) => {
  I.amOnPage('/')
  I.wait(5)
  I.waitForElement('#ok', 5)
  I.wait(waitTime)
})
