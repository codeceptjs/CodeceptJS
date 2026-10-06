Feature('existing')

Scenario('existing', ({ I }) => {
  I.amOnPage('/')
  I.wait(5)
  I.see('Welcome')
})
